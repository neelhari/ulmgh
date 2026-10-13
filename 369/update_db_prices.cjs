const path = require('path');
require('/Users/hemanthkancharla/369be/node_modules/dotenv').config({ path: '/Users/hemanthkancharla/369be/.env' });

const pool = require('/Users/hemanthkancharla/369be/db.js');

async function updatePrices() {
  try {
    const res = await pool.query('SELECT id, name, sizes, price FROM products');
    const products = res.rows;
    let updated = 0;
    
    for (let p of products) {
      let basePrice = 0;
      let baseMrp = 0;
      
      // Try to parse price from sizes array
      if (p.sizes) {
         try {
           const sizesArr = typeof p.sizes === 'string' ? JSON.parse(p.sizes) : p.sizes;
           if (Array.isArray(sizesArr) && sizesArr.length > 0 && sizesArr[0].price) {
             basePrice = Number(sizesArr[0].price);
             baseMrp = basePrice + (basePrice * 0.2); // Adding 20% to create an MRP
           }
         } catch(e) {
           console.error(`Error parsing sizes for product ${p.id}:`, e.message);
         }
      }
      
      // Fallback price if sizes doesn't have it
      if (basePrice === 0) {
        basePrice = 999;
        baseMrp = 1299;
      }
      
      await pool.query('UPDATE products SET price = $1, mrp = $2 WHERE id = $3', [basePrice, baseMrp, p.id]);
      updated++;
    }
    
    console.log(`Successfully updated prices for ${updated} products directly in the database!`);
    process.exit(0);
  } catch (err) {
    console.error('Error updating prices:', err);
    process.exit(1);
  }
}

updatePrices();
