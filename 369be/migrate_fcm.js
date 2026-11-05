const fs = require('fs');
const path = require('path');
const pool = require('./db');

async function runMigration() {
  try {
    const sqlPath = path.join(__dirname, 'MIGRATION_9.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    console.log('Running MIGRATION_9.sql...');
    await pool.query(sql);
    console.log('✅ MIGRATION_9.sql applied successfully!');
    
    // Verify tables exist
    const resTokens = await pool.query("SELECT to_regclass('public.fcm_device_tokens') as table_exists;");
    const resLogs = await pool.query("SELECT to_regclass('public.notification_logs') as table_exists;");
    console.log('fcm_device_tokens exists:', resTokens.rows[0].table_exists);
    console.log('notification_logs exists:', resLogs.rows[0].table_exists);
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
  } finally {
    await pool.end();
  }
}

runMigration();

