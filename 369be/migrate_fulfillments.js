const fs = require('fs');
const path = require('path');
const pool = require('./db');

async function runMigration() {
  console.log('🔄 Running MIGRATION_7.sql on Neon DB...');
  const sql = fs.readFileSync(path.join(__dirname, 'MIGRATION_7.sql'), 'utf8');

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(sql);
    await client.query('COMMIT');
    console.log('✅ MIGRATION_7.sql executed successfully.');

    // Verify tables exist
    const checkFulfillments = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'order_fulfillments'
    `);
    console.log(`✅ order_fulfillments columns: ${checkFulfillments.rows.length}`);

    const checkItems = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'order_fulfillment_items'
    `);
    console.log(`✅ order_fulfillment_items columns: ${checkItems.rows.length}`);

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ MIGRATION_7 failed:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration().catch(err => {
  console.error('Migration error:', err);
  process.exit(1);
});
