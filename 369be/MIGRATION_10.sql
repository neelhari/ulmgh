-- ============================================================================
-- MIGRATION_10.sql: Vendor Category Locking and Controlled Replacement Support
-- ============================================================================

-- 1. Ensure products table has is_deleted flag for clean soft-deletion
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false;

-- 2. Indexes for rapid active product filtering
CREATE INDEX IF NOT EXISTS idx_products_vendor_active ON products(vendor_id, is_active, is_deleted);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);

-- 3. Audit log for category replacements
CREATE TABLE IF NOT EXISTS vendor_category_replacements (
    id SERIAL PRIMARY KEY,
    vendor_id INT NOT NULL,
    old_category VARCHAR(100) NOT NULL,
    new_category VARCHAR(100) NOT NULL,
    affected_products_count INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vcr_vendor ON vendor_category_replacements(vendor_id);

