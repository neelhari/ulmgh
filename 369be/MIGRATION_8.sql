-- Migration 8: App Settings table for Admin Configuration (Warehouse selection, etc.)
CREATE TABLE IF NOT EXISTS app_settings (
  key VARCHAR(100) PRIMARY KEY,
  value TEXT NOT NULL,
  description TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Seed verified default admin warehouse
INSERT INTO app_settings (key, value, description)
VALUES ('admin_pickup_nickname', 'suresh', 'Primary Shiprocket pickup location for platform/admin-owned products')
ON CONFLICT (key) DO NOTHING;

