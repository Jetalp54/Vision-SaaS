import type { Context, Next } from 'hono';
import { ZodError } from 'zod';
import { ErrorCode, ErrorTypeUri } from '@vision-saas/types';
import type { Bindings, Variables } from '../types';

// ─── RFC 7807 Problem Details Response Builder ────────────────────────────────

export function buildProblemDetail(
  ctx: Context<{ Bindings: Bindings; Variables: Variables }>,
  opts: {
    code: ErrorCode;
    status: number;
    title: string;
    detail: string;
    errors?: Array<{ field: string; message: string; code: string }>;
  },
) {
  const requestId = ctx.get('requestId') ?? crypto.randomUUID();
  return ctx.json(
    {
      success: false,
      type: ErrorTypeUri[opts.code],
      title: opts.title,
      status: opts.status,
      detail: opts.detail,
      instance: ctx.req.path,
      requestId,
      ...(opts.errors ? { errors: opts.errors } : {}),
    },
    opts.status as Parameters<typeof ctx.json>[1],
  );
}

// ─── Global Error Handler Middleware ─────────────────────────────────────────

export async function errorHandler(
  ctx: Context<{ Bindings: Bindings; Variables: Variables }>,
  next: Next,
) {
  try {
    await next();
  } catch (err) {
    // Zod validation errors
    if (err instanceof ZodError) {
      return buildProblemDetail(ctx, {
        code: ErrorCode.VALIDATION_ERROR,
        status: 422,
        title: 'Validation Error',
        detail: 'One or more request fields failed validation.',
        errors: err.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
          code: e.code,
        })),
      });
    }

    // Known application errors re-thrown as AppError
    if (err instanceof AppError) {
      return buildProblemDetail(ctx, {
        code: err.code,
        status: err.status,
        title: err.title,
        detail: err.message,
      });
    }

    // Unexpected errors — mask internals in production
    const env = ctx.env.ENVIRONMENT;
    console.error('[unhandled]', err);
    return buildProblemDetail(ctx, {
      code: ErrorCode.INTERNAL_ERROR,
      status: 500,
      title: 'Internal Server Error',
      detail:
        env === 'production'
          ? 'An unexpected error occurred. Please try again later.'
          : String(err),
    });
  }
}

// ─── Typed Application Error ──────────────────────────────────────────────────

export class AppError extends Error {
  constructor(
    public readonly code: ErrorCode,
    public readonly status: number,
    public readonly title: string,
    message: string,
  ) {
    super(message);
    this.name = 'AppError';
  }

  static unauthorized(detail = 'Authentication required.') {
    return new AppError(ErrorCode.UNAUTHORIZED, 401, 'Unauthorized', detail);
  }

  static forbidden(detail = 'You do not have permission to perform this action.') {
    return new AppError(ErrorCode.FORBIDDEN, 403, 'Forbidden', detail);
  }

  static notFound(resource: string) {
    return new AppError(
      resource === 'job' ? ErrorCode.JOB_NOT_FOUND : ErrorCode.USER_NOT_FOUND,
      404,
      'Not Found',
      `The requested ${resource} could not be found.`,
    );
  }

  static rateLimitExceeded() {
    return new AppError(
      ErrorCode.RATE_LIMIT_EXCEEDED,
      429,
      'Too Many Requests',
      'Rate limit exceeded. Please slow down your requests.',
    );
  }

  static creditLimitExceeded() {
    return new AppError(
      ErrorCode.CREDIT_LIMIT_EXCEEDED,
      402,
      'Credit Limit Exceeded',
      'You have exhausted your monthly AI credits. Please upgrade your plan.',
    );
  }
}
