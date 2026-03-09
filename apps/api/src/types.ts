import type { Database } from './db/client';

// ─── Cloudflare Worker Bindings ───────────────────────────────────────────────

export interface Bindings {
  // Cloudflare D1 — relational database
  DB: D1Database;
  // Workers KV — global metadata & idempotency cache
  METADATA_KV: KVNamespace;
  // R2 — image object storage
  IMAGES_BUCKET: R2Bucket;
  // Cloudflare AI — LLaVA + OCR models
  AI: Ai;
  // Native Rate Limiting API
  RATE_LIMITER?: RateLimit;
  // Environment variables
  ENVIRONMENT: 'development' | 'staging' | 'production';
  AI_GATEWAY_ACCOUNT_ID: string;
  AI_GATEWAY_ID: string;
  R2_PUBLIC_URL: string;
  CORS_ORIGIN: string;
}

// ─── Hono Context Variables ───────────────────────────────────────────────────

export interface Variables {
  db: Database;
  requestId: string;
  // Populated by auth middleware
  userId?: string;
  userTier?: 'free' | 'pro' | 'enterprise';
}
