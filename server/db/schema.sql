-- Afrolivestream initial PostgreSQL schema.
-- Apply only to a new/dev database after reviewing the SQL with your database owner.
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(100) NOT NULL UNIQUE,
  name VARCHAR(160) NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  channel_type VARCHAR(30) NOT NULL CHECK (channel_type IN ('live_tv', 'radio', 'podcast')),
  logo_url TEXT,
  schedule_url TEXT,
  -- Store stream origin securely in a later protected playback service, not public API responses.
  stream_url TEXT,
  rights_status VARCHAR(30) NOT NULL DEFAULT 'pending_review'
    CHECK (rights_status IN ('pending_review', 'approved', 'expired', 'rejected')),
  rights_evidence_url TEXT,
  rights_expires_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order INTEGER NOT NULL DEFAULT 100,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS content_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(160) NOT NULL UNIQUE,
  title VARCHAR(240) NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  category VARCHAR(80) NOT NULL,
  content_type VARCHAR(30) NOT NULL CHECK (content_type IN ('movie', 'series', 'episode', 'documentary', 'education', 'short', 'podcast')),
  artwork_url TEXT,
  playback_asset_id TEXT,
  duration_seconds INTEGER CHECK (duration_seconds IS NULL OR duration_seconds >= 0),
  status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'in_review', 'published', 'archived')),
  is_featured BOOLEAN NOT NULL DEFAULT FALSE,
  rights_status VARCHAR(30) NOT NULL DEFAULT 'pending_review'
    CHECK (rights_status IN ('pending_review', 'approved', 'expired', 'rejected')),
  rights_owner VARCHAR(240),
  rights_evidence_url TEXT,
  rights_start_at TIMESTAMPTZ,
  rights_end_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT published_requires_approved_rights CHECK (status <> 'published' OR rights_status = 'approved')
);

CREATE INDEX IF NOT EXISTS content_items_public_listing_idx
  ON content_items (status, category, content_type, published_at DESC)
  WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS channels_active_idx ON channels (is_active, sort_order, name);

CREATE TABLE IF NOT EXISTS audit_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id UUID,
  action VARCHAR(120) NOT NULL,
  entity_type VARCHAR(80) NOT NULL,
  entity_id UUID,
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS audit_events_created_at_idx ON audit_events (created_at DESC);

-- This schema is not yet a complete security model. Add identity tables, RBAC, session controls,
-- admin MFA, and append-only audit protections before exposing any write/admin endpoints.
