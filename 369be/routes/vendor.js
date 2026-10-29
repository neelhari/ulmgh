const router = require('express').Router();
const pool = require('../db');
const { vendorAuthMiddleware } = require('./vendorAuth');
const fulfillmentService = require('../services/fulfillmentService');
const {
  validatePickupAddress,
  generateShiprocketNickname,
  formatFullAddress,
  INDIAN_STATES
} = require('../utils/pickupValidation');

router.use(vendorAuthMiddleware);

// --- Stats ---
router.get('/stats', async (req, res) => {
  try {
    const productsRes = await pool.query('SELECT COUNT(*) FROM products WHERE vendor_id = $1', [req.vendorId]);
    
    // For vendor orders, we look at orders that have items with this vendor's ID.
    // In PostgreSQL, you can use jsonb array elements to query.
    // Alternatively, just query orders and filter in JS if it's simpler and not too large.
    const ordersRes = await pool.query(`
      SELECT o.total, o.items 
      FROM orders o 
      WHERE o.status != 'cancelled'
    `);
    
    let totalVendorOrders = 0;
    let totalVendorRevenue = 0;

    ordersRes.rows.forEach(order => {
      let items = [];
      try { items = typeof order.items === 'string' ? JSON.parse(order.items) : (order.items || []); } catch(e) {}
      
      let hasVendorItem = false;
      items.forEach(item => {
        // If product has vendor_id, match it. Assuming items store product details including vendor_id, 
        // or we need to join products on order creation. For now, rely on product.vendor_id in JSON
        if (item.product && item.product.vendor_id === req.vendorId) {
          hasVendorItem = true;
          totalVendorRevenue += parseFloat(item.qty * (item.variant?.price || item.product?.price || 0));
        }
      });
      if (hasVendorItem) totalVendorOrders++;
    });

    res.json({
      totalProducts: parseInt(productsRes.rows[0].count),
      totalOrders: totalVendorOrders,
      totalRevenue: totalVendorRevenue
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Products ---
router.get('/products', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM products WHERE vendor_id = $1 ORDER BY created_at DESC', [req.vendorId]);
    const products = result.rows;
    
    const subRes = await pool.query('SELECT features FROM vendor_subscriptions WHERE vendor_id = $1 AND expires_at > NOW() ORDER BY created_at DESC LIMIT 1', [req.vendorId]);
    let maxProducts = 10; // Default limit for free/no sub
    let isUnlimited = false;

    if (subRes.rows.length > 0) {
      const features = typeof subRes.rows[0].features === 'string' ? JSON.parse(subRes.rows[0].features) : (subRes.rows[0].features || {});
      if (features.product_limit === -1 || String(features.product_limit).toLowerCase() === 'unlimited') {
        isUnlimited = true;
      } else {
        maxProducts = parseInt(features.product_limit) || maxProducts;
      }
    }

    res.json({ 
      products,
      subscriptionStats: {
        added: products.length,
        max: maxProducts,
        isUnlimited,
        remaining: isUnlimited ? 'Unlimited' : Math.max(0, maxProducts - products.length)
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/products', async (req, res) => {
  const { name, slug, short_description, description, category, image_url, images, custom_attributes, variants, gender, price, mrp, stock, brand, sku } = req.body;

  try {
    // Enforce subscription product limit
    const subRes = await pool.query(
      'SELECT features FROM vendor_subscriptions WHERE vendor_id=$1 ORDER BY created_at DESC LIMIT 1',
      [req.vendorId]
    );
    const productLimit = subRes.rows[0]?.features?.product_limit;
    if (productLimit) {
      const limit = parseInt(productLimit, 10);
      if (!isNaN(limit)) {
        const countRes = await pool.query('SELECT COUNT(*) FROM products WHERE vendor_id=$1', [req.vendorId]);
        const count = parseInt(countRes.rows[0].count, 10);
        if (count >= limit) {
          return res.status(403).json({ error: `You have reached your subscription limit of ${limit} products.` });
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
        return res.status(403).json({ error: `Category '${category}' is not in your allowed selected categories.` });
      }
    }


    // Extract generic price// Extract generic price and stock from custom_attributes for quick indexing if present
    const attrs = custom_attributes || {};
    
    // Attempt to find something named "Price" or "Stock"
    

    const result = await pool.query(
      `INSERT INTO products (
        name, slug, short_description, description, category, image_url, images, sizes, vendor_id, price, stock, custom_attributes, status, is_active, gender, mrp, brand, sku
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'pending', false, $13, $14, $15, $16
      ) RETURNING *`,
      [
        name, slug, short_description, description, category, image_url, JSON.stringify(images || []), JSON.stringify(variants || []), req.vendorId, price || 0, stock || 0,
        JSON.stringify(attrs), gender || 'Any', mrp || 0, brand || '', sku || ''
      ]
    );
    res.json({ product: result.rows[0], message: 'Product submitted for admin approval.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/products/:id', async (req, res) => {
  const { name, slug, short_description, description, category, image_url, images, custom_attributes, variants, gender, price, mrp, stock, brand, sku } = req.body;
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
        return res.status(403).json({ error: `Category '${category}' is not in your allowed selected categories.` });
      }
    }

    const attrs = custom_attributes || {};
    
    
    const result = await pool.query(
      'UPDATE products SET name=$1, slug=$2, short_description=$3, description=$4, category=$5, image_url=$6, images=$7, sizes=$8, custom_attributes=$9, price=$10, stock=$11, gender=$13, mrp=$14, brand=$15, sku=$16 WHERE id=$12 RETURNING *',
      [name, slug, short_description, description, category, image_url, JSON.stringify(images || []), JSON.stringify(variants || []), JSON.stringify(attrs), price || 0, stock || 0, req.params.id, gender || 'Any', mrp || 0, brand || '', sku || '']
    );
    res.json({ product: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/products/:id', async (req, res) => {
  try {
    const check = await pool.query('SELECT id FROM products WHERE id=$1 AND vendor_id=$2', [req.params.id, req.vendorId]);
    if (check.rows.length === 0) return res.status(403).json({ error: 'Not authorized or product not found' });

    await pool.query('DELETE FROM products WHERE id=$1', [req.params.id]);
    res.json({ message: 'Product deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Orders (Phase 3 Multi-Vendor Fulfillment) ---
router.get('/orders', async (req, res) => {
  try {
    const fulRes = await pool.query(
      `SELECT f.*, 
              o.order_number, o.created_at as order_created_at, o.payment_method, o.address as order_address,
              u.name as user_name, u.email as user_email, u.phone as user_phone
       FROM order_fulfillments f
       JOIN orders o ON f.order_id = o.id
       LEFT JOIN users u ON o.user_id = u.id
       WHERE f.vendor_id = $1
       ORDER BY f.created_at DESC`,
      [req.vendorId]
    );

    const vendorOrders = [];
    for (const f of fulRes.rows) {
      const itemsRes = await pool.query(
        'SELECT * FROM order_fulfillment_items WHERE fulfillment_id = $1 ORDER BY id ASC',
        [f.id]
      );
      
      let parsedAddress = {};
      try {
        parsedAddress = typeof f.order_address === 'string' ? JSON.parse(f.order_address) : (f.order_address || {});
      } catch (e) {
        parsedAddress = {};
      }

      const items = itemsRes.rows.map(it => ({
        id: it.product_id,
        qty: it.quantity,
        price: it.unit_price,
        variant: it.variant_details || {},
        product: {
          id: it.product_id,
          name: it.product_name,
          vendor_id: f.vendor_id,
          price: it.unit_price
        }
      }));

      vendorOrders.push({
        id: f.id,
        fulfillment_id: f.id,
        fulfillment_number: f.fulfillment_number,
        order_id: f.order_id,
        order_number: f.order_number,
        status: f.status,
        total: f.total_amount,
        subtotal: f.subtotal,
        awb: f.awb_code,
        courier: f.courier_name,
        tracking_link: f.tracking_url,
        sync_error: f.sync_error,
        pickup_location_nickname: f.pickup_location_nickname,
        address: parsedAddress,
        user_name: f.user_name,
        user_phone: f.user_phone,
        created_at: f.order_created_at || f.created_at,
        items
      });
    }

    res.json({ orders: vendorOrders });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/vendor/fulfillments/:id/status
router.put('/fulfillments/:id/status', async (req, res) => {
  const { status } = req.body;
  if (!['pending', 'processing', 'ready_to_ship'].includes(status)) {
    return res.status(400).json({ error: 'Vendors can only update status to pending, processing, or ready_to_ship' });
  }
  try {
    const updateRes = await pool.query(
      `UPDATE order_fulfillments 
       SET status = $1, updated_at = NOW() 
       WHERE id = $2 AND vendor_id = $3 
       RETURNING *`,
      [status, req.params.id, req.vendorId]
    );
    if (updateRes.rows.length === 0) {
      return res.status(404).json({ error: 'Fulfillment not found or unauthorized' });
    }
    res.json({ fulfillment: updateRes.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/vendor/fulfillments/:id/dispatch - Vendor dispatches their own package via Shiprocket
router.post('/fulfillments/:id/dispatch', async (req, res) => {
  const fulfillmentId = req.params.id;
  try {
    const checkRes = await pool.query(
      'SELECT id, vendor_id, status FROM order_fulfillments WHERE id = $1',
      [fulfillmentId]
    );
    if (checkRes.rows.length === 0) {
      return res.status(404).json({ error: 'Fulfillment package not found' });
    }
    const f = checkRes.rows[0];
    if (String(f.vendor_id) !== String(req.vendorId)) {
      return res.status(403).json({ error: 'Unauthorized: You can only dispatch packages assigned to your vendor account' });
    }
    if (f.status === 'cancelled') {
      return res.status(400).json({ error: 'Cannot dispatch a cancelled package' });
    }

    const result = await fulfillmentService.shipFulfillment(fulfillmentId, { vendorId: req.vendorId });
    res.json(result);
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message });
  }
});

// POST /api/vendor/fulfillments/:id/cancel - Vendor cancels their own package
router.post('/fulfillments/:id/cancel', async (req, res) => {
  const fulfillmentId = req.params.id;
  const { reason } = req.body || {};
  try {
    const result = await fulfillmentService.cancelFulfillmentPackage(fulfillmentId, {
      cancelledBy: 'vendor',
      vendorId: req.vendorId,
      reason
    });
    res.json(result);
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message });
  }
});

// POST /api/vendor/fulfillments/:id/sync-status - Vendor syncs live courier status for their package
router.post('/fulfillments/:id/sync-status', async (req, res) => {
  const fulfillmentId = req.params.id;
  try {
    const checkRes = await pool.query(
      'SELECT id, vendor_id FROM order_fulfillments WHERE id = $1',
      [fulfillmentId]
    );
    if (checkRes.rows.length === 0) {
      return res.status(404).json({ error: 'Fulfillment package not found' });
    }
    if (String(checkRes.rows[0].vendor_id) !== String(req.vendorId)) {
      return res.status(403).json({ error: 'Unauthorized: You can only view status of your own packages' });
    }

    const result = await fulfillmentService.syncFulfillmentStatus(fulfillmentId);
    res.json(result);
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message });
  }
});


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
  const { categories, gender } = req.body;
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
        return res.status(400).json({ error: `You can only select up to ${limit} categories.` });
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

router.get('/categories', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM categories ORDER BY id ASC');
    res.json({ categories: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Vendor Transactions (Payout History) ---
router.get('/transactions', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM vendor_transactions WHERE vendor_id = $1 ORDER BY created_at DESC',
      [req.vendorId]
    );
    res.json({ transactions: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Vendor Support Agents ---
const bcrypt = require('bcryptjs');

// GET /api/vendor/support-agents
router.get('/support-agents', async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, name, email, is_active, created_at, access_pages FROM support_agents WHERE scope='vendor' AND vendor_id=$1 ORDER BY created_at DESC",
      [req.vendorId]
    );
    res.json({ agents: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/vendor/support-agents
router.post('/support-agents', async (req, res) => {
  const { name, email, password, access_pages, gender } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: 'name, email and password required' });
  try {
    const existing = await pool.query('SELECT id FROM support_agents WHERE email = $1', [email]);
    if (existing.rows.length > 0) return res.status(400).json({ error: 'Email already exists' });
    const password_hash = await bcrypt.hash(password, 10);
    const pages = Array.isArray(access_pages) ? JSON.stringify(access_pages) : '[]';
    const result = await pool.query(
      "INSERT INTO support_agents (name, email, password_hash, scope, vendor_id, access_pages) VALUES ($1, $2, $3, 'vendor', $4, $5) RETURNING id, name, email, is_active, created_at, access_pages",
      [name, email, password_hash, req.vendorId, pages]
    );
    res.json({ agent: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/vendor/support-agents/:id/toggle
router.put('/support-agents/:id/toggle', async (req, res) => {
  try {
    const result = await pool.query(
      "UPDATE support_agents SET is_active = NOT is_active WHERE id=$1 AND scope='vendor' AND vendor_id=$2 RETURNING id, name, email, is_active, access_pages",
      [req.params.id, req.vendorId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Agent not found' });
    res.json({ agent: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/vendor/support-agents/:id
router.delete('/support-agents/:id', async (req, res) => {
  try {
    await pool.query("DELETE FROM support_agents WHERE id=$1 AND scope='vendor' AND vendor_id=$2", [req.params.id, req.vendorId]);
    res.json({ message: 'Agent deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Vendor Image Upload ---
// POST /api/vendor/upload
const multer = require('multer');
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype && file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

router.post('/upload', (req, res) => {
  upload.single('image')(req, res, async (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'Image size exceeds the 5 MB limit' });
      }
      return res.status(400).json({ error: err.message || 'File upload error' });
    }

    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No image uploaded' });
      }

      // Convert buffer to base64 data URI
      const b64 = Buffer.from(req.file.buffer).toString('base64');
      const dataURI = `data:${req.file.mimetype};base64,${b64}`;

      const result = await cloudinary.uploader.upload(dataURI, {
        folder: 'vendor_uploads'
      });

      res.json({ url: result.secure_url });
    } catch (uploadErr) {
      console.error('Cloudinary vendor upload error:', uploadErr);
      res.status(500).json({ error: 'Failed to upload image' });
    }
  });
});

// --- Vendor Account Deletion ---
// DELETE /api/vendor/account
router.delete('/account', async (req, res) => {
  const { password } = req.body;
  if (!password) {
    return res.status(400).json({ error: 'Password is required to delete your account' });
  }

  try {
    const vendorRes = await pool.query('SELECT * FROM vendors WHERE id = $1', [req.vendorId]);
    if (vendorRes.rows.length === 0) {
      return res.status(404).json({ error: 'Vendor not found' });
    }
    const vendor = vendorRes.rows[0];

    // 1. Verify password
    const match = await bcrypt.compare(password, vendor.password_hash);
    if (!match) {
      return res.status(400).json({ error: 'Incorrect password' });
    }

    // 2. Refuse if wallet balance is above 0
    const balance = parseFloat(vendor.wallet_balance || 0);
    if (balance > 0) {
      return res.status(400).json({
        error: `Cannot delete account with an active wallet balance of ₹${balance.toLocaleString()}. Please contact admin to withdraw your remaining balance first.`
      });
    }

    // 3. Anonymize vendor record
    const anonymizedEmail = `deleted_vendor_${vendor.id}_${Date.now()}@deleted.ulmgh.invalid`;
    try {
      await pool.query(
        `UPDATE vendors
         SET name = 'Deleted Vendor',
             store_name = 'Closed Store',
             email = $1,
             phone = '',
             address = '',
             password_hash = '',
             status = 'inactive',
             is_deleted = TRUE,
             deleted_at = NOW()
         WHERE id = $2`,
        [anonymizedEmail, req.vendorId]
      );
    } catch (updateErr) {
      if (updateErr.code === '42703') { // is_deleted / deleted_at columns not created yet before migration
        await pool.query(
          `UPDATE vendors
           SET name = 'Deleted Vendor',
               store_name = 'Closed Store',
               email = $1,
               phone = '',
               address = '',
               password_hash = '',
               status = 'inactive'
           WHERE id = $2`,
          [anonymizedEmail, req.vendorId]
        );
      } else {
        throw updateErr;
      }
    }

    // 4. Deactivate vendor products
    await pool.query(
      "UPDATE products SET is_active = FALSE, status = 'archived' WHERE vendor_id = $1",
      [req.vendorId]
    );

    // 5. Deactivate support agents
    await pool.query(
      "UPDATE support_agents SET is_active = FALSE WHERE scope = 'vendor' AND vendor_id = $1",
      [req.vendorId]
    );

    // Orders and transaction history remain intact for accounting
    res.json({ success: true, message: 'Vendor account successfully deleted and closed' });
  } catch (err) {
    console.error('Account deletion error:', err);
    res.status(500).json({ error: 'Failed to delete account. Please try again later.' });
  }
});

// --- Vendor Profile & Pickup Warehouse Address ---
// GET /api/vendor/pickup-states
router.get('/pickup-states', (req, res) => {
  res.json({ states: INDIAN_STATES });
});

const { handleVendorAddressUpdate } = require('../services/vendorPickupService');

// PUT /api/vendor/profile
router.put('/profile', async (req, res) => {
  try {
    const result = await handleVendorAddressUpdate(req.vendorId, req.body);
    res.json({
      message: result.message,
      vendor: result.vendor,
      syncResult: result.syncResult,
    });
  } catch (err) {
    console.error('Update vendor profile error:', err);
    res.status(400).json({ error: err.message || 'Failed to update pickup location' });
  }
});

module.exports = router;
