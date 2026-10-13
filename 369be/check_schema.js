const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://neondb_owner:npg_TmOdq2hnN7FY@ep-billowing-smoke-axuimpq0-pooler.c-4.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require' });
async function checkSchema() {
  const res = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'vendors'");
  console.log(res.rows.map(r => r.column_name));
  pool.end();
}
checkSchema();
