import { Hono } from 'hono';
import type { Bindings, Variables } from '../types';

const health = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// GET /health
health.get('/', async (ctx) => {
  const requestId = ctx.get('requestId');

  // Probe each service in parallel — failures are caught individually
  const [d1Status, kvStatus, r2Status] = await Promise.all([
    ctx.env.DB.prepare('SELECT 1').first()
      .then(() => 'ok' as const)
      .catch(() => 'error' as const),
    ctx.env.METADATA_KV.get('__health__')
      .then(() => 'ok' as const)
      .catch(() => 'error' as const),
    ctx.env.IMAGES_BUCKET.head('__health__')
      .then(() => 'ok' as const)
      .catch(() => 'ok' as const), // 404 from R2 still means R2 is reachable
  ]);

  const services = {
    d1: d1Status,
    kv: kvStatus,
    r2: r2Status,
    ai: 'ok' as const, // AI binding has no cheap probe; assume ok
  };

  const degraded = Object.values(services).some((s) => s === 'error');

  return ctx.json(
    {
      success: true,
      data: {
        status: degraded ? 'degraded' : 'ok',
        version: '1.0.0',
        timestamp: Date.now(),
        services,
      },
      requestId,
    },
    degraded ? 503 : 200,
  );
});

export { health };
