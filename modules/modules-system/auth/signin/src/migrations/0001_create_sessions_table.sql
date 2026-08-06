-- REFERENCE COPY ONLY. The migration that actually runs against
-- PostgreSQL lives in saas-backend (FastAPI + alembic), scoped to the
-- tenant/license service that owns session storage. Mirrored here so this
-- module's on-disk footprint documents its own schema dependency without
-- requiring a second repo checkout to see it. Keep manually in sync until
-- the migration-sync tooling in Open Decisions (Section 9) exists.
CREATE TABLE IF NOT EXISTS sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    user_id UUID NOT NULL,
    token_hash TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_sessions_tenant_user ON sessions (tenant_id, user_id);