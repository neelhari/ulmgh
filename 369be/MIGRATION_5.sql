-- ============================================================================
-- MIGRATION_5.sql: Vendor Structured Pickup & Warehouse Location Schema
-- Idempotent: Safe to execute multiple times (uses IF NOT EXISTS).
-- ============================================================================

-- 1. Contact person at the warehouse/pickup point
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS pickup_contact_name VARCHAR(150);
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS pickup_phone VARCHAR(20);

-- 2. Structured address details (compliant with Indian courier standards)
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS pickup_line1 TEXT;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS pickup_line2 TEXT;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS pickup_city VARCHAR(100);
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS pickup_state VARCHAR(100);
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS pickup_pincode VARCHAR(10);

-- 3. Shiprocket pickup location mapping
-- This nickname uniquely identifies the vendor's pickup location in Shiprocket's account
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS shiprocket_pickup_nickname VARCHAR(50);
CREATE UNIQUE INDEX IF NOT EXISTS idx_vendors_shiprocket_nickname 
  ON vendors (shiprocket_pickup_nickname) 
  WHERE shiprocket_pickup_nickname IS NOT NULL;

-- 4. Status indicator for Phase 2 Shiprocket sync
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS is_pickup_synced BOOLEAN DEFAULT FALSE;
