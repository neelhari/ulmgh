const pool = require('./db');

async function migrate() {
  try {
    await pool.query('ALTER TABLE vendors ADD COLUMN IF NOT EXISTS selected_categories JSONB DEFAULT \'[]\';');
    console.log("✅ added selected_categories successfully");
  } catch (err) {
    console.error("❌ Migration failed:", err.message);
  } finally {
    process.exit();
  }
}
migrate();
