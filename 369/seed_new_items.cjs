const path = require('path');
require('/Users/hemanthkancharla/369be/node_modules/dotenv').config({ path: '/Users/hemanthkancharla/369be/.env' });

const pool = require('/Users/hemanthkancharla/369be/db.js');

const categories = [
  {
    name: 'Grocery',
    models: ['Fresh fruits', 'Fresh vegetables', 'Atta, rice & dal', 'Oil, Ghee & masala', 'Dairy, bread & eggs', 'Cereals & dry fruits', 'Chicken, fish & meats', 'Instant & frozen food'],
    image_url: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=400&q=80'
  },
  {
    name: 'Snacks & drinks',
    models: ['Chips & namkeens', 'Drinks & juices', 'Bakery & biscuits', 'Sweets', 'Chocolates', 'Ice creams', 'Sauces & spreads', 'Tea, coffee'],
    image_url: 'https://images.unsplash.com/photo-1621939514649-280e2ee25f60?auto=format&fit=crop&w=400&q=80'
  },
  {
    name: 'Beauty & personal care',
    models: ['Bath & body', 'Hair care', 'Skin care', 'Fragrances'],
    image_url: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=400&q=80'
  }
];

const products = [
  // Grocery
  { name: 'Fresh Apples (1kg)', category: 'Grocery', model: 'Fresh fruits', price: 150, mrp: 200, image_url: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6fac6?auto=format&fit=crop&w=400&q=80', description: 'Freshly picked, crisp and sweet apples.' },
  { name: 'Bananas (1 Dozen)', category: 'Grocery', model: 'Fresh fruits', price: 60, mrp: 80, image_url: 'https://images.unsplash.com/photo-1528825871115-3581a5387919?auto=format&fit=crop&w=400&q=80', description: 'Fresh, ripe bananas packed with energy.' },
  { name: 'Tomatoes (1kg)', category: 'Grocery', model: 'Fresh vegetables', price: 40, mrp: 60, image_url: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=400&q=80', description: 'Farm fresh, red and juicy tomatoes.' },
  { name: 'Potatoes (1kg)', category: 'Grocery', model: 'Fresh vegetables', price: 30, mrp: 50, image_url: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=400&q=80', description: 'Versatile and essential fresh potatoes.' },
  { name: 'Aashirvaad Whole Wheat Atta (5kg)', category: 'Grocery', model: 'Atta, rice & dal', price: 250, mrp: 290, image_url: 'https://images.unsplash.com/photo-1599321955726-e04842669811?auto=format&fit=crop&w=400&q=80', description: '100% pure whole wheat atta for soft rotis.' },
  { name: 'Basmati Rice (1kg)', category: 'Grocery', model: 'Atta, rice & dal', price: 120, mrp: 150, image_url: 'https://images.unsplash.com/photo-1586201375761-83865001e8ac?auto=format&fit=crop&w=400&q=80', description: 'Premium long-grain basmati rice.' },
  { name: 'Fortune Sunflower Oil (1L)', category: 'Grocery', model: 'Oil, Ghee & masala', price: 140, mrp: 160, image_url: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=400&q=80', description: 'Light, healthy, and easy to digest sunflower oil.' },
  { name: 'Amul Pure Ghee (1L)', category: 'Grocery', model: 'Oil, Ghee & masala', price: 550, mrp: 600, image_url: 'https://images.unsplash.com/photo-1616428389467-1725d7ea9dcb?auto=format&fit=crop&w=400&q=80', description: 'Rich, authentic pure cow ghee.' },
  { name: 'Amul Taaza Milk (1L)', category: 'Grocery', model: 'Dairy, bread & eggs', price: 60, mrp: 65, image_url: 'https://images.unsplash.com/photo-1563636619-e9143da7973b?auto=format&fit=crop&w=400&q=80', description: 'Fresh, pasteurized, and homogenized cow milk.' },
  { name: 'Farm Fresh Eggs (6 Pack)', category: 'Grocery', model: 'Dairy, bread & eggs', price: 50, mrp: 60, image_url: 'https://images.unsplash.com/photo-1587486913049-53fc88980cfc?auto=format&fit=crop&w=400&q=80', description: 'Nutritious farm fresh white eggs.' },
  { name: 'Kelloggs Corn Flakes (475g)', category: 'Grocery', model: 'Cereals & dry fruits', price: 180, mrp: 210, image_url: 'https://images.unsplash.com/photo-1521483496732-3ea3169f4577?auto=format&fit=crop&w=400&q=80', description: 'Crispy and healthy breakfast cereal.' },
  { name: 'Premium Almonds (250g)', category: 'Grocery', model: 'Cereals & dry fruits', price: 300, mrp: 400, image_url: 'https://images.unsplash.com/photo-1508061253366-f7da158b6d46?auto=format&fit=crop&w=400&q=80', description: 'High-quality crunchy Californian almonds.' },
  { name: 'Fresh Chicken Breast (500g)', category: 'Grocery', model: 'Chicken, fish & meats', price: 200, mrp: 250, image_url: 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?auto=format&fit=crop&w=400&q=80', description: 'Tender and juicy boneless chicken breast.' },
  { name: 'McCain French Fries (400g)', category: 'Grocery', model: 'Instant & frozen food', price: 120, mrp: 140, image_url: 'https://images.unsplash.com/photo-1573081467625-f76dbff13dcb?auto=format&fit=crop&w=400&q=80', description: 'Crispy and golden frozen french fries.' },
  
  // Snacks & drinks
  { name: 'Lays Classic Salted (50g)', category: 'Snacks & drinks', model: 'Chips & namkeens', price: 20, mrp: 20, image_url: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?auto=format&fit=crop&w=400&q=80', description: 'Classic salted crispy potato chips.' },
  { name: 'Haldirams Bhujia (200g)', category: 'Snacks & drinks', model: 'Chips & namkeens', price: 50, mrp: 55, image_url: 'https://images.unsplash.com/photo-1605342795856-11f26a11124d?auto=format&fit=crop&w=400&q=80', description: 'Spicy and crunchy traditional Indian snack.' },
  { name: 'Coca Cola (750ml)', category: 'Snacks & drinks', model: 'Drinks & juices', price: 40, mrp: 45, image_url: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=400&q=80', description: 'Refreshing carbonated soft drink.' },
  { name: 'Tropicana Orange Juice (1L)', category: 'Snacks & drinks', model: 'Drinks & juices', price: 100, mrp: 120, image_url: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?auto=format&fit=crop&w=400&q=80', description: '100% pure squeezed orange juice.' },
  { name: 'Britannia Good Day (100g)', category: 'Snacks & drinks', model: 'Bakery & biscuits', price: 25, mrp: 30, image_url: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&w=400&q=80', description: 'Butter cookies with a rich taste.' },
  { name: 'Gulab Jamun (1kg)', category: 'Snacks & drinks', model: 'Sweets', price: 300, mrp: 350, image_url: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?auto=format&fit=crop&w=400&q=80', description: 'Soft and delicious syrupy dessert.' },
  { name: 'Cadbury Dairy Milk Silk (150g)', category: 'Snacks & drinks', model: 'Chocolates', price: 150, mrp: 180, image_url: 'https://images.unsplash.com/photo-1548883354-94bcfe321cfa?auto=format&fit=crop&w=400&q=80', description: 'Smooth, creamy, and premium milk chocolate.' },
  { name: 'Amul Vanilla Ice Cream (1L)', category: 'Snacks & drinks', model: 'Ice creams', price: 120, mrp: 150, image_url: 'https://images.unsplash.com/photo-1557142046-c704a3adf8af?auto=format&fit=crop&w=400&q=80', description: 'Rich and creamy classic vanilla ice cream.' },
  { name: 'Kissan Tomato Ketchup (500g)', category: 'Snacks & drinks', model: 'Sauces & spreads', price: 95, mrp: 110, image_url: 'https://images.unsplash.com/photo-1607305387299-a3d9611cd469?auto=format&fit=crop&w=400&q=80', description: 'Sweet and tangy tomato ketchup.' },
  { name: 'Taj Mahal Tea (500g)', category: 'Snacks & drinks', model: 'Tea, coffee', price: 250, mrp: 280, image_url: 'https://images.unsplash.com/photo-1576092762791-dd9e2220abd4?auto=format&fit=crop&w=400&q=80', description: 'Premium strong tea with rich aroma.' },
  { name: 'Nescafe Classic (100g)', category: 'Snacks & drinks', model: 'Tea, coffee', price: 280, mrp: 310, image_url: 'https://images.unsplash.com/photo-1559525839-b184a4d698c7?auto=format&fit=crop&w=400&q=80', description: '100% pure instant coffee.' },
  
  // Beauty & personal care
  { name: 'Dove Cream Beauty Bathing Bar', category: 'Beauty & personal care', model: 'Bath & body', price: 55, mrp: 65, image_url: 'https://images.unsplash.com/photo-1600857062241-98e5dba7f214?auto=format&fit=crop&w=400&q=80', description: 'Moisturizing beauty bathing bar.' },
  { name: 'Sunsilk Black Shine Shampoo (340ml)', category: 'Beauty & personal care', model: 'Hair care', price: 190, mrp: 210, image_url: 'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?auto=format&fit=crop&w=400&q=80', description: 'Shampoo for shiny and strong black hair.' },
  { name: 'Nivea Soft Moisturizer (200ml)', category: 'Beauty & personal care', model: 'Skin care', price: 150, mrp: 180, image_url: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=400&q=80', description: 'Light moisturizing cream for soft skin.' },
  { name: 'Fogg Marco Body Spray (150ml)', category: 'Beauty & personal care', model: 'Fragrances', price: 200, mrp: 250, image_url: 'https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&w=400&q=80', description: 'Long-lasting premium body spray for men.' }
];

async function seedData() {
  try {
    console.log('Starting DB insert...');
    
    // Insert Categories
    for (const cat of categories) {
      // Check if category exists
      const existCat = await pool.query('SELECT * FROM categories WHERE name = $1', [cat.name]);
      if (existCat.rows.length === 0) {
        await pool.query(
          'INSERT INTO categories (name, models, image_url) VALUES ($1, $2, $3)',
          [cat.name, JSON.stringify(cat.models), cat.image_url]
        );
        console.log(`Inserted category: ${cat.name}`);
      } else {
        // Update models just in case
        await pool.query(
          'UPDATE categories SET models = $1 WHERE name = $2',
          [JSON.stringify(cat.models), cat.name]
        );
        console.log(`Updated models for category: ${cat.name}`);
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
    
    console.log(`Successfully inserted ${insertedProducts} new products.`);
    process.exit(0);
  } catch (err) {
    console.error('Error seeding data:', err);
    process.exit(1);
  }
}

seedData();
