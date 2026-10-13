require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
async function run() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS advertisements (
        id SERIAL PRIMARY KEY,
        type VARCHAR(255),
        title VARCHAR(255),
        image_url TEXT,
        video_url TEXT,
        link_url TEXT,
        target_id VARCHAR(100),
        is_active BOOLEAN DEFAULT true,
        valid_from TIMESTAMP,
        valid_until TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('advertisements table created');
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}
run();
