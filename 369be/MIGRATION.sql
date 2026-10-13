-- ============================================================================
-- MIGRATION.sql
-- Run this script in the Neon PostgreSQL Console or SQL client.
-- Idempotent: Safe to execute multiple times (uses IF NOT EXISTS).
-- ============================================================================

-- 1. FIX 5: Support OTP attempt tracking and lockout
ALTER TABLE otps ADD COLUMN IF NOT EXISTS attempts INTEGER DEFAULT 0;

-- 2. FIX 2 & FIX 3: Store Razorpay order ID and payment ID on orders
ALTER TABLE orders ADD COLUMN IF NOT EXISTS razorpay_order_id VARCHAR(100);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS razorpay_payment_id VARCHAR(100);

-- 3. FIX 2: Ensure one Razorpay payment ID cannot be reused across orders
CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_razorpay_payment_id 
ON orders (razorpay_payment_id) 
WHERE razorpay_payment_id IS NOT NULL;
