require('dotenv').config();
const pool = require('./db');

async function fix() {
  try {
    const placeholder = 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=600&q=80';
    
    // Check products images json array
    const res = await pool.query(`SELECT id, images FROM products WHERE images::text LIKE '%t41s9lby%'`);
    for (let row of res.rows) {
      if (Array.isArray(row.images)) {
        let newImages = row.images.map(img => img.includes('t41s9lby') ? placeholder : img);
        await pool.query('UPDATE products SET images = $1::jsonb WHERE id = $2', [JSON.stringify(newImages), row.id]);
      }
    }
    
    // Check users avatar
    await pool.query(`UPDATE users SET avatar_url = $1 WHERE avatar_url LIKE '%t41s9lby%'`, [placeholder]);
    
    console.log('Fixed JSON arrays and other columns!');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

fix();
