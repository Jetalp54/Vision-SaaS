import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { ulid } from 'ulid';
import { eq, and, desc, count } from 'drizzle-orm';
import type { Bindings, Variables } from '../types';
import { imageJobs, promptHistory } from '../db/schema';
import { imageToPrompt, imageToText } from '../lib/ai';
import { AppError } from '../middleware/error-handler';
import { ErrorCode } from '@vision-saas/types';

const jobs = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// ─── GET /jobs ────────────────────────────────────────────────────────────────

const listSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(['pending', 'processing', 'completed', 'failed']).optional(),
});

jobs.get('/', zValidator('query', listSchema), async (ctx) => {
  const userId = ctx.get('userId');
  if (!userId) throw AppError.unauthorized();

  const { page, pageSize, status } = ctx.req.valid('query');
  const db = ctx.get('db');
  const requestId = ctx.get('requestId');
  const offset = (page - 1) * pageSize;

  const conditions = status
    ? and(eq(imageJobs.userId, userId), eq(imageJobs.status, status))
    : eq(imageJobs.userId, userId);

  const rows = await db
    .select()
    .from(imageJobs)
    .where(conditions)
    .orderBy(desc(imageJobs.createdAt))
    .limit(pageSize)
    .offset(offset);

  // Accurate total count using a separate COUNT query
  const totalResult = await db
    .select({ total: count() })
    .from(imageJobs)
    .where(conditions);
  const total = totalResult[0]?.total ?? 0;

  return ctx.json({
    success: true,
    data: { jobs: rows, total, page, pageSize },
    requestId,
  });
});

// ─── GET /jobs/:id ────────────────────────────────────────────────────────────

jobs.get('/:id', async (ctx) => {
  const userId = ctx.get('userId');
  if (!userId) throw AppError.unauthorized();

  const db = ctx.get('db');
  const requestId = ctx.get('requestId');

  const [job] = await db
    .select()
    .from(imageJobs)
    .where(and(eq(imageJobs.id, ctx.req.param('id')), eq(imageJobs.userId, userId)))
    .limit(1);

  if (!job) throw AppError.notFound('job');

  // Fetch associated prompt history entries
  const history = await db
    .select()
    .from(promptHistory)
    .where(eq(promptHistory.jobId, job.id))
    .orderBy(desc(promptHistory.createdAt));

  return ctx.json({
    success: true,
    data: { job, history },
    requestId,
  });
});

// ─── POST /jobs/:id/process ───────────────────────────────────────────────────

const processSchema = z.object({
  options: z
    .object({
      language: z.string().optional(),
      outputFormat: z.enum(['markdown', 'plain', 'json']).optional(),
      maxTokens: z.number().int().min(64).max(4096).optional(),
    })
    .optional(),
});

