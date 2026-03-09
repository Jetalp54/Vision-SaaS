import type { Context, Next } from 'hono';
import { cors } from 'hono/cors';
import type { Bindings, Variables } from '../types';
import { AppError } from './error-handler';

// ─── Security Headers Middleware ──────────────────────────────────────────────

export async function securityHeaders(
  ctx: Context<{ Bindings: Bindings; Variables: Variables }>,
  next: Next,
) {
  await next();
  // HTTP Strict Transport Security — 1 year, include subdomains
  ctx.res.headers.set(
    'Strict-Transport-Security',
    'max-age=31536000; includeSubDomains; preload',
  );
  // Content Security Policy — tight default for API-only worker
  ctx.res.headers.set(
    'Content-Security-Policy',
    "default-src 'none'; frame-ancestors 'none'",
  );
  ctx.res.headers.set('X-Frame-Options', 'DENY');
  ctx.res.headers.set('X-Content-Type-Options', 'nosniff');
  ctx.res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  ctx.res.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=()',
  );
}

// ─── CORS Factory ─────────────────────────────────────────────────────────────

export function buildCors(origin: string) {
  return cors({
    origin,
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization', 'X-Request-ID', 'X-User-ID'],
    exposeHeaders: ['X-Request-ID', 'X-RateLimit-Remaining'],
    maxAge: 86400,
    credentials: true,
  });
}

// ─── Rate Limiting Middleware ─────────────────────────────────────────────────

export async function rateLimiter(
  ctx: Context<{ Bindings: Bindings; Variables: Variables }>,
  next: Next,
) {
  // Rate Limiting binding is optional in some environments.
  if (!ctx.env.RATE_LIMITER) {
    await next();
    return;
  }
  const { success } = await ctx.env.RATE_LIMITER.limit({
    key: ctx.req.header('CF-Connecting-IP') ?? 'unknown',
  });
  if (!success) {
    throw AppError.rateLimitExceeded();
  }
  await next();
}

// ─── Request ID Middleware ────────────────────────────────────────────────────

export async function requestId(
  ctx: Context<{ Bindings: Bindings; Variables: Variables }>,
  next: Next,
) {
  const id =
    ctx.req.header('X-Request-ID') ?? crypto.randomUUID();
  ctx.set('requestId', id);
  ctx.res.headers.set('X-Request-ID', id);
  await next();
}
