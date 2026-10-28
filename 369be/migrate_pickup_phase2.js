const fs = require('fs');
const path = require('path');
const pool = require('./db');

async function runMigration() {
  try {
    const sql = fs.readFileSync(path.join(__dirname, 'MIGRATION_6.sql'), 'utf8');
    await pool.query(sql);
    console.log('✅ MIGRATION_6.sql executed successfully.');
    
    const res = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'vendors'");
    console.log('Current vendors columns:', res.rows.map(r => r.column_name));
  } catch (err) {
    console.error('❌ Migration failed:', err);
  } finally {
    await pool.end();
  }
}

runMigration();
