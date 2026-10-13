require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function addColumn() {
  try {
    await pool.query('ALTER TABLE vendors ADD COLUMN IF NOT EXISTS selected_categories JSONB DEFAULT \'[]\'::jsonb;');
    console.log('✅ Added selected_categories column to vendors table successfully');
  } catch (err) {
    console.error('Error adding column:', err.message);
  } finally {
    await pool.end();
  }
}

addColumn();
