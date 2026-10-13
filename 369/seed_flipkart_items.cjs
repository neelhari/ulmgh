const path = require('path');
require('/Users/hemanthkancharla/369be/node_modules/dotenv').config({ path: '/Users/hemanthkancharla/369be/.env' });

const pool = require('/Users/hemanthkancharla/369be/db.js');

const categories = [
  { name: 'Mobiles', models: ['Smartphones', 'Feature Phones', 'Refurbished Phones'], image_url: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=400&q=80' },
  { name: 'Laptops', models: ['Gaming Laptops', 'Business Laptops', 'MacBooks'], image_url: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=400&q=80' },
  { name: 'Electronics', models: ['Cameras', 'Headphones', 'Smartwatches', 'Speakers'], image_url: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?auto=format&fit=crop&w=400&q=80' },
  { name: 'Fashion', models: ['Men Clothing', 'Women Clothing', 'Shoes', 'Watches'], image_url: 'https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=400&q=80' },
  { name: 'Appliances', models: ['Televisions', 'Washing Machines', 'Refrigerators', 'Air Conditioners'], image_url: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=400&q=80' },
  { name: 'Home & Furniture', models: ['Beds', 'Sofas', 'Decor', 'Kitchenware'], image_url: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=400&q=80' }
];

const products = [];

// Helper to generate products
function createProducts(catName, models, basePrice, imgUrl, names) {
  names.forEach((name, i) => {
    products.push({
      name: name,
      description: `Premium quality ${name} from top brands.`,
      category: catName,
      model: models[i % models.length],
      price: basePrice + (i * 100),
      mrp: basePrice + (i * 100) + 500,
      image_url: imgUrl,
      stock: 50,
      is_active: true
    });
  });
}

// 1. Mobiles
createProducts('Mobiles', ['Smartphones'], 12000, 'https://images.unsplash.com/photo-1598327105666-5b89351cb31b?auto=format&fit=crop&w=400&q=80', [
  'iPhone 14 Pro', 'Samsung Galaxy S23', 'OnePlus 11', 'Google Pixel 7', 'Xiaomi 13 Pro', 'Realme GT 3', 'Vivo X90', 'Oppo Reno 10', 'Moto Edge 40', 'Nothing Phone 2'
]);

// 2. Laptops
createProducts('Laptops', ['Gaming Laptops', 'Business Laptops', 'MacBooks'], 50000, 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=400&q=80', [
  'MacBook Air M2', 'Dell XPS 13', 'HP Spectre x360', 'Lenovo ThinkPad X1', 'Asus ROG Strix', 'Acer Predator', 'MSI Stealth', 'Razer Blade 15', 'LG Gram 17', 'Microsoft Surface Laptop'
]);

// 3. Electronics
createProducts('Electronics', ['Cameras', 'Headphones', 'Smartwatches', 'Speakers'], 3000, 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=400&q=80', [
  'Sony WH-1000XM5', 'Apple AirPods Pro', 'Bose QuietComfort 45', 'Canon EOS R5', 'Nikon Z6 II', 'Apple Watch Series 9', 'Samsung Galaxy Watch 6', 'JBL Flip 6', 'Sony A7 IV', 'Garmin Fenix 7'
]);

// 4. Fashion
createProducts('Fashion', ['Men Clothing', 'Women Clothing', 'Shoes', 'Watches'], 500, 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=400&q=80', [
  'Men Casual Denim Jacket', 'Nike Air Max Sneakers', 'Women Floral Maxi Dress', 'Fossil Analog Watch', 'Puma Running Shoes', 'Levi Slim Fit Jeans', 'Men Cotton Polo T-Shirt', 'Women Rayon Kurta', 'Adidas Originals Cap', 'Casio G-Shock'
]);

// 5. Appliances
createProducts('Appliances', ['Televisions', 'Washing Machines', 'Refrigerators', 'Air Conditioners'], 15000, 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=400&q=80', [
  'Samsung 55-inch 4K TV', 'LG 65-inch OLED TV', 'Sony Bravia 50-inch', 'Whirlpool 265L Refrigerator', 'LG 7kg Washing Machine', 'Samsung 1.5 Ton AC', 'Voltas 1 Ton AC', 'Bosch Front Load Washer', 'Haier Double Door Fridge', 'Daikin Inverter AC'
]);

// 6. Home & Furniture
createProducts('Home & Furniture', ['Beds', 'Sofas', 'Decor', 'Kitchenware'], 2000, 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=400&q=80', [
  'Engineered Wood Queen Bed', '3 Seater Leather Sofa', 'Teak Wood Dining Table', 'Ergonomic Office Chair', 'Crystal Glass Vase', 'Non-stick Cookware Set', 'Cotton Bedsheet Set', 'Abstract Wall Art', 'Wooden Bookshelf', 'Stainless Steel Cutlery Set'
]);


async function seedFlipkart() {
  try {
    console.log('Starting Flipkart DB insert...');
    
    // Insert Categories
    for (const cat of categories) {
      const existCat = await pool.query('SELECT * FROM categories WHERE name = $1', [cat.name]);
      if (existCat.rows.length === 0) {
        await pool.query(
          'INSERT INTO categories (name, models, image_url) VALUES ($1, $2, $3)',
          [cat.name, JSON.stringify(cat.models), cat.image_url]
        );
        console.log(`Inserted category: ${cat.name}`);
      } else {
        await pool.query(
          'UPDATE categories SET models = $1 WHERE name = $2',
          [JSON.stringify(cat.models), cat.name]
        );
        console.log(`Updated category: ${cat.name}`);
      }
    }

    // Insert Products
    let insertedProducts = 0;
    for (const p of products) {
      const existProd = await pool.query('SELECT * FROM products WHERE name = $1', [p.name]);
      if (existProd.rows.length === 0) {
        await pool.query(`
          INSERT INTO products (name, description, category, model, price, mrp, image_url, stock, is_active)
          VALUES ($1, $2, $3, $4, $5, $6, $7, 50, true)
        `, [p.name, p.description, p.category, p.model, p.price, p.mrp, p.image_url]);
        insertedProducts++;
      }
    }
    
    console.log(`Successfully inserted ${insertedProducts} new products across ${categories.length} Flipkart categories.`);
    process.exit(0);
  } catch (err) {
    console.error('Error seeding data:', err);
    process.exit(1);
  }
}

seedFlipkart();
