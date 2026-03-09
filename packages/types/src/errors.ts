// ─── Application Error Codes ──────────────────────────────────────────────────

export const ErrorCode = {
  // Auth
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  // Validation
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_MIME_TYPE: 'INVALID_MIME_TYPE',
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',
  // Resources
  JOB_NOT_FOUND: 'JOB_NOT_FOUND',
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  // Rate Limiting
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  CREDIT_LIMIT_EXCEEDED: 'CREDIT_LIMIT_EXCEEDED',
  // AI / Processing
  AI_PROCESSING_FAILED: 'AI_PROCESSING_FAILED',
  AI_GATEWAY_ERROR: 'AI_GATEWAY_ERROR',
  MODEL_UNAVAILABLE: 'MODEL_UNAVAILABLE',
  // Storage
  UPLOAD_FAILED: 'UPLOAD_FAILED',
  SIGNED_URL_EXPIRED: 'SIGNED_URL_EXPIRED',
  // Internal
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;

export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode];

// ─── RFC 7807 Error Type URIs ─────────────────────────────────────────────────

export const ErrorTypeUri: Record<ErrorCode, string> = {
  UNAUTHORIZED: 'https://vision-saas.dev/errors/unauthorized',
  FORBIDDEN: 'https://vision-saas.dev/errors/forbidden',
  VALIDATION_ERROR: 'https://vision-saas.dev/errors/validation-error',
  INVALID_MIME_TYPE: 'https://vision-saas.dev/errors/invalid-mime-type',
  FILE_TOO_LARGE: 'https://vision-saas.dev/errors/file-too-large',
  JOB_NOT_FOUND: 'https://vision-saas.dev/errors/job-not-found',
  USER_NOT_FOUND: 'https://vision-saas.dev/errors/user-not-found',
  RATE_LIMIT_EXCEEDED: 'https://vision-saas.dev/errors/rate-limit-exceeded',
  CREDIT_LIMIT_EXCEEDED: 'https://vision-saas.dev/errors/credit-limit-exceeded',
  AI_PROCESSING_FAILED: 'https://vision-saas.dev/errors/ai-processing-failed',
  AI_GATEWAY_ERROR: 'https://vision-saas.dev/errors/ai-gateway-error',
  MODEL_UNAVAILABLE: 'https://vision-saas.dev/errors/model-unavailable',
  UPLOAD_FAILED: 'https://vision-saas.dev/errors/upload-failed',
  SIGNED_URL_EXPIRED: 'https://vision-saas.dev/errors/signed-url-expired',
  INTERNAL_ERROR: 'https://vision-saas.dev/errors/internal-error',
};
