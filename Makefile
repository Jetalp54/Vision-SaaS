.PHONY: dev build lint type-check \
        db-generate db-migrate-local db-migrate-prod \
        r2-create kv-create \
        deploy-api deploy-web deploy-all \
        setup clean

# ── Dev ────────────────────────────────────────────────────────────────────────
dev:
	npm run dev

build:
	npm run build

lint:
	npm run lint

type-check:
	npm run type-check

# ── Database (D1) ──────────────────────────────────────────────────────────────
db-generate:
	npm run db:generate

## Run migrations against the local D1 SQLite replica
db-migrate-local:
	npm run db:migrate:local

## Run migrations against the production D1 database
db-migrate-prod:
	npm run db:migrate:prod

## Create the D1 database (run once)
db-create:
	npx wrangler d1 create vision-saas-db

# ── Storage (R2) ───────────────────────────────────────────────────────────────
## Create the R2 bucket (run once)
r2-create:
	npx wrangler r2 bucket create vision-saas-images

## Create the R2 preview bucket for staging (run once)
r2-create-preview:
	npx wrangler r2 bucket create vision-saas-images-preview

# ── KV Namespaces ──────────────────────────────────────────────────────────────
## Create the KV namespace (run once)
kv-create:
	npx wrangler kv namespace create METADATA_KV

## Create the KV preview namespace for staging (run once)
kv-create-preview:
	npx wrangler kv namespace create METADATA_KV --preview

# ── Deploy ─────────────────────────────────────────────────────────────────────
deploy-api:
	npm run deploy:api

deploy-web:
	npm run deploy:web

deploy-all: deploy-api deploy-web

# ── First-time Setup ───────────────────────────────────────────────────────────
## Provision all cloud resources (run once after cloning)
setup: db-create r2-create r2-create-preview kv-create kv-create-preview db-migrate-prod
	@echo "✅  All resources provisioned. Update wrangler.toml with the generated IDs."

# ── Cleanup ────────────────────────────────────────────────────────────────────
clean:
	rm -rf node_modules apps/*/node_modules packages/*/node_modules
	rm -rf apps/*/.next apps/*/.wrangler apps/*/dist
	rm -rf .turbo apps/*/.turbo packages/*/.turbo
