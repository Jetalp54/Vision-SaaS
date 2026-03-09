import type { Context, Next } from 'hono';
import { createDb } from '../db/client';
import type { Bindings, Variables } from '../types';

// ─── Drizzle DB Injection Middleware ──────────────────────────────────────────

export async function injectDb(
  ctx: Context<{ Bindings: Bindings; Variables: Variables }>,
  next: Next,
) {
  ctx.set('db', createDb(ctx.env.DB));
  await next();
}
