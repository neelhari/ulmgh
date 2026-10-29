const fs = require('fs');
const path = require('path');
const pool = require('./db');

async function runMigration() {
  console.log('🔄 Running MIGRATION_8.sql on Neon DB...');
  const sql = fs.readFileSync(path.join(__dirname, 'MIGRATION_8.sql'), 'utf8');

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(sql);
    await client.query('COMMIT');
    console.log('✅ MIGRATION_8.sql executed successfully.');

    const checkSettings = await client.query('SELECT * FROM app_settings');
    console.log('✅ Current app_settings:', checkSettings.rows);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ MIGRATION_8 failed:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration();

