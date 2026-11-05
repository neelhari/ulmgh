-- ============================================================================
-- MIGRATION_9.sql: Firebase Cloud Messaging (FCM) Device Tokens & Notification Logs
-- ULMGH-369 Customer and Vendor Push Notification System
-- ============================================================================

-- 1. Device tokens table (supports both Customer and Vendor apps)
CREATE TABLE IF NOT EXISTS fcm_device_tokens (
    id SERIAL PRIMARY KEY,
    user_type VARCHAR(20) NOT NULL CHECK (user_type IN ('customer', 'vendor')),
    user_id INT NOT NULL,
    fcm_token TEXT NOT NULL UNIQUE,
    platform VARCHAR(20) DEFAULT 'android',
    app_version VARCHAR(50),
    device_model VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for rapid token lookup by user and token
CREATE INDEX IF NOT EXISTS idx_fcm_tokens_user ON fcm_device_tokens(user_type, user_id);
CREATE INDEX IF NOT EXISTS idx_fcm_tokens_token ON fcm_device_tokens(fcm_token);

-- 2. Notification dispatch and idempotency log
CREATE TABLE IF NOT EXISTS notification_logs (
    id SERIAL PRIMARY KEY,
    recipient_type VARCHAR(20) NOT NULL CHECK (recipient_type IN ('customer', 'vendor')),
    recipient_id INT NOT NULL,
    event_type VARCHAR(50) NOT NULL,
    reference_id VARCHAR(100),
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'sent',
    idempotency_key VARCHAR(150) UNIQUE,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notification_logs_key ON notification_logs(idempotency_key);
CREATE INDEX IF NOT EXISTS idx_notification_logs_recipient ON notification_logs(recipient_type, recipient_id);

