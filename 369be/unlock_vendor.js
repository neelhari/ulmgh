require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function run() {
  try {
    const res = await pool.query("UPDATE vendors SET selected_categories = '[]'::jsonb WHERE email = 'kancharlahemanth89@gmail.com' RETURNING *");
    if (res.rows.length > 0) {
      console.log('Categories unlocked successfully for:', res.rows[0].email);
    } else {
      console.log('Vendor not found');
    }
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}
run();