jobs.post('/:id/process', zValidator('json', processSchema), async (ctx) => {
  const userId = ctx.get('userId');
  if (!userId) throw AppError.unauthorized();

  const db = ctx.get('db');
  const requestId = ctx.get('requestId');
  const jobId = ctx.req.param('id');
  const { options } = ctx.req.valid('json');

  const [job] = await db
    .select()
    .from(imageJobs)
    .where(and(eq(imageJobs.id, jobId), eq(imageJobs.userId, userId)))
    .limit(1);

  if (!job) throw AppError.notFound('job');

  if (job.status === 'completed') {
    // Return cached result — idempotent
    const [existing] = await db
      .select()
      .from(promptHistory)
      .where(eq(promptHistory.jobId, jobId))
      .orderBy(desc(promptHistory.createdAt))
      .limit(1);
    return ctx.json({
      success: true,
      data: { job, result: existing ?? null },
      requestId,
    });
  }

  if (job.status === 'failed') {
    throw new AppError(
      ErrorCode.AI_PROCESSING_FAILED,
      409,
      'Job Already Failed',
      'This job previously failed. Please create a new job.',
    );
  }

  if (job.status === 'processing') {
    throw new AppError(
      ErrorCode.VALIDATION_ERROR,
      409,
      'Job Already Processing',
      'This job is currently being processed. Please wait for it to complete.',
    );
  }

  // Fetch image bytes from R2
  const obj = await ctx.env.IMAGES_BUCKET.get(job.r2Key);
  if (!obj) throw AppError.notFound('job');

  const imageBytes = new Uint8Array(await obj.arrayBuffer());
  const startMs = Date.now();

  let aiResult: { text: string; model: string; tokensUsed: number | null };

  try {
    if (job.type === 'image_to_prompt') {
      aiResult = await imageToPrompt(ctx.env, {
        imageBytes,
        mimeType: job.inputMimeType,
        ...(options?.maxTokens !== undefined ? { maxTokens: options.maxTokens } : {}),
      });
    } else {
      // image_to_text and ocr both use imageToText
      aiResult = await imageToText(ctx.env, {
        imageBytes,
        mimeType: job.inputMimeType,
        ...(options?.language !== undefined ? { language: options.language } : {}),
        ...(options?.outputFormat !== undefined ? { outputFormat: options.outputFormat } : {}),
        ...(options?.maxTokens !== undefined ? { maxTokens: options.maxTokens } : {}),
      });
    }
  } catch (err) {
    // Mark job as failed in D1 and KV
    await db
      .update(imageJobs)
      .set({
        status: 'failed',
        errorMessage: err instanceof Error ? err.message : 'Unknown AI error',
        processingMs: Date.now() - startMs,
        updatedAt: new Date(),
      })
      .where(eq(imageJobs.id, jobId));
    await ctx.env.METADATA_KV.put(`job:${jobId}:status`, 'failed', {
      expirationTtl: 86400,
    });
    throw err;
  }

  const processingMs = Date.now() - startMs;
  const historyId = ulid();

  // Persist result in a transaction-like sequence (D1 is eventually consistent)
  await db
    .update(imageJobs)
    .set({
      status: 'completed',
      modelUsed: aiResult.model,
      tokensUsed: aiResult.tokensUsed,
      processingMs,
      updatedAt: new Date(),
    })
    .where(eq(imageJobs.id, jobId));

  await db.insert(promptHistory).values({
    id: historyId,
    jobId,
    userId,
    promptText: aiResult.text,
    confidence: null,
    tags: null,
    isFavorited: false,
  });

  await ctx.env.METADATA_KV.put(`job:${jobId}:status`, 'completed', {
    expirationTtl: 86400,
  });

  const [result] = await db
    .select()
    .from(promptHistory)
    .where(eq(promptHistory.id, historyId))
    .limit(1);

  return ctx.json({
    success: true,
    data: {
      job: { ...job, status: 'completed', modelUsed: aiResult.model, processingMs },
      result: result ?? null,
    },
    requestId,
  });
});

// ─── PATCH /jobs/:id/history/:historyId/favorite ─────────────────────────────

jobs.patch('/:id/history/:historyId/favorite', async (ctx) => {
  const userId = ctx.get('userId');
  if (!userId) throw AppError.unauthorized();

  const db = ctx.get('db');
  const requestId = ctx.get('requestId');
  const { id: jobId, historyId } = ctx.req.param();

  // Verify the parent job belongs to the authenticated user
  const [job] = await db
    .select()
    .from(imageJobs)
    .where(and(eq(imageJobs.id, jobId), eq(imageJobs.userId, userId)))
    .limit(1);

  if (!job) throw AppError.notFound('job');

  const [entry] = await db
    .select()
    .from(promptHistory)
    .where(and(eq(promptHistory.id, historyId), eq(promptHistory.userId, userId)))
    .limit(1);

  if (!entry) throw AppError.notFound('history entry');

  await db
    .update(promptHistory)
    .set({ isFavorited: !entry.isFavorited })
    .where(eq(promptHistory.id, historyId));

  return ctx.json({
    success: true,
    data: { id: historyId, jobId, isFavorited: !entry.isFavorited },
    requestId,
  });
});

export { jobs };
