import type { ImageJob, JobType, PromptHistory, User } from './db';

// ─── Generic API Envelope ─────────────────────────────────────────────────────

export interface ApiSuccess<T> {
  success: true;
  data: T;
  requestId: string;
}

export interface ApiError {
  success: false;
  // RFC 7807 Problem Details
  type: string;
  title: string;
  status: number;
  detail: string;
  instance: string;
  requestId: string;
  errors?: ValidationError[];
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

// ─── Upload ───────────────────────────────────────────────────────────────────

export interface PresignedUploadRequest {
  filename: string;
  mimeType: string;
  sizeBytes: number;
  jobType: JobType;
}

export interface PresignedUploadResponse {
  uploadUrl: string;   // Signed R2 PUT URL
  r2Key: string;
  jobId: string;
  expiresAt: number;   // Unix timestamp (ms)
}

// ─── Jobs ─────────────────────────────────────────────────────────────────────

export interface ProcessJobRequest {
  jobId: string;
  options?: {
    language?: string;       // For OCR
    outputFormat?: 'markdown' | 'plain' | 'json';
    maxTokens?: number;
  };
}

export interface ProcessJobResponse {
  job: ImageJob;
  result: PromptHistoryResult | null;
}

export interface PromptHistoryResult {
  id: string;
  promptText: string;
  confidence: number | null;
  tags: string[];
  isFavorited: boolean;
}

export interface ListJobsResponse {
  jobs: ImageJob[];
  total: number;
  page: number;
  pageSize: number;
}

// ─── Auth / Users ─────────────────────────────────────────────────────────────

export interface GetMeResponse {
  user: User;
  remainingCredits: number;
}

// ─── Health ───────────────────────────────────────────────────────────────────

export interface HealthResponse {
  status: 'ok' | 'degraded';
  version: string;
  timestamp: number;
  services: {
    d1: 'ok' | 'error';
    r2: 'ok' | 'error';
    kv: 'ok' | 'error';
    ai: 'ok' | 'error';
  };
}
