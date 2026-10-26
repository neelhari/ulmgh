-- ============================================================================
-- MIGRATION_4.sql
-- Idempotent: Safe to execute multiple times (uses IF NOT EXISTS).
-- Adds google_id column and unique partial index to users table for Google Sign-In.
-- ============================================================================

-- Add google_id column to users table if it does not already exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id VARCHAR(255);

-- Create a unique index for google_id (ignoring NULLs so regular password users aren't conflicted)
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_google_id ON users (google_id) WHERE google_id IS NOT NULL;
