// ─── DB Entity Types ──────────────────────────────────────────────────────────

export type UserRole = 'admin' | 'user';
export type UserStatus = 'active' | 'suspended' | 'pending';

export interface User {
  id: string;              // ULID
  email: string;
  name: string | null;
  role: UserRole;
  status: UserStatus;
  tier: 'free' | 'pro' | 'enterprise';
  monthlyCredits: number;
  usedCredits: number;
  createdAt: number;       // Unix timestamp (ms)
  updatedAt: number;
}

export type JobStatus = 'pending' | 'processing' | 'completed' | 'failed';
export type JobType = 'image_to_prompt' | 'image_to_text' | 'ocr';

export interface ImageJob {
  id: string;              // ULID
  userId: string;
  type: JobType;
  status: JobStatus;
  r2Key: string;           // Object key in R2
  r2Url: string | null;    // Public URL (if bucket is public)
  inputMimeType: string;
  inputSizeBytes: number;
  modelUsed: string | null;
  tokensUsed: number | null;
  processingMs: number | null;
  errorMessage: string | null;
  metadata: string | null; // JSON string for arbitrary KV
  createdAt: number;
  updatedAt: number;
}

export interface PromptHistory {
  id: string;              // ULID
  jobId: string;
  userId: string;
  promptText: string;
  confidence: number | null;  // 0.0–1.0
  tags: string | null;        // JSON array of strings
  isFavorited: boolean;
  createdAt: number;
}
