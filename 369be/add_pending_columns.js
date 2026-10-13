const pool = require('./db');
async function migrate() {
  try {
    await pool.query('ALTER TABLE vendors ADD COLUMN IF NOT EXISTS pending_plan_id INTEGER');
    await pool.query('ALTER TABLE vendors ADD COLUMN IF NOT EXISTS pending_payment_id VARCHAR(255)');
    console.log("✅ Added pending_plan_id and pending_payment_id successfully");
  } catch (err) {
    console.error("❌ Migration failed:", err.message);
  } finally {
    process.exit();
  }
}
migrate();
