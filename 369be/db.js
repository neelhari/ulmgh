const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: true },
  max: 5,
});

pool.connect()
  .then((client) => {
    console.log('✅ Neon DB connected');
    client.release();
  })
  .catch(err => console.error('❌ DB error:', err.message));

pool.on('error', (err, client) => {
  console.error('Unexpected error on idle client', err);
});

module.exports = pool;
