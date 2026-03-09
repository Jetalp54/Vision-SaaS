import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { ulid } from 'ulid';
import { eq } from 'drizzle-orm';
import type { Bindings, Variables } from '../types';
import { imageJobs } from '../db/schema';
import {
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZE_BYTES,
  buildR2Key,
  createSignedUploadUrl,
} from '../lib/r2';
import { AppError } from '../middleware/error-handler';
import { ErrorCode } from '@vision-saas/types';

const upload = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// ─── POST /upload/presign ─────────────────────────────────────────────────────
// Returns a signed R2 PUT URL so the client can upload directly to R2.
// Also creates an image_jobs record in D1 with status=pending.

const presignSchema = z.object({
  filename: z.string().min(1).max(255),
  mimeType: z.string().refine((v) => ALLOWED_MIME_TYPES.has(v), {
    message: `mimeType must be one of: ${[...ALLOWED_MIME_TYPES].join(', ')}`,
  }),
  sizeBytes: z
    .number()
    .int()
    .positive()
    .max(MAX_FILE_SIZE_BYTES, {
      message: `File size must not exceed ${MAX_FILE_SIZE_BYTES / 1024 / 1024} MB`,
    }),
  jobType: z.enum(['image_to_prompt', 'image_to_text', 'ocr']),
});

upload.post(
  '/presign',
  zValidator('json', presignSchema),
  async (ctx) => {
    const userId = ctx.get('userId');
    if (!userId) throw AppError.unauthorized();

    const { filename, mimeType, sizeBytes, jobType } = ctx.req.valid('json');
    const db = ctx.get('db');
    const requestId = ctx.get('requestId');

    const jobId = ulid();
    const r2Key = buildR2Key(userId, jobId, filename);

    // Create the job record first (idempotent anchor)
    await db.insert(imageJobs).values({
      id: jobId,
      userId,
      type: jobType,
      status: 'pending',
      r2Key,
      inputMimeType: mimeType,
      inputSizeBytes: sizeBytes,
    });

    // Generate signed upload URL (15-minute TTL)
    const { url: uploadUrl, expiresAt } = await createSignedUploadUrl({
      env: ctx.env,
      r2Key,
      mimeType,
      ttlSeconds: 900,
    });

    // Cache the pending job in KV for fast status polling
    await ctx.env.METADATA_KV.put(
      `job:${jobId}:status`,
      'pending',
      { expirationTtl: 86400 },
    );

    return ctx.json(
      {
        success: true,
        data: { uploadUrl, r2Key, jobId, expiresAt },
        requestId,
      },
      201,
    );
  },
);

// ─── POST /upload/confirm ─────────────────────────────────────────────────────
// Called by the client after a successful direct R2 PUT to confirm the upload.

const confirmSchema = z.object({
  jobId: z.string().min(1),
});

upload.post(
  '/confirm',
  zValidator('json', confirmSchema),
  async (ctx) => {
    const userId = ctx.get('userId');
    if (!userId) throw AppError.unauthorized();

    const { jobId } = ctx.req.valid('json');
    const db = ctx.get('db');
    const requestId = ctx.get('requestId');

    const [job] = await db
      .select()
      .from(imageJobs)
      .where(eq(imageJobs.id, jobId))
      .limit(1);

    if (!job) throw AppError.notFound('job');
    if (job.userId !== userId) throw AppError.forbidden();
    if (job.status !== 'pending') {
      throw new AppError(
        ErrorCode.VALIDATION_ERROR,
        409,
        'Conflict',
        `Job is already in status '${job.status}'.`,
      );
    }

    // Verify the object actually landed in R2
    const obj = await ctx.env.IMAGES_BUCKET.head(job.r2Key);
    if (!obj) {
      throw new AppError(
        ErrorCode.UPLOAD_FAILED,
        422,
        'Upload Not Found',
        'The upload could not be confirmed. Please re-upload the file.',
      );
    }

    await db
      .update(imageJobs)
      .set({ status: 'processing', updatedAt: new Date() })
      .where(eq(imageJobs.id, jobId));

    await ctx.env.METADATA_KV.put(
      `job:${jobId}:status`,
      'processing',
      { expirationTtl: 86400 },
    );

    return ctx.json(
      {
        success: true,
        data: { jobId, status: 'processing' },
        requestId,
      },
      200,
    );
  },
);

export { upload };
