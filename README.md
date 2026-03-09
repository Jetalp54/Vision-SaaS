# Vision SaaS — Cloudflare-Native Image AI Platform

A production-ready **Image-to-Prompt** and **Image-to-Text** SaaS built entirely on the [Cloudflare Connectivity Cloud](https://www.cloudflare.com/connectivity-cloud/).

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT (Browser)                         │
│              Next.js 15 App Router — Cloudflare Pages           │
└───────────────────────────┬─────────────────────────────────────┘
                            │ REST (JSON / RFC 7807)
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                   API GATEWAY (Hono.js Worker)                   │
│  Rate Limiting → Auth → Zod Validation → Business Logic          │
│  ┌──────────┐  ┌──────────┐  ┌──────────────┐  ┌────────────┐  │
│  │  /health │  │ /upload  │  │  /jobs       │  │ Middleware │  │
│  └──────────┘  └──────────┘  └──────────────┘  └────────────┘  │
└───┬───────────────┬────────────────┬──────────────┬─────────────┘
    │               │                │              │
    ▼               ▼                ▼              ▼
┌───────┐    ┌──────────┐    ┌────────────┐  ┌──────────────────┐
│  D1   │    │    R2    │    │ Workers KV │  │   AI Gateway     │
│ (SQL) │    │ (Images) │    │  (Cache)   │  │  → LLaVA-1.5-7B  │
└───────┘    └──────────┘    └────────────┘  └──────────────────┘
```

### Technology Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Frontend** | Next.js 15 (App Router) on Cloudflare Pages | UI — upload, jobs list, results |
| **API** | Hono.js on Cloudflare Workers | Type-safe REST API gateway |
| **Database** | Cloudflare D1 + Drizzle ORM | Relational data — users, jobs, history |
| **Cache** | Workers KV | Job status polling, idempotency, credit cache |
| **Storage** | Cloudflare R2 | Binary image storage via presigned PUT URLs |
| **AI** | `@cloudflare/ai` → LLaVA-1.5-7B | Image captioning, text extraction, OCR |
| **Observability** | Cloudflare AI Gateway | Request logging, cost tracking, model fallback |
| **Auth** | Cloudflare Access (JWT) | Zero-trust authentication |
| **CI/CD** | GitHub Actions | Lint → Build → Migrate → Deploy |

---

## Monorepo Structure

```
vision-saas/
├── apps/
│   ├── api/                          # Hono.js Cloudflare Worker
│   │   ├── src/
│   │   │   ├── index.ts              # Entry point — middleware + router
│   │   │   ├── types.ts              # Bindings & Hono context variables
│   │   │   ├── db/
│   │   │   │   ├── schema.ts         # Drizzle schema (users, image_jobs, prompt_history)
│   │   │   │   └── client.ts         # createDb() factory
│   │   │   ├── middleware/
│   │   │   │   ├── auth.ts           # Cloudflare Access JWT validation
│   │   │   │   ├── db.ts             # Drizzle injection
│   │   │   │   ├── error-handler.ts  # RFC 7807 + AppError class
│   │   │   │   └── security.ts       # CSP, HSTS, CORS, rate limiting
│   │   │   ├── lib/
│   │   │   │   ├── ai.ts             # imageToPrompt() / imageToText() via AI Gateway
│   │   │   │   ├── kv.ts             # Typed KV helpers (idempotency, job status, credits)
│   │   │   │   └── r2.ts             # AWS Sig V4 presigned PUT URL generation
│   │   │   └── routes/
│   │   │       ├── health.ts         # GET /health — service probes
│   │   │       ├── upload.ts         # POST /upload/presign + /upload/confirm
│   │   │       └── jobs.ts           # CRUD + /jobs/:id/process + favorites
│   │   ├── migrations/
│   │   │   └── 0001_initial_schema.sql
│   │   ├── drizzle.config.ts
│   │   └── wrangler.toml             # dev / staging / production environments
│   │
│   └── web/                          # Next.js 15 — Cloudflare Pages
│       └── src/
│           ├── app/
│           │   ├── page.tsx          # Home — upload + analyze flow
│           │   ├── jobs/page.tsx     # Jobs list with status polling
│           │   ├── jobs/[id]/page.tsx # Job detail + results + favorites
│           │   └── health/page.tsx   # System health dashboard
│           └── lib/
│               └── api-client.ts     # Fully-typed fetch client
│
└── packages/
    └── types/                        # @vision-saas/types (zero deps)
        └── src/
            ├── db.ts                 # User, ImageJob, PromptHistory interfaces
            ├── api.ts                # Request/Response contracts + ApiResponse<T>
            └── errors.ts             # ErrorCode const + RFC 7807 ErrorTypeUri map
```

---

## Quick Start

### Prerequisites

- Node.js ≥ 20
- A Cloudflare account with Workers, D1, R2, KV, and AI enabled
- Wrangler CLI authenticated: `npx wrangler login`

### 1. Clone & Install

```bash
git clone https://github.com/your-org/vision-saas.git
cd vision-saas
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env.local
# Fill in your Cloudflare account ID, D1 database ID, etc.
```

### 3. Provision Cloud Resources (one-time)

```bash
make setup
# This runs: db-create → r2-create → kv-create → db-migrate-prod
# Copy the generated IDs into apps/api/wrangler.toml
```

### 4. Update `wrangler.toml`

Replace all `YOUR_*` placeholders in `apps/api/wrangler.toml` with the IDs output by `make setup`.

### 5. Start Local Development

```bash
make dev
# API:  http://localhost:8787
# Web:  http://localhost:3000
```

---

## Database Migrations

```bash
# Generate migration files from schema changes
make db-generate

# Apply to local D1 replica (no network required)
make db-migrate-local

# Apply to production D1
make db-migrate-prod
```

---

## Deployment

```bash
# Deploy API Worker only
make deploy-api

# Deploy Next.js to Cloudflare Pages only
make deploy-web

# Deploy everything
make deploy-all
```

CI/CD runs automatically via GitHub Actions:
- Push to `staging` → deploys to staging environment
- Push to `main` → runs migrations + deploys to production

---

## API Reference

All responses follow the `ApiResponse<T>` envelope:

```ts
// Success
{ success: true, data: T, requestId: string }

// Error (RFC 7807 Problem Details)
{ success: false, type: string, title: string, status: number,
  detail: string, instance: string, requestId: string, errors?: [] }
```

### Endpoints

| Method | Path | Description |
|---|---|---|
| `GET` | `/health` | Service health probe (D1, KV, R2, AI) |
| `POST` | `/api/v1/upload/presign` | Get a signed R2 PUT URL |
| `POST` | `/api/v1/upload/confirm` | Confirm upload + start processing |
| `GET` | `/api/v1/jobs` | List jobs (paginated, filterable by status) |
| `GET` | `/api/v1/jobs/:id` | Get job + prompt history |
| `POST` | `/api/v1/jobs/:id/process` | Trigger AI processing |
| `PATCH` | `/api/v1/jobs/:id/history/:hid/favorite` | Toggle favorite |

---

## Security

- **Authentication:** Cloudflare Access JWT validation (`Cf-Access-Jwt-Assertion` header)
- **Rate Limiting:** Cloudflare native Rate Limiting API (per-IP)
- **Uploads:** Signed R2 PUT URLs (AWS Sig V4, 15-min TTL) — API never buffers binary data
- **Headers:** `Strict-Transport-Security`, `Content-Security-Policy`, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`
- **Secrets:** Stored as Wrangler encrypted secrets — never in `wrangler.toml`

---

## Environment Variables

See [`.env.example`](.env.example) for the full list. Key variables:

| Variable | Where | Description |
|---|---|---|
| `CLOUDFLARE_ACCOUNT_ID` | CI secrets | Your CF account ID |
| `CLOUDFLARE_API_TOKEN` | CI secrets | Wrangler deploy token |
| `D1_DATABASE_ID` | `wrangler.toml` | D1 database ID |
| `AI_GATEWAY_ID` | `wrangler.toml` | AI Gateway slug |
| `R2_ACCESS_KEY_ID` | Wrangler secret | R2 S3-compat access key |
| `R2_SECRET_ACCESS_KEY` | Wrangler secret | R2 S3-compat secret key |
| `CF_ACCESS_TEAM_DOMAIN` | Wrangler secret | Cloudflare Access team domain |
| `CF_ACCESS_AUD` | Wrangler secret | Cloudflare Access application AUD |
| `NEXT_PUBLIC_API_URL` | Pages env | Worker URL for the frontend |

---

## Adding R2 API Credentials

R2 presigned URLs require S3-compatible credentials. Generate them in the Cloudflare dashboard:
**R2 → Manage R2 API Tokens → Create API Token**

Then set them as Worker secrets:

```bash
cd apps/api
echo "YOUR_ACCESS_KEY_ID" | npx wrangler secret put R2_ACCESS_KEY_ID
echo "YOUR_SECRET_KEY"    | npx wrangler secret put R2_SECRET_ACCESS_KEY
```

---

## License

MIT — see [LICENSE](LICENSE).
