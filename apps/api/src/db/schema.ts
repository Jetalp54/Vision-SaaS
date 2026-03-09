import { sql } from 'drizzle-orm';
import {
  integer,
  real,
  sqliteTable,
  text,
} from 'drizzle-orm/sqlite-core';

// ─── Users ────────────────────────────────────────────────────────────────────

export const users = sqliteTable('users', {
  id: text('id').primaryKey(), // ULID
  email: text('email').notNull().unique(),
  name: text('name'),
  role: text('role', { enum: ['admin', 'user'] })
    .notNull()
    .default('user'),
  status: text('status', { enum: ['active', 'suspended', 'pending'] })
    .notNull()
    .default('pending'),
  tier: text('tier', { enum: ['free', 'pro', 'enterprise'] })
    .notNull()
    .default('free'),
  monthlyCredits: integer('monthly_credits').notNull().default(50),
  usedCredits: integer('used_credits').notNull().default(0),
  createdAt: integer('created_at', { mode: 'timestamp_ms' })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
});

// ─── Image Jobs ───────────────────────────────────────────────────────────────

export const imageJobs = sqliteTable('image_jobs', {
  id: text('id').primaryKey(), // ULID
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  type: text('type', {
    enum: ['image_to_prompt', 'image_to_text', 'ocr'],
  }).notNull(),
  status: text('status', {
    enum: ['pending', 'processing', 'completed', 'failed'],
  })
    .notNull()
    .default('pending'),
  r2Key: text('r2_key').notNull(),
  r2Url: text('r2_url'),
  inputMimeType: text('input_mime_type').notNull(),
  inputSizeBytes: integer('input_size_bytes').notNull(),
  modelUsed: text('model_used'),
  tokensUsed: integer('tokens_used'),
  processingMs: integer('processing_ms'),
  errorMessage: text('error_message'),
  // Arbitrary JSON metadata (e.g. EXIF, job options)
  metadata: text('metadata'),
  createdAt: integer('created_at', { mode: 'timestamp_ms' })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
});

// ─── Prompt History ───────────────────────────────────────────────────────────

export const promptHistory = sqliteTable('prompt_history', {
  id: text('id').primaryKey(), // ULID
  jobId: text('job_id')
    .notNull()
    .references(() => imageJobs.id, { onDelete: 'cascade' }),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  promptText: text('prompt_text').notNull(),
  // Confidence score from the model (0.0–1.0), stored as REAL
  confidence: real('confidence'),
  // JSON array of string tags e.g. '["landscape","sunset","golden-hour"]'
  tags: text('tags'),
  isFavorited: integer('is_favorited', { mode: 'boolean' })
    .notNull()
    .default(false),
  createdAt: integer('created_at', { mode: 'timestamp_ms' })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
});

// ─── Drizzle Inferred Types ───────────────────────────────────────────────────

export type UserRecord = typeof users.$inferSelect;
export type NewUserRecord = typeof users.$inferInsert;

export type ImageJobRecord = typeof imageJobs.$inferSelect;
export type NewImageJobRecord = typeof imageJobs.$inferInsert;

export type PromptHistoryRecord = typeof promptHistory.$inferSelect;
export type NewPromptHistoryRecord = typeof promptHistory.$inferInsert;
