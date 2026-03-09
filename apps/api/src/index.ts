import { Hono } from 'hono';
import type { Bindings, Variables } from './types';
import { errorHandler } from './middleware/error-handler';
import { securityHeaders, buildCors, rateLimiter, requestId } from './middleware/security';
import { injectDb } from './middleware/db';
import { requireAuth } from './middleware/auth';
import { health } from './routes/health';
import { upload } from './routes/upload';
import { jobs } from './routes/jobs';

// ─── App Factory ──────────────────────────────────────────────────────────────

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// ── Global Middleware Stack (order matters) ────────────────────────────────────
app.use('*', requestId);
app.use('*', async (ctx, next) => {
  // CORS: origin is injected from env at runtime
  return buildCors(ctx.env.CORS_ORIGIN)(ctx, next);
});
app.use('*', securityHeaders);
app.use('*', errorHandler);
app.use('*', rateLimiter);
app.use('*', injectDb);

// ── Authentication ───────────────────────────────────────────────────────────
// Uses Cloudflare Access JWT validation in staging/production.
// In development, reads the X-User-ID header (see middleware/auth.ts).
app.use('/api/v1/*', requireAuth);

// ── Routes ────────────────────────────────────────────────────────────────────
app.route('/health', health);
app.route('/api/v1/upload', upload);
app.route('/api/v1/jobs', jobs);

// ── 404 Fallthrough ───────────────────────────────────────────────────────────
app.notFound((ctx) => {
  return ctx.json(
    {
      success: false,
      type: 'https://vision-saas.dev/errors/not-found',
      title: 'Not Found',
      status: 404,
      detail: `Route ${ctx.req.method} ${ctx.req.path} not found.`,
      instance: ctx.req.path,
      requestId: ctx.get('requestId') ?? crypto.randomUUID(),
    },
    404,
  );
});

export default app;
