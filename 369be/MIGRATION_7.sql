-- MIGRATION_7.sql: Phase 3 Multi-Vendor Fulfillment Schema
-- Creates normalized fulfillment and line-item tables

CREATE TABLE IF NOT EXISTS order_fulfillments (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  vendor_id INTEGER REFERENCES vendors(id) ON DELETE SET NULL, -- NULL indicates platform / in-house product
  fulfillment_number VARCHAR(64) UNIQUE NOT NULL,             -- e.g. 'ORD-1718293849123-V5' or 'ORD-1718293849123-P'
  
  -- Status Lifecycle
  status VARCHAR(50) DEFAULT 'pending',
  -- ('pending', 'processing', 'ready_to_ship', 'shipped', 'delivered', 'cancelled', 'failed')
  
  -- Financial Breakdown for this Package
  subtotal NUMERIC(10,2) NOT NULL DEFAULT 0,
  shipping_fee NUMERIC(10,2) NOT NULL DEFAULT 0,
  tax_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  total_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  
  -- Package Dimensions & Weight
  package_weight NUMERIC(8,2) DEFAULT 0.5,
  package_length NUMERIC(8,2) DEFAULT 10,
  package_breadth NUMERIC(8,2) DEFAULT 10,
  package_height NUMERIC(8,2) DEFAULT 10,

  -- Warehouse Mapping Snapshot (Captured at order creation time)
  pickup_location_nickname VARCHAR(60),
  shiprocket_pickup_id VARCHAR(50),
  
  -- Shiprocket Shipment & Tracking Artifacts
  shiprocket_order_id BIGINT,
  shiprocket_shipment_id BIGINT,
  awb_code VARCHAR(100),
  courier_name VARCHAR(100),
  courier_company_id INTEGER,
  tracking_url TEXT,
  label_url TEXT,
  manifest_url TEXT,
  pickup_token_number VARCHAR(100),
  pickup_scheduled_date TIMESTAMPTZ,
  
  -- Timestamps & Error Logging
  shipped_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  cancellation_reason TEXT,
  sync_error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fulfillments_order_id ON order_fulfillments(order_id);
CREATE INDEX IF NOT EXISTS idx_fulfillments_vendor_id ON order_fulfillments(vendor_id);
CREATE INDEX IF NOT EXISTS idx_fulfillments_status ON order_fulfillments(status);

CREATE TABLE IF NOT EXISTS order_fulfillment_items (
  id SERIAL PRIMARY KEY,
  fulfillment_id INTEGER NOT NULL REFERENCES order_fulfillments(id) ON DELETE CASCADE,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
  product_name VARCHAR(255) NOT NULL,
  sku VARCHAR(100),
  variant_details JSONB DEFAULT '{}'::jsonb,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price NUMERIC(10,2) NOT NULL,
  total_price NUMERIC(10,2) NOT NULL,
  weight NUMERIC(8,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fulfillment_items_fulfillment_id ON order_fulfillment_items(fulfillment_id);
CREATE INDEX IF NOT EXISTS idx_fulfillment_items_order_id ON order_fulfillment_items(order_id);
