require('dotenv').config();
const pool = require('./db');

async function fix() {
  try {
    const placeholder = 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=600&q=80';
    
    // Update products
    await pool.query(`UPDATE products SET image_url = $1 WHERE image_url LIKE '%t41s9lby%'`, [placeholder]);
    
    // Update categories
    await pool.query(`UPDATE categories SET image_url = $1 WHERE image_url LIKE '%t41s9lby%'`, [placeholder]);
    
    // Update banners
    await pool.query(`UPDATE banners SET image_url = $1 WHERE image_url LIKE '%t41s9lby%'`, [placeholder]);
    
    console.log('Fixed broken images in database!');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

fix();
