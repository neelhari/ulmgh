const pool = require('./db');
async function migrate() {
  try {
    await pool.query('ALTER TABLE vendor_subscriptions ADD COLUMN IF NOT EXISTS plan_name VARCHAR(255)');
    await pool.query('ALTER TABLE vendor_subscriptions ADD COLUMN IF NOT EXISTS months INTEGER');
    await pool.query('ALTER TABLE vendor_subscriptions ADD COLUMN IF NOT EXISTS amount NUMERIC(10,2)');
    await pool.query('ALTER TABLE vendor_subscriptions ADD COLUMN IF NOT EXISTS payment_id VARCHAR(255)');
    await pool.query('ALTER TABLE vendor_subscriptions ADD COLUMN IF NOT EXISTS starts_at TIMESTAMP DEFAULT NOW()');
    await pool.query('ALTER TABLE vendor_subscriptions ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP');
    console.log("✅ Fixed vendor_subscriptions schema");
  } catch (err) {
    console.error("❌ Migration failed:", err.message);
  } finally {
    process.exit();
  }
}
migrate();
