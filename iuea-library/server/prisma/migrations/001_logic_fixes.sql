-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 001 — Logic fixes
-- Run once against your Neon database.
-- Safe to re-run (all statements use IF NOT EXISTS / IF EXISTS guards).
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Password reset fields on User
ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS "passwordResetToken"     TEXT,
  ADD COLUMN IF NOT EXISTS "passwordResetExpiresAt" TIMESTAMPTZ;

-- 2. Library tracking fields on UserProgress
ALTER TABLE "UserProgress"
  ADD COLUMN IF NOT EXISTS "isSaved"      BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "isDownloaded" BOOLEAN NOT NULL DEFAULT false;

-- 3. Collection model (new table)
CREATE TABLE IF NOT EXISTS "Collection" (
  "id"        TEXT        NOT NULL PRIMARY KEY,
  "userId"    TEXT        NOT NULL,
  "name"      TEXT        NOT NULL,
  "bookIds"   TEXT[]      NOT NULL DEFAULT '{}',
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "Collection_userId_idx" ON "Collection" ("userId");

-- 4. Auto-update updatedAt on Collection rows
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS "Collection_set_updated_at" ON "Collection";
CREATE TRIGGER "Collection_set_updated_at"
  BEFORE UPDATE ON "Collection"
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
