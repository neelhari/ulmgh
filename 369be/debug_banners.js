require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
async function run() {
  try {
    const res = await pool.query(`
      SELECT * FROM advertisements 
      WHERE is_active = true 
        AND (valid_from IS NULL OR valid_from <= NOW()) 
        AND (valid_until IS NULL OR valid_until >= NOW())
    `);
    console.log(res.rows);
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}
run();
