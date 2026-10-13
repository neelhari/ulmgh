const pool = require('./db');
async function createTable() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS subscription_plans (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        price NUMERIC(10,2) NOT NULL,
        months INTEGER NOT NULL,
        is_active BOOLEAN DEFAULT true,
        features JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log("✅ Created subscription_plans table");
  } catch (err) {
    console.error(err.message);
  } finally {
    process.exit();
  }
}
createTable();
