-- ─── Vision SaaS: Initial D1 Schema ──────────────────────────────────────────
-- Migration: 0001_initial_schema
-- Generated for Cloudflare D1 (SQLite dialect)

-- ── Users ──────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id                TEXT      PRIMARY KEY,           -- ULID
  email             TEXT      NOT NULL UNIQUE,
  name              TEXT,
  role              TEXT      NOT NULL DEFAULT 'user'
                              CHECK (role IN ('admin','user')),
  status            TEXT      NOT NULL DEFAULT 'pending'
                              CHECK (status IN ('active','suspended','pending')),
  tier              TEXT      NOT NULL DEFAULT 'free'
                              CHECK (tier IN ('free','pro','enterprise')),
  monthly_credits   INTEGER   NOT NULL DEFAULT 50,
  used_credits      INTEGER   NOT NULL DEFAULT 0,
  created_at        INTEGER   NOT NULL DEFAULT (unixepoch() * 1000),
  updated_at        INTEGER   NOT NULL DEFAULT (unixepoch() * 1000)
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);
CREATE INDEX IF NOT EXISTS idx_users_status ON users (status);

-- ── Image Jobs ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS image_jobs (
  id                TEXT      PRIMARY KEY,           -- ULID
  user_id           TEXT      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type              TEXT      NOT NULL
                              CHECK (type IN ('image_to_prompt','image_to_text','ocr')),
  status            TEXT      NOT NULL DEFAULT 'pending'
                              CHECK (status IN ('pending','processing','completed','failed')),
  r2_key            TEXT      NOT NULL,
  r2_url            TEXT,
  input_mime_type   TEXT      NOT NULL,
  input_size_bytes  INTEGER   NOT NULL,
  model_used        TEXT,
  tokens_used       INTEGER,
  processing_ms     INTEGER,
  error_message     TEXT,
  metadata          TEXT,                            -- JSON blob
  created_at        INTEGER   NOT NULL DEFAULT (unixepoch() * 1000),
  updated_at        INTEGER   NOT NULL DEFAULT (unixepoch() * 1000)
);

CREATE INDEX IF NOT EXISTS idx_image_jobs_user_id  ON image_jobs (user_id);
CREATE INDEX IF NOT EXISTS idx_image_jobs_status   ON image_jobs (status);
CREATE INDEX IF NOT EXISTS idx_image_jobs_created  ON image_jobs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_image_jobs_type     ON image_jobs (type);

-- ── Prompt History ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS prompt_history (
  id            TEXT      PRIMARY KEY,               -- ULID
  job_id        TEXT      NOT NULL REFERENCES image_jobs(id) ON DELETE CASCADE,
  user_id       TEXT      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  prompt_text   TEXT      NOT NULL,
  confidence    REAL,                                -- 0.0–1.0
  tags          TEXT,                                -- JSON array e.g. '["landscape"]'
  is_favorited  INTEGER   NOT NULL DEFAULT 0,        -- boolean: 0 | 1
  created_at    INTEGER   NOT NULL DEFAULT (unixepoch() * 1000)
);

CREATE INDEX IF NOT EXISTS idx_prompt_history_job_id    ON prompt_history (job_id);
CREATE INDEX IF NOT EXISTS idx_prompt_history_user_id   ON prompt_history (user_id);
CREATE INDEX IF NOT EXISTS idx_prompt_history_favorited ON prompt_history (is_favorited)
  WHERE is_favorited = 1;
