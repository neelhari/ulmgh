require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
async function run() {
  try {
    await pool.query(`
      ALTER TABLE offers 
      ADD COLUMN IF NOT EXISTS name VARCHAR(255),
      ADD COLUMN IF NOT EXISTS offer_type VARCHAR(50) DEFAULT 'coupon',
      ADD COLUMN IF NOT EXISTS discount_type VARCHAR(50) DEFAULT 'percent';
    `);
    console.log('Columns added');
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}
run();
