import type { Bindings } from '../types';

// ─── KV Key Builders ──────────────────────────────────────────────────────────

export const KVKeys = {
  jobStatus: (jobId: string) => `job:${jobId}:status`,
  jobResult: (jobId: string) => `job:${jobId}:result`,
  idempotency: (requestId: string) => `idempotent:${requestId}`,
  rateLimit: (userId: string) => `rl:${userId}`,
  userCredits: (userId: string) => `credits:${userId}`,
} as const;

// ─── TTL Constants (seconds) ──────────────────────────────────────────────────

export const KVTtl = {
  jobStatus: 86_400,        // 24 hours
  jobResult: 7 * 86_400,   // 7 days
  idempotency: 3_600,       // 1 hour
  userCredits: 300,         // 5 minutes
} as const;

// ─── Generic Typed Get/Put ────────────────────────────────────────────────────

export async function kvGet<T>(
  kv: KVNamespace,
  key: string,
): Promise<T | null> {
  const raw = await kv.get(key, 'text');
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    // Plain string value
    return raw as unknown as T;
  }
}

export async function kvPut<T>(
  kv: KVNamespace,
  key: string,
  value: T,
  ttlSeconds?: number,
): Promise<void> {
  const serialized = typeof value === 'string' ? value : JSON.stringify(value);
  await kv.put(key, serialized, ttlSeconds ? { expirationTtl: ttlSeconds } : undefined);
}

export async function kvDelete(kv: KVNamespace, key: string): Promise<void> {
  await kv.delete(key);
}

// ─── Idempotency Cache ────────────────────────────────────────────────────────
//
// Prevents duplicate AI processing on retried requests.
// Cache the full response body for `ttlSeconds` using the request's X-Request-ID.

export async function getIdempotentResponse<T>(
  env: Bindings,
  requestId: string,
): Promise<T | null> {
  return kvGet<T>(env.METADATA_KV, KVKeys.idempotency(requestId));
}

export async function setIdempotentResponse<T>(
  env: Bindings,
  requestId: string,
  response: T,
): Promise<void> {
  await kvPut(env.METADATA_KV, KVKeys.idempotency(requestId), response, KVTtl.idempotency);
}

// ─── Job Status Cache ─────────────────────────────────────────────────────────

export async function getJobStatus(
  env: Bindings,
  jobId: string,
): Promise<string | null> {
  return kvGet<string>(env.METADATA_KV, KVKeys.jobStatus(jobId));
}

export async function setJobStatus(
  env: Bindings,
  jobId: string,
  status: 'pending' | 'processing' | 'completed' | 'failed',
): Promise<void> {
  await kvPut(env.METADATA_KV, KVKeys.jobStatus(jobId), status, KVTtl.jobStatus);
}

// ─── User Credit Cache ────────────────────────────────────────────────────────

export interface CreditInfo {
  monthly: number;
  used: number;
  remaining: number;
}

export async function getCachedCredits(
  env: Bindings,
  userId: string,
): Promise<CreditInfo | null> {
  return kvGet<CreditInfo>(env.METADATA_KV, KVKeys.userCredits(userId));
}

export async function setCachedCredits(
  env: Bindings,
  userId: string,
  info: CreditInfo,
): Promise<void> {
  await kvPut(env.METADATA_KV, KVKeys.userCredits(userId), info, KVTtl.userCredits);
}

export async function invalidateCreditCache(env: Bindings, userId: string): Promise<void> {
  await kvDelete(env.METADATA_KV, KVKeys.userCredits(userId));
}
