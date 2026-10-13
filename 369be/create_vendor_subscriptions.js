const pool = require('./db');
async function createTable() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS vendor_subscriptions (
        id SERIAL PRIMARY KEY,
        vendor_id INTEGER NOT NULL REFERENCES vendors(id),
        plan_id INTEGER REFERENCES subscription_plans(id),
        status VARCHAR(50) DEFAULT 'active',
        features JSONB DEFAULT '{}',
        start_date TIMESTAMP DEFAULT NOW(),
        end_date TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log("✅ Created vendor_subscriptions table");
  } catch (err) {
    console.error(err.message);
  } finally {
    process.exit();
  }
}
createTable();
