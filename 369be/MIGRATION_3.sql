-- ============================================================================
-- MIGRATION_3.sql
-- Idempotent: Safe to execute multiple times (uses IF NOT EXISTS).
-- ============================================================================

-- Support soft-delete / anonymization tracking for customer account deletion
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;
