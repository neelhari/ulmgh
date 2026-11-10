-- ============================================================================
-- MIGRATION_12.sql: Vendor Account Deletion Requests Tracking Table
-- Idempotent: Safe to execute multiple times (uses IF NOT EXISTS).
-- ============================================================================

CREATE TABLE IF NOT EXISTS vendor_deletion_requests (
    id SERIAL PRIMARY KEY,
    vendor_id INT,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    reason TEXT,
    verification_status VARCHAR(50) DEFAULT 'pending_verification',
    verified_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50) DEFAULT 'pending',
    processed_at TIMESTAMP WITH TIME ZONE,
    ip_address VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vdr_email ON vendor_deletion_requests(email);
CREATE INDEX IF NOT EXISTS idx_vdr_status ON vendor_deletion_requests(status);

