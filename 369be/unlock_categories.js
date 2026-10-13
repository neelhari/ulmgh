require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function run() {
  try {
    const res = await pool.query("SELECT id FROM vendors WHERE email = 'kancharlahemanth89@gmail.com'");
    if (res.rows.length === 0) {
      console.log('Vendor not found');
      return;
    }
    const vendorId = res.rows[0].id;
    console.log('Found vendor ID:', vendorId);
    
    const del = await pool.query('DELETE FROM vendor_categories WHERE vendor_id = $1 RETURNING *', [vendorId]);
    console.log('Deleted categories:', del.rows);
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}
run();
