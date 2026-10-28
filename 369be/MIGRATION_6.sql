-- ============================================================================
-- MIGRATION_6.sql: Shiprocket Warehouse Sync & Tracking Columns
-- Idempotent: Safe to execute multiple times (uses IF NOT EXISTS).
-- ============================================================================

-- 1. Store Shiprocket's internal pickup ID returned by the API
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS shiprocket_pickup_id VARCHAR(50);

-- 2. Store timestamp of the last successful sync
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS pickup_synced_at TIMESTAMP;

-- 3. Store error messages if Shiprocket registration fails (e.g. unserviceable PIN, phone error)
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS pickup_sync_error TEXT;

-- 4. SHA-256 hash of address fields for fast change-detection and idempotency
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS pickup_address_hash VARCHAR(64);

-- 5. Versioning counter for nickname revisions when address changes under the same PIN
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS pickup_version INTEGER DEFAULT 1;

-- 6. Audit trail for historical Shiprocket pickup mappings
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS historical_shiprocket_pickups JSONB DEFAULT '[]'::jsonb;
