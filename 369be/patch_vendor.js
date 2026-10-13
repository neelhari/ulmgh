const fs = require('fs');
const path = './routes/vendor.js';
let content = fs.readFileSync(path, 'utf8');

// Insert GET and POST /categories/selected endpoints before GET /categories
const categoriesEndpoints = `
// --- Categories Selection (Subscription Limit) ---
router.get('/categories/selected', async (req, res) => {
  try {
    // Get vendor's selected categories
    const vendorRes = await pool.query('SELECT selected_categories FROM vendors WHERE id=$1', [req.vendorId]);
    const selected = vendorRes.rows[0]?.selected_categories || [];

    // Get subscription category limit
    const subRes = await pool.query(
      'SELECT features FROM vendor_subscriptions WHERE vendor_id=$1 ORDER BY created_at DESC LIMIT 1',
      [req.vendorId]
    );
    const categoryLimit = subRes.rows[0]?.features?.category_limit;
    
    res.json({ 
      selected_categories: selected,
      category_limit: categoryLimit ? parseInt(categoryLimit, 10) : null
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/categories/selected', async (req, res) => {
  const { categories } = req.body;
  if (!Array.isArray(categories)) return res.status(400).json({ error: 'categories must be an array' });

  try {
    // 1. Check if vendor has already selected categories (Lock once selected)
    const vendorRes = await pool.query('SELECT selected_categories FROM vendors WHERE id=$1', [req.vendorId]);
    const existing = vendorRes.rows[0]?.selected_categories || [];
    
    if (existing && existing.length > 0) {
      return res.status(400).json({ error: 'Categories are locked once selected and cannot be changed.' });
    }

    // 2. Check limits
    const subRes = await pool.query(
      'SELECT features FROM vendor_subscriptions WHERE vendor_id=$1 ORDER BY created_at DESC LIMIT 1',
      [req.vendorId]
    );
    const categoryLimit = subRes.rows[0]?.features?.category_limit;
    
    if (categoryLimit) {
      const limit = parseInt(categoryLimit, 10);
      if (!isNaN(limit) && categories.length > limit) {
        return res.status(400).json({ error: \`You can only select up to \${limit} categories.\` });
      }
    }

    // 3. Save
    await pool.query('UPDATE vendors SET selected_categories=$1 WHERE id=$2', [JSON.stringify(categories), req.vendorId]);
    res.json({ message: 'Categories saved successfully and are now locked.', selected_categories: categories });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Categories ---
`;
content = content.replace('// --- Categories ---', categoriesEndpoints);

// Update POST /products
const postProductsUpdate = `
    const productLimit = subRes.rows[0]?.features?.product_limit;
    if (productLimit) {
      const limit = parseInt(productLimit, 10);
      if (!isNaN(limit)) {
        const countRes = await pool.query('SELECT COUNT(*) FROM products WHERE vendor_id=$1', [req.vendorId]);
        const count = parseInt(countRes.rows[0].count, 10);
        if (count >= limit) {
          return res.status(403).json({ error: \`You have reached your subscription limit of \${limit} products.\` });
        }
      }
    }
    
    // Check Category restriction
    const vendorRes = await pool.query('SELECT selected_categories FROM vendors WHERE id=$1', [req.vendorId]);
    const selectedCats = vendorRes.rows[0]?.selected_categories || [];
    const categoryLimit = subRes.rows[0]?.features?.category_limit;
    
    // If a limit is present in subscription, they must have it in selected_categories
    if (categoryLimit && !isNaN(parseInt(categoryLimit, 10))) {
      if (!selectedCats.includes(category)) {
        return res.status(403).json({ error: \`Category '\${category}' is not in your allowed selected categories.\` });
      }
    }
`;
content = content.replace(/\s*const productLimit = subRes\.rows\[0\]\?\.features\?\.product_limit;[\s\S]*?(?=\/\/ Extract generic price)/, postProductsUpdate + '\n\n    // Extract generic price');

// Update PUT /products/:id
const putProductsUpdate = `
  try {
    // Ensure product belongs to vendor
    const check = await pool.query('SELECT id FROM products WHERE id=$1 AND vendor_id=$2', [req.params.id, req.vendorId]);
    if (check.rows.length === 0) return res.status(403).json({ error: 'Not authorized or product not found' });

    // Check Category restriction
    const subRes = await pool.query(
      'SELECT features FROM vendor_subscriptions WHERE vendor_id=$1 ORDER BY created_at DESC LIMIT 1',
      [req.vendorId]
    );
    const vendorRes = await pool.query('SELECT selected_categories FROM vendors WHERE id=$1', [req.vendorId]);
    const selectedCats = vendorRes.rows[0]?.selected_categories || [];
    const categoryLimit = subRes.rows[0]?.features?.category_limit;
    
    if (categoryLimit && !isNaN(parseInt(categoryLimit, 10))) {
      if (!selectedCats.includes(category)) {
        return res.status(403).json({ error: \`Category '\${category}' is not in your allowed selected categories.\` });
      }
    }
`;
content = content.replace(/\s*try \{\s*\/\/ Ensure product belongs to vendor[\s\S]*?(?=const attrs = custom_attributes \|\| \{\};)/, putProductsUpdate + '\n    ');

fs.writeFileSync(path, content);
console.log("Patched vendor.js");
