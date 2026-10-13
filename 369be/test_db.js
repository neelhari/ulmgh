const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_TmOdq2hnN7FY@ep-billowing-smoke-axuimpq0-pooler.c-4.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require'
});

async function test() {
  try {
    console.log("Testing products query...");
    await pool.query(`
      SELECT p.* FROM products p
      WHERE p.is_active = true
      AND (
        p.vendor_id IS NULL
        OR EXISTS (
          SELECT 1 FROM vendors v
          WHERE v.id = p.vendor_id
          AND v.subscription_expires_at IS NOT NULL
          AND v.subscription_expires_at > NOW()
        )
      )
      ORDER BY p.id DESC
    `);
    console.log("Products query succeeded.");
  } catch (err) {
    console.error("Products query error:", err.message);
  }

  try {
    console.log("Testing vendors query...");
    await pool.query("SELECT id, business_name, store_image FROM vendors WHERE is_active = true AND status = 'approved' ORDER BY created_at DESC");
    console.log("Vendors query succeeded.");
  } catch (err) {
    console.error("Vendors query error:", err.message);
  }

  pool.end();
}

test();
