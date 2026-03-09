import type {
  ApiResponse,
  PresignedUploadRequest,
  PresignedUploadResponse,
  ProcessJobRequest,
  ProcessJobResponse,
  ListJobsResponse,
  HealthResponse,
} from '@vision-saas/types';

// ─── Base Client ──────────────────────────────────────────────────────────────

const API_BASE_URL =
  process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:8787';

/**
 * Returns the current user ID.
 * - In production: Cloudflare Access injects a JWT; the Worker extracts it.
 *   The frontend doesn't need to send a user ID — the Worker reads the CF-Access-JWT-Assertion header.
 * - In development: we read from localStorage (set by the /login page).
 */
export function getDevUserId(): string {
  if (typeof window === 'undefined') return 'ssr-placeholder';
  return localStorage.getItem('dev_user_id') ?? 'demo-user-001';
}

async function apiFetch<T>(
  path: string,
  init?: RequestInit & { userId?: string },
): Promise<ApiResponse<T>> {
  const { userId, ...fetchInit } = init ?? {};

  const headers = new Headers(fetchInit.headers);
  headers.set('Content-Type', 'application/json');
  if (userId) headers.set('X-User-ID', userId);

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...fetchInit,
    headers,
  });

  // Always parse JSON — both success and RFC 7807 error shapes are JSON.
  // Guard against non-JSON responses (e.g. gateway errors, HTML error pages).
  let body: ApiResponse<T>;
  try {
    body = (await res.json()) as ApiResponse<T>;
  } catch {
    body = {
      success: false,
      type: 'https://vision-saas.dev/errors/internal-error',
      title: 'Unexpected Response',
      status: res.status,
      detail: `The server returned a non-JSON response (HTTP ${res.status} ${res.statusText}).`,
      instance: path,
      requestId: '',
    };
  }
  return body;
}

// ─── Health ───────────────────────────────────────────────────────────────────

export async function getHealth(): Promise<ApiResponse<HealthResponse>> {
  return apiFetch<HealthResponse>('/health');
}

// ─── Upload ───────────────────────────────────────────────────────────────────

export async function requestPresignedUpload(
  payload: PresignedUploadRequest,
  userId: string,
): Promise<ApiResponse<PresignedUploadResponse>> {
  return apiFetch<PresignedUploadResponse>('/api/v1/upload/presign', {
    method: 'POST',
    body: JSON.stringify(payload),
    userId,
  });
}

/**
 * Upload a file directly to R2 using the signed PUT URL.
 * The API never touches the binary — this goes straight to R2.
 */
export async function uploadFileToR2(
  signedUrl: string,
  file: File,
): Promise<void> {
  const res = await fetch(signedUrl, {
    method: 'PUT',
    body: file,
    headers: { 'Content-Type': file.type },
  });
  if (!res.ok) {
    throw new Error(`R2 upload failed: ${res.status} ${res.statusText}`);
  }
}

export async function confirmUpload(
  jobId: string,
  userId: string,
): Promise<ApiResponse<{ jobId: string; status: string }>> {
  return apiFetch('/api/v1/upload/confirm', {
    method: 'POST',
    body: JSON.stringify({ jobId }),
    userId,
  });
}

// ─── Jobs ─────────────────────────────────────────────────────────────────────

export async function listJobs(
  userId: string,
  params?: { page?: number; pageSize?: number; status?: string },
): Promise<ApiResponse<ListJobsResponse>> {
  const qs = new URLSearchParams();
  if (params?.page) qs.set('page', String(params.page));
  if (params?.pageSize) qs.set('pageSize', String(params.pageSize));
  if (params?.status) qs.set('status', params.status);
  return apiFetch<ListJobsResponse>(`/api/v1/jobs?${qs.toString()}`, { userId });
}

export async function getJob(
  jobId: string,
  userId: string,
): Promise<ApiResponse<ProcessJobResponse>> {
  return apiFetch<ProcessJobResponse>(`/api/v1/jobs/${jobId}`, { userId });
}

export async function processJob(
  payload: ProcessJobRequest,
  userId: string,
): Promise<ApiResponse<ProcessJobResponse>> {
  const { jobId, options } = payload;
  return apiFetch<ProcessJobResponse>(`/api/v1/jobs/${jobId}/process`, {
    method: 'POST',
    body: JSON.stringify({ options }),
    userId,
  });
}

export async function toggleFavorite(
  jobId: string,
  historyId: string,
  userId: string,
): Promise<ApiResponse<{ id: string; jobId: string; isFavorited: boolean }>> {
  return apiFetch(`/api/v1/jobs/${jobId}/history/${historyId}/favorite`, {
    method: 'PATCH',
    body: '{}',
    userId,
  });
}
