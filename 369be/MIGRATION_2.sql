-- ============================================================================
-- MIGRATION_2.sql
-- Idempotent: Safe to execute multiple times (uses IF NOT EXISTS).
-- ============================================================================

-- 1. Ensure Razorpay payment IDs cannot be reused across vendor subscriptions
CREATE UNIQUE INDEX IF NOT EXISTS idx_vendor_subscriptions_payment_id 
ON vendor_subscriptions (payment_id) 
WHERE payment_id IS NOT NULL;

-- 2. Store Razorpay order ID on vendor subscriptions for audit tracking
ALTER TABLE vendor_subscriptions ADD COLUMN IF NOT EXISTS order_id VARCHAR(100);

-- 3. Store Razorpay order ID on pending vendor registrations
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS pending_order_id VARCHAR(100);

-- 4. Support soft-delete / anonymization tracking for vendor account deletion
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;
