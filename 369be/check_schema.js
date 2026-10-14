require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: true },
});
async function checkSchema() {
  const res = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'vendors'");
  console.log(res.rows.map(r => r.column_name));
  pool.end();
}
checkSchema();
