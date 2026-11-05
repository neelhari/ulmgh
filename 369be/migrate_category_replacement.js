const fs = require('fs');
const path = require('path');
const pool = require('./db');

async function runMigration() {
  try {
    const sqlPath = path.join(__dirname, 'MIGRATION_10.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    console.log('Running MIGRATION_10.sql...');
    await pool.query(sql);
    console.log('✅ MIGRATION_10.sql applied successfully!');
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
  } finally {
    await pool.end();
  }
}

runMigration();

