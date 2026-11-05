const router = require('express').Router();
const pool = require('../db');
const { authMiddleware } = require('./auth');
const { syncVendorPickupWithShiprocket } = require('../services/vendorPickupService');
const fulfillmentService = require('../services/fulfillmentService');
const { sendPushToCustomer, sendPushToVendor } = require('../services/firebase');

function adminOnly(req, res, next) {
  if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Admin access only' });
  next();
}

// GET /api/admin/stats
router.get('/stats', authMiddleware, adminOnly, async (req, res) => {
  try {
    const [users, orders, revenue] = await Promise.all([
      pool.query('SELECT COUNT(*) FROM users WHERE role=$1', ['user']),
      pool.query('SELECT COUNT(*) FROM orders'),
      pool.query("SELECT COALESCE(SUM(total),0) as total FROM orders WHERE status != 'cancelled'"),
    ]);
    res.json({
      totalUsers: parseInt(users.rows[0].count),
      totalOrders: parseInt(orders.rows[0].count),
      totalRevenue: parseFloat(revenue.rows[0].total),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/users
router.get('/users', authMiddleware, adminOnly, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, email, phone, role, is_verified, created_at FROM users ORDER BY created_at DESC'
    );
    res.json({ users: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/admin/users/:id
router.delete('/users/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    await pool.query('DELETE FROM users WHERE id=$1 AND role != $2', [req.params.id, 'admin']);
    res.json({ message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/orders
router.get('/orders', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { type, vendor_id } = req.query;
    const result = await pool.query(
      `SELECT o.*, u.name as user_name, u.email as user_email, u.phone as user_phone
       FROM orders o LEFT JOIN users u ON o.user_id = u.id
       ORDER BY o.created_at DESC`
    );

    const filteredOrders = [];
    for (const ord of result.rows) {
      let fulfillments = await fulfillmentService.getFulfillmentsForOrder(ord.id);

      if (type === 'admin') {
        fulfillments = fulfillments.filter(f => f.vendor_id === null);
        if (fulfillments.length === 0) continue;
      } else if (type === 'vendor') {
        fulfillments = fulfillments.filter(f => f.vendor_id !== null && (!vendor_id || String(f.vendor_id) === String(vendor_id)));
        if (fulfillments.length === 0) continue;
      }

      ord.fulfillments = fulfillments;
      filteredOrders.push(ord);
    }

    res.json({ orders: filteredOrders });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/orders/:id/fulfillments
router.get('/orders/:id/fulfillments', authMiddleware, adminOnly, async (req, res) => {
  try {
    const fulfillments = await fulfillmentService.getFulfillmentsForOrder(req.params.id);
    res.json({ fulfillments });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/admin/orders/:id/status
router.put('/orders/:id/status', authMiddleware, adminOnly, async (req, res) => {
  const { status } = req.body;
  const orderId = req.params.id;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Lock the order row to prevent concurrent race conditions
    const orderRes = await client.query('SELECT * FROM orders WHERE id = $1 FOR UPDATE', [orderId]);
    const order = orderRes.rows[0];

    if (!order) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Order not found' });
    }

    // Only restore stock and cancel shipments if transitioning to 'cancelled' and was not already cancelled
    if (status === 'cancelled' && order.status !== 'cancelled') {
      const fulCheck = await client.query(
        'SELECT id, status FROM order_fulfillments WHERE order_id = $1',
        [orderId]
      );

      if (fulCheck.rows.length > 0) {
        // Cancel each active fulfillment package (cancels Shiprocket shipments & restores inventory)
        for (const ful of fulCheck.rows) {
          if (ful.status !== 'cancelled') {
            await fulfillmentService.cancelFulfillmentPackage(ful.id, {
              cancelledBy: 'admin',
              reason: 'Order cancelled by Admin'
            }, client);
          }
        }
      } else {
        // Fallback for legacy orders without fulfillment packages
        let items = [];
        try {
          items = typeof order.items === 'string' ? JSON.parse(order.items) : (order.items || []);
        } catch (parseErr) {
          items = [];
        }

        for (const item of items) {
          const prodId = item.product?.id || item.id;
          const qty = Math.max(1, parseInt(item.qty || item.quantity || 1, 10));
          if (prodId) {
            await client.query(
              'UPDATE products SET stock = stock + $1 WHERE id = $2',
              [qty, prodId]
            );
          }
        }

        // Reverse any vendor credits for legacy order without fulfillment packages
        if (order.order_number) {
          const vCredits = await client.query(
            'SELECT DISTINCT vendor_id FROM vendor_transactions WHERE order_number = $1 AND type = $2',
            [order.order_number, 'credit']
          );
          for (const row of vCredits.rows) {
            const vendorAccountingService = require('../services/vendorAccountingService');
            await vendorAccountingService.reverseVendorOrderCredit({
              vendorId: row.vendor_id,
              orderNumber: order.order_number,
              reason: 'Order cancelled by Admin',
              client
            });
          }
        }
      }
    }

    const updateRes = await client.query(
      'UPDATE orders SET status = $1 WHERE id = $2 RETURNING *',
      [status, orderId]
    );

    await client.query('COMMIT');

    const updatedOrder = updateRes.rows[0];
    if (updatedOrder && updatedOrder.user_id) {
      const isCancelled = status.toLowerCase() === 'cancelled';
      const statusTitle = isCancelled ? 'Order Cancelled' : `Order Status Updated: ${status.toUpperCase()}`;
      const statusBody = isCancelled 
        ? `Your order #${updatedOrder.order_number} has been cancelled.`
        : `Your order #${updatedOrder.order_number} is now ${status}.`;

      sendPushToCustomer(
        updatedOrder.user_id,
        {
          title: statusTitle,
          body: statusBody,
          data: {
            orderId: String(updatedOrder.id),
            orderNumber: String(updatedOrder.order_number),
            status: String(status),
            screen: 'order-tracking',
            type: isCancelled ? 'order_cancelled' : 'order_status_update'
          }
        },
        `order_status:${updatedOrder.id}:${status}`,
        String(updatedOrder.id),
        isCancelled ? 'order_cancelled' : 'order_status_update'
      ).catch(e => console.error('[Push] Order status update push error:', e));

      // If order was cancelled, also alert vendors
      if (isCancelled) {
        pool.query(
          'SELECT DISTINCT vendor_id FROM order_fulfillments WHERE order_id = $1',
          [updatedOrder.id]
        ).then(vRes => {
          for (const row of vRes.rows) {
            if (row.vendor_id) {
              sendPushToVendor(
                row.vendor_id,
                {
                  title: 'Order Cancelled ⚠️',
                  body: `Order #${updatedOrder.order_number} has been cancelled.`,
                  data: {
                    orderId: String(updatedOrder.id),
                    orderNumber: String(updatedOrder.order_number),
                    screen: 'vendor-orders',
                    type: 'order_cancelled'
                  }
                },
                `order_cancelled:${updatedOrder.id}:vendor:${row.vendor_id}`,
                String(updatedOrder.id),
                'order_cancelled'
              ).catch(err => console.error('[Push] Vendor order cancel push error:', err));
            }
          }
        }).catch(err => console.error('[Push] Fetch vendors for cancellation error:', err));
      }
    }

    res.json({ order: updateRes.rows[0] });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error updating order status:', err);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// GET /api/admin/vendors/:id/bank-details - Fetch vendor's saved bank details from database
router.get('/vendors/:id/bank-details', authMiddleware, adminOnly, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, name, store_name, email, wallet_balance,
              bank_account_holder_name, bank_account_number, bank_ifsc_code, bank_name
       FROM vendors 
       WHERE id = $1`,
      [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Vendor not found' });
    res.json({ vendor: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


const shiprocket = require('../utils/shiprocket');

// POST /api/admin/fulfillments/:id/ship
router.post('/fulfillments/:id/ship', authMiddleware, adminOnly, async (req, res) => {
  try {
    const result = await fulfillmentService.shipFulfillment(req.params.id);
    res.json(result);
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message });
  }
});

// POST /api/admin/fulfillments/:id/retry
router.post('/fulfillments/:id/retry', authMiddleware, adminOnly, async (req, res) => {
  try {
    const result = await fulfillmentService.shipFulfillment(req.params.id);
    res.json(result);
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message });
  }
});

// POST /api/admin/fulfillments/:id/cancel - Admin cancels any fulfillment package
router.post('/fulfillments/:id/cancel', authMiddleware, adminOnly, async (req, res) => {
  try {
    const result = await fulfillmentService.cancelFulfillmentPackage(req.params.id, {
      cancelledBy: 'admin',
      reason: req.body?.reason || 'Cancelled by Admin'
    });
    res.json(result);
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message });
  }
});

// POST /api/admin/fulfillments/:id/sync-status - Admin syncs live courier status for any package
router.post('/fulfillments/:id/sync-status', authMiddleware, adminOnly, async (req, res) => {
  try {
    const result = await fulfillmentService.syncFulfillmentStatus(req.params.id);
    res.json(result);
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message });
  }
});

// POST /api/admin/orders/:id/ship [DEPRECATED in Phase 3 - Disabled to prevent duplicate whole-order shipping]
router.post('/orders/:id/ship', authMiddleware, adminOnly, async (req, res) => {
  return res.status(409).json({
    error: 'Whole-order shipping is disabled in Phase 3. Please dispatch individual vendor packages using POST /api/admin/fulfillments/:id/ship.'
  });
});

// GET /api/admin/warehouse-settings - Fetch saved admin warehouse address
router.get('/warehouse-settings', authMiddleware, adminOnly, async (req, res) => {
  try {
    let savedAddress = null;
    let selectedNickname = null;

    try {
      const addrRes = await pool.query("SELECT value FROM app_settings WHERE key = 'admin_pickup_address' LIMIT 1");
      if (addrRes.rows.length > 0 && addrRes.rows[0].value) {
        savedAddress = typeof addrRes.rows[0].value === 'string'
          ? JSON.parse(addrRes.rows[0].value)
          : addrRes.rows[0].value;
      }
    } catch (e) {
      console.warn('Could not read admin_pickup_address:', e.message);
    }

    try {
      const nickRes = await pool.query("SELECT value FROM app_settings WHERE key = 'admin_pickup_nickname' LIMIT 1");
      if (nickRes.rows.length > 0 && nickRes.rows[0].value) {
        selectedNickname = nickRes.rows[0].value;
      }
    } catch (e) {
      console.warn('Could not read admin_pickup_nickname:', e.message);
    }

    res.json({
      selected_nickname: selectedNickname,
      address: savedAddress,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/admin/warehouse-settings - Save admin pickup warehouse address and sync to Shiprocket
router.put('/warehouse-settings', authMiddleware, adminOnly, async (req, res) => {
  const { validatePickupAddress, computeAddressHash } = require('../utils/pickupValidation');
  const validation = validatePickupAddress(req.body || {});
  if (!validation.isValid) {
    return res.status(400).json({ error: validation.error });
  }

  const sanitized = validation.sanitized;
  const addressHash = computeAddressHash(sanitized);

  // Generate deterministic Shiprocket nickname for the platform warehouse
  const nickname = `admin_hub_${sanitized.pickup_pincode}`;

  let shiprocketSyncSuccess = false;
  let shiprocketSyncMessage = null;

  try {
    // 1. Check if nickname already registered on Shiprocket or register it via addpickup
    const existingLocations = await shiprocket.getPickupLocations();
    const existingMatch = (existingLocations || []).find(
      l => (l.pickup_location || '').toLowerCase() === nickname.toLowerCase()
    );

    if (existingMatch) {
      shiprocketSyncSuccess = true;
      shiprocketSyncMessage = 'Linked with existing registered Shiprocket pickup location.';
    } else {
      const payload = {
        pickup_location: nickname,
        name: sanitized.pickup_contact_name,
        email: req.user?.email || 'admin@ulmgh369.com',
        phone: sanitized.pickup_phone,
        address: sanitized.pickup_line1,
        address_2: sanitized.pickup_line2 || '',
        city: sanitized.pickup_city,
        state: sanitized.pickup_state,
        country: 'India',
        pin_code: sanitized.pickup_pincode,
      };

      await shiprocket.registerPickupLocation(payload);
      shiprocketSyncSuccess = true;
      shiprocketSyncMessage = 'Registered with Shiprocket successfully.';
    }
  } catch (srErr) {
    console.warn('Shiprocket registration notice:', srErr.message);
    shiprocketSyncSuccess = false;
    shiprocketSyncMessage = `Address saved in database, but Shiprocket live registration could not be completed (${srErr.message}).`;
  }

  try {
    // 2. Persist in database app_settings
    await pool.query(
      `INSERT INTO app_settings (key, value, description, updated_at)
       VALUES ('admin_pickup_address', $1, 'Admin warehouse pickup address details', NOW())
       ON CONFLICT (key) DO UPDATE SET value = $1, updated_at = NOW()`,
      [JSON.stringify(sanitized)]
    );

    await pool.query(
      `INSERT INTO app_settings (key, value, description, updated_at)
       VALUES ('admin_pickup_nickname', $1, 'Shiprocket pickup nickname for platform/admin-owned products', NOW())
       ON CONFLICT (key) DO UPDATE SET value = $1, updated_at = NOW()`,
      [nickname]
    );

    res.json({
      success: true,
      selected_nickname: nickname,
      address: sanitized,
      shiprocket_synced: shiprocketSyncSuccess,
      message: shiprocketSyncSuccess
        ? 'Admin pickup address saved and registered with Shiprocket successfully!'
        : shiprocketSyncMessage
    });
  } catch (dbErr) {
    res.status(500).json({ error: dbErr.message });
  }
});

// --- Products ---
router.get('/products', authMiddleware, adminOnly, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM products ORDER BY created_at DESC');
    res.json({ products: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/products', authMiddleware, adminOnly, async (req, res) => {
  const { name, slug, short_description, description, category, image_url, images, custom_attributes, vendor_id, variants, gender, price, mrp, stock, brand, sku } = req.body;
  
  try {
    const attrs = custom_attributes || {};
    

    const result = await pool.query(
      `INSERT INTO products 
       (name, slug, short_description, description, category, image_url, images, sizes, custom_attributes, price, stock, vendor_id, gender, mrp, brand, sku) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16) RETURNING *`,
      [name, slug, short_description, description, category, image_url, JSON.stringify(images || []), JSON.stringify(variants || []), JSON.stringify(attrs), price || 0, stock || 0, vendor_id || null, gender || 'Any', mrp || 0, brand || '', sku || '']
    );
    res.json({ product: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/products/:id', authMiddleware, adminOnly, async (req, res) => {
  const { name, slug, short_description, description, category, image_url, images, custom_attributes, vendor_id, variants, gender, price, mrp, stock, brand, sku } = req.body;
  try {
    const attrs = custom_attributes || {};
    

    const result = await pool.query(
      'UPDATE products SET name=$1, slug=$2, short_description=$3, description=$4, category=$5, image_url=$6, images=$7, sizes=$8, custom_attributes=$9, price=$10, stock=$11, vendor_id=$12, gender=$13, mrp=$14, brand=$15, sku=$16 WHERE id=$17 RETURNING *',
      [name, slug, short_description, description, category, image_url, JSON.stringify(images || []), JSON.stringify(variants || []), JSON.stringify(attrs), price || 0, stock || 0, vendor_id || null, gender || 'Any', mrp || 0, brand || '', sku || '', req.params.id]
    );
    res.json({ product: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/products/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    await pool.query('DELETE FROM products WHERE id=$1', [req.params.id]);
    res.json({ message: 'Product deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Banners ---
router.get('/banners', authMiddleware, adminOnly, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM banners ORDER BY created_at DESC');
    res.json({ banners: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/banners', authMiddleware, adminOnly, async (req, res) => {
  const { title, image_url, link_url, is_active, gender } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO banners (title, image_url, link_url, is_active) VALUES ($1, $2, $3, $4) RETURNING *',
      [title, image_url, link_url, is_active ?? true]
    );
    res.json({ banner: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/banners/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    await pool.query('DELETE FROM banners WHERE id=$1', [req.params.id]);
    res.json({ message: 'Banner deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Coupons ---
router.get('/coupons', authMiddleware, adminOnly, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM coupons ORDER BY created_at DESC');
    res.json({ coupons: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/coupons', authMiddleware, adminOnly, async (req, res) => {
  const { code, type, discount_type, value, discount_value, restriction_type, restriction_value, min_order_value, usage, usage_type, is_active, expires_at, gender } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO coupons (code, discount_type, discount_value, min_order_value, is_active, expires_at) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [
        code,
        discount_type || type || 'percentage',
        discount_value || value,
        min_order_value || restriction_value || 0,
        is_active ?? true,
        expires_at || null
      ]
    );
    res.json({ coupon: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/coupons/:id', authMiddleware, adminOnly, async (req, res) => {
  const { code, type, discount_type, value, discount_value, restriction_type, restriction_value, min_order_value, usage, is_active, expires_at, gender } = req.body;
  try {
    const result = await pool.query(
      'UPDATE coupons SET code=$1, discount_type=$2, discount_value=$3, min_order_value=$4, is_active=$5, expires_at=$6 WHERE id=$7 RETURNING *',
      [
        code,
        discount_type || type || 'percentage',
        discount_value || value,
        min_order_value || restriction_value || 0,
        is_active ?? true,
        expires_at || null,
        req.params.id
      ]
    );
    res.json({ coupon: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/coupons/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    await pool.query('DELETE FROM coupons WHERE id=$1', [req.params.id]);
    res.json({ message: 'Coupon deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- CATEGORIES ---

// GET /api/admin/categories
router.get('/categories', authMiddleware, adminOnly, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM categories ORDER BY id ASC');
    res.json({ categories: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/admin/categories
router.post('/categories', authMiddleware, adminOnly, async (req, res) => {
  const { name, models, image_url, banner_url, custom_fields, subcategories, gender } = req.body;
  try {
    const modelsJson = Array.isArray(models) ? JSON.stringify(models) : '[]';
    const fieldsJson = Array.isArray(custom_fields) ? JSON.stringify(custom_fields) : '[]';
    const subsJson = Array.isArray(subcategories) ? JSON.stringify(subcategories) : '[]';
    const result = await pool.query(
      'INSERT INTO categories (name, models, image_url, banner_url, custom_fields, subcategories) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [name, modelsJson, image_url, banner_url || null, fieldsJson, subsJson]
    );
    res.json({ category: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/admin/categories/:id
router.put('/categories/:id', authMiddleware, adminOnly, async (req, res) => {
  const { name, models, image_url, banner_url, custom_fields, subcategories, gender } = req.body;
  try {
    const modelsJson = Array.isArray(models) ? JSON.stringify(models) : '[]';
    const fieldsJson = Array.isArray(custom_fields) ? JSON.stringify(custom_fields) : '[]';
    const subsJson = Array.isArray(subcategories) ? JSON.stringify(subcategories) : '[]';
    const result = await pool.query(
      'UPDATE categories SET name=$1, models=$2, image_url=$3, banner_url=$4, custom_fields=$5, subcategories=$6 WHERE id=$7 RETURNING *',
      [name, modelsJson, image_url, banner_url || null, fieldsJson, subsJson, req.params.id]
    );
    res.json({ category: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/admin/categories/:id
router.delete('/categories/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    await pool.query('DELETE FROM categories WHERE id=$1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// --- VENDORS ---
router.get('/vendors', authMiddleware, adminOnly, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT v.id, v.name, v.store_name, v.email, v.phone, v.address, v.status, v.wallet_balance, v.created_at,
             COALESCE(v.outstanding_debt, 0) as outstanding_debt,
             COALESCE(stats.gross_sales, 0) as total_gross_sales,
             COALESCE(stats.commission_earned, 0) as total_commission_earned,
             COALESCE(stats.net_earnings, 0) as total_net_earnings,
             COALESCE(stats.legacy_sales, 0) as legacy_sales,
             COALESCE(stats.commission_tracked_sales, 0) as commission_tracked_sales,
             COALESCE(payouts.total_payouts, 0) as total_payouts_processed,
             sub.plan_name,
             sub.commission_percent,
             sub.subscription_expires_at,
             v.bank_account_holder_name,
             v.bank_account_number,
             v.bank_ifsc_code,
             v.bank_name,
             COALESCE(v.bank_verification_status, 'not_provided') as bank_verification_status,
             v.pickup_contact_name, v.pickup_phone, v.pickup_line1, v.pickup_line2,
             v.pickup_city, v.pickup_state, v.pickup_pincode, v.shiprocket_pickup_nickname,
             v.is_pickup_synced, v.shiprocket_pickup_id, v.pickup_synced_at, v.pickup_sync_error, v.pickup_version
      FROM vendors v
      LEFT JOIN LATERAL (
        SELECT 
          COALESCE(SUM(COALESCE(gross_amount, amount)), 0) as gross_sales,
          COALESCE(SUM(commission_amount), 0) as commission_earned,
          COALESCE(SUM(COALESCE(net_amount, amount)), 0) as net_earnings,
          COALESCE(SUM(CASE WHEN gross_amount IS NULL THEN amount ELSE 0 END), 0) as legacy_sales,
          COALESCE(SUM(CASE WHEN gross_amount IS NOT NULL THEN gross_amount ELSE 0 END), 0) as commission_tracked_sales
        FROM vendor_transactions
        WHERE vendor_id = v.id AND type = 'credit'
      ) stats ON true
      LEFT JOIN LATERAL (
        SELECT 
          COALESCE(SUM(amount), 0) as total_payouts
        FROM vendor_transactions
        WHERE vendor_id = v.id AND type = 'debit'
      ) payouts ON true
      LEFT JOIN LATERAL (
        SELECT 
          plan_name,
          (features->>'commission_percent')::numeric as commission_percent,
          expires_at as subscription_expires_at
        FROM vendor_subscriptions
        WHERE vendor_id = v.id 
          AND status = 'active'
          AND starts_at <= NOW() 
          AND expires_at >= NOW()
        ORDER BY expires_at DESC
        LIMIT 1
      ) sub ON true
      ORDER BY v.created_at DESC
    `);
    res.json({ vendors: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/vendors/:id/status', authMiddleware, adminOnly, async (req, res) => {
  const { status, gender } = req.body;
  try {
    const result = await pool.query(
      'UPDATE vendors SET status=$1 WHERE id=$2 RETURNING *',
      [status, req.params.id]
    );
    const updatedVendor = result.rows[0];

    // If status became 'approved', attempt to sync pickup location with Shiprocket if fields exist
    let syncResult = null;
    if (status === 'approved' && updatedVendor.pickup_line1 && updatedVendor.pickup_pincode) {
      try {
        syncResult = await syncVendorPickupWithShiprocket(req.params.id);
      } catch (syncErr) {
        console.warn(`Vendor ${req.params.id} approved, but automatic Shiprocket pickup sync failed:`, syncErr.message);
      }
    }

    res.json({ vendor: updatedVendor, syncResult });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/admin/vendors/:id/sync-pickup
router.post('/vendors/:id/sync-pickup', authMiddleware, adminOnly, async (req, res) => {
  try {
    const syncResult = await syncVendorPickupWithShiprocket(req.params.id);
    const vendorRes = await pool.query('SELECT * FROM vendors WHERE id = $1', [req.params.id]);
    res.json({
      message: syncResult.message || 'Pickup location synchronized with Shiprocket successfully.',
      vendor: vendorRes.rows[0],
      syncResult
    });
  } catch (err) {
    console.error(`Admin Shiprocket sync failed for vendor ${req.params.id}:`, err.message);
    res.status(400).json({ error: err.message });
  }
});

router.get('/vendor-products', authMiddleware, adminOnly, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT p.*, v.store_name, v.email as vendor_email 
      FROM products p 
      JOIN vendors v ON p.vendor_id = v.id 
      ORDER BY p.created_at DESC
    `);
    res.json({ products: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/vendor-orders', authMiddleware, adminOnly, async (req, res) => {
  try {
    // Fetch all orders and filter those that contain vendor products
    const result = await pool.query('SELECT * FROM orders ORDER BY created_at DESC');
    const vendorOrders = [];

    result.rows.forEach(order => {
      let items = [];
      try { items = typeof order.items === 'string' ? JSON.parse(order.items) : (order.items || []); } catch(e) {}
      
      const vendorItems = items.filter(item => item.product && item.product.vendor_id);
      if (vendorItems.length > 0) {
        order.vendor_items = vendorItems;
        order.vendors_involved = [...new Set(vendorItems.map(i => i.product.vendor_id))];
        vendorOrders.push(order);
      }
    });

    res.json({ orders: vendorOrders });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/vendors/:id/payout', authMiddleware, adminOnly, async (req, res) => {
  const { amount } = req.body;
  const reference = (
    req.body.reference ||
    req.body.utr ||
    req.body.bank_reference ||
    ''
  ).toString().trim();
  const idempotencyKey = (
    req.headers['idempotency-key'] ||
    req.body.idempotency_key ||
    req.body.requestId ||
    req.body.payout_id ||
    ''
  ).toString().trim();

  // 1. Validate positive monetary amount with at most 2 decimal places
  if (amount === undefined || amount === null || amount === '') {
    return res.status(400).json({ error: 'Payout amount is required' });
  }
  const amountStr = String(amount).trim();
  if (!/^\d+(\.\d{1,2})?$/.test(amountStr)) {
    return res.status(400).json({ error: 'Amount must be a positive number with at most 2 decimal places' });
  }
  const payoutAmount = Math.round(parseFloat(amountStr) * 100) / 100;
  if (isNaN(payoutAmount) || payoutAmount <= 0 || !isFinite(payoutAmount)) {
    return res.status(400).json({ error: 'Amount must be greater than zero' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 2. Lock vendor row for update to serialize concurrent payout requests
    const vendorRes = await client.query(
      'SELECT id, name, store_name, email, wallet_balance FROM vendors WHERE id=$1 FOR UPDATE',
      [req.params.id]
    );
    if (vendorRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Vendor not found' });
    }

    const vendor = vendorRes.rows[0];

    // 3. Idempotency check: if an idempotency key was supplied, check if already processed
    if (idempotencyKey) {
      const existingTx = await client.query(
        'SELECT * FROM vendor_transactions WHERE vendor_id = $1 AND order_number = $2 AND type = $3',
        [vendor.id, idempotencyKey, 'debit']
      );
      if (existingTx.rows.length > 0) {
        await client.query('ROLLBACK');
        return res.json({
          message: 'Payout already processed',
          vendor,
          alreadyProcessed: true,
          transaction: existingTx.rows[0]
        });
      }
    }

    // 4. Validate available balance
    const currentBalance = parseFloat(vendor.wallet_balance || 0);
    if (currentBalance < payoutAmount) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        error: `Insufficient wallet balance. Available: ₹${currentBalance.toLocaleString()}, Requested: ₹${payoutAmount.toLocaleString()}`
      });
    }

    // 5. Atomic deduction with safety guard
    const updateRes = await client.query(
      'UPDATE vendors SET wallet_balance = wallet_balance - $1 WHERE id = $2 AND wallet_balance >= $1 RETURNING id, name, store_name, wallet_balance',
      [payoutAmount, vendor.id]
    );

    if (updateRes.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Insufficient wallet balance or concurrent payout conflict' });
    }

    // 6. Record payout in vendor_transactions within the same transaction
    const desc = reference
      ? `Payout of ₹${payoutAmount.toLocaleString()} processed via bank transfer (Ref/UTR: ${reference})`
      : `Payout of ₹${payoutAmount.toLocaleString()} processed to bank account`;

    const txRes = await client.query(
      `INSERT INTO vendor_transactions 
         (vendor_id, type, amount, order_number, description, gross_amount, commission_percent, commission_amount, net_amount, debt_recovered, bank_reference) 
       VALUES ($1, 'debit', $2, $3, $4, NULL, NULL, NULL, $2, 0, $5)
       RETURNING *`,
      [vendor.id, payoutAmount, idempotencyKey || null, desc, reference || null]
    );

    await client.query('COMMIT');
    res.json({ message: 'Payout successful', vendor: updateRes.rows[0], transaction: txRes.rows[0] });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Payout processing error:', err);
    res.status(err.statusCode || 500).json({ error: err.message || 'Server error' });
  } finally {
    client.release();
  }
});

// GET /api/admin/vendor-payouts - All vendor transactions for admin
router.get('/vendor-payouts', authMiddleware, adminOnly, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT vt.*, v.name as vendor_name, v.store_name 
      FROM vendor_transactions vt 
      LEFT JOIN vendors v ON vt.vendor_id = v.id 
      ORDER BY vt.created_at DESC
    `);
    res.json({ payouts: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- SUPPORT AGENTS ---
const bcrypt = require('bcryptjs');

// GET /api/admin/support-agents  (scope=admin only)
router.get('/support-agents', authMiddleware, adminOnly, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, name, email, is_active, created_at, access_pages FROM support_agents WHERE scope='admin' ORDER BY created_at DESC"
    );
    res.json({ agents: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/admin/support-agents
router.post('/support-agents', authMiddleware, adminOnly, async (req, res) => {
  const { name, email, password, access_pages, gender } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: 'name, email and password required' });
  try {
    const existing = await pool.query('SELECT id FROM support_agents WHERE email = $1', [email]);
    if (existing.rows.length > 0) return res.status(400).json({ error: 'Email already exists' });
    const password_hash = await bcrypt.hash(password, 10);
    const pages = Array.isArray(access_pages) ? JSON.stringify(access_pages) : '[]';
    const result = await pool.query(
      "INSERT INTO support_agents (name, email, password_hash, scope, access_pages) VALUES ($1, $2, $3, 'admin', $4) RETURNING id, name, email, is_active, created_at, access_pages",
      [name, email, password_hash, pages]
    );
    res.json({ agent: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/admin/support-agents/:id/toggle
router.put('/support-agents/:id/toggle', authMiddleware, adminOnly, async (req, res) => {
  try {
    const result = await pool.query(
      "UPDATE support_agents SET is_active = NOT is_active WHERE id = $1 AND scope='admin' RETURNING id, name, email, is_active, access_pages",
      [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Agent not found' });
    res.json({ agent: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/admin/support-agents/:id
router.delete('/support-agents/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    await pool.query("DELETE FROM support_agents WHERE id = $1 AND scope='admin'", [req.params.id]);
    res.json({ message: 'Agent deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- PRODUCT REQUESTS (Vendor product approvals) ---

// GET /api/admin/product-requests
router.get('/product-requests', authMiddleware, adminOnly, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT p.*, v.name as vendor_name, v.store_name
       FROM products p
       LEFT JOIN vendors v ON p.vendor_id = v.id
       WHERE p.status = 'pending'
       ORDER BY p.created_at DESC`
    );
    res.json({ products: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/admin/product-requests/:id/approve
router.put('/product-requests/:id/approve', authMiddleware, adminOnly, async (req, res) => {
  try {
    const result = await pool.query(
      `UPDATE products SET status = 'approved', is_active = true WHERE id = $1 RETURNING *`,
      [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Product not found' });
    res.json({ product: result.rows[0], message: 'Product approved and is now live.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/admin/product-requests/:id/reject
router.put('/product-requests/:id/reject', authMiddleware, adminOnly, async (req, res) => {
  const { reason, gender } = req.body;
  try {
    const result = await pool.query(
      `UPDATE products SET status = 'rejected', is_active = false WHERE id = $1 RETURNING *`,
      [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Product not found' });
    res.json({ product: result.rows[0], message: 'Product rejected.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
