-- ============================================================================
-- MIGRATION_11.sql: Account Deletion Requests Tracking Table
-- Idempotent: Safe to execute multiple times (uses IF NOT EXISTS).
-- ============================================================================

CREATE TABLE IF NOT EXISTS account_deletion_requests (
    id SERIAL PRIMARY KEY,
    user_id INT,
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

CREATE INDEX IF NOT EXISTS idx_adr_email ON account_deletion_requests(email);
CREATE INDEX IF NOT EXISTS idx_adr_status ON account_deletion_requests(status);

