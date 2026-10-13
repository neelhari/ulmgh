const router = require('express').Router();
const pool = require('../db');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const { calculateOrder, DELIVERY_CHARGE } = require('../utils/pricing');
const { verifyRazorpayPayment } = require('../utils/razorpay');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
});

async function sendOrderEmailToAdmin(orderNumber, total, address, items, paymentMethod) {
  try {
    const addr = typeof address === 'string' ? JSON.parse(address) : address;
    const itemsList = (typeof items === 'string' ? JSON.parse(items) : items) || [];
    const itemsHtml = itemsList.map(item => `
      <tr>
        <td style="padding:8px 12px;border-bottom:1px solid #eee;">${item.product?.name || 'Product'}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #eee;">${item.variant?.color ? item.variant.color + ' / ' : ''}${item.variant?.size || '-'}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:center;">${item.qty}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:right;">₹${(item.qty * (item.variant?.price || item.product?.price || 0)).toLocaleString()}</td>
      </tr>
    `).join('');

    await transporter.sendMail({
      from: `"ULMGH369" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER,
      subject: `🛒 New Order Received - ${orderNumber}`,
      html: `
        <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;">
          <div style="background:linear-gradient(135deg,#fe6603,#ff8534);padding:24px;text-align:center;">
            <h1 style="color:#fff;margin:0;font-size:22px;">New Order Received!</h1>
            <p style="color:rgba(255,255,255,0.9);margin:8px 0 0;font-size:14px;">${orderNumber}</p>
          </div>
          <div style="padding:24px;">
            <h3 style="margin:0 0 12px;color:#111;">Customer Details</h3>
            <p style="margin:4px 0;color:#555;"><strong>${addr?.name || 'Guest'}</strong> &middot; ${addr?.mobile || ''}</p>
            <p style="margin:4px 0;color:#555;">${addr?.addressLine1 || ''} ${addr?.addressLine2 || ''}, ${addr?.city || ''}, ${addr?.state || ''} - ${addr?.pincode || ''}</p>
            <hr style="border:none;border-top:1px solid #eee;margin:16px 0;">
            <h3 style="margin:0 0 12px;color:#111;">Order Items</h3>
            <table style="width:100%;border-collapse:collapse;font-size:13px;">
              <tr style="background:#f9fafb;"><th style="padding:8px 12px;text-align:left;">Product</th><th style="padding:8px 12px;text-align:left;">Variant</th><th style="padding:8px 12px;text-align:center;">Qty</th><th style="padding:8px 12px;text-align:right;">Amount</th></tr>
              ${itemsHtml}
            </table>
            <div style="text-align:right;margin-top:12px;font-size:18px;font-weight:bold;color:#111;">Total: ₹${parseFloat(total).toLocaleString()}</div>
            <p style="margin-top:8px;text-align:right;font-size:12px;color:#888;">Payment: ${paymentMethod === 'cod' ? 'Cash on Delivery' : 'Prepaid (Online)'}</p>
          </div>
        </div>
      `
    });
  } catch (err) {
    console.error('Admin email send failed:', err);
  }
}

async function sendOrderEmailToCustomer(email, orderNumber, total, address, items, paymentMethod) {
  if (!email) return;
  try {
    const addr = typeof address === 'string' ? JSON.parse(address) : address;
    const itemsList = (typeof items === 'string' ? JSON.parse(items) : items) || [];
    const itemsHtml = itemsList.map(item => `
      <tr>
        <td style="padding:10px 12px;border-bottom:1px solid #f3f4f6;">
          <div style="display:flex;align-items:center;gap:10px;">
            <img src="${item.product?.image_url || item.product?.images?.[0] || ''}" alt="" style="width:48px;height:48px;border-radius:8px;object-fit:cover;" />
            <div>
              <p style="margin:0;font-weight:600;color:#111;">${item.product?.name || 'Product'}</p>
              <p style="margin:2px 0 0;font-size:12px;color:#888;">${item.variant?.color ? item.variant.color + ' / ' : ''}${item.variant?.size || ''}</p>
            </div>
          </div>
        </td>
        <td style="padding:10px 12px;border-bottom:1px solid #f3f4f6;text-align:center;">${item.qty}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #f3f4f6;text-align:right;font-weight:600;">₹${(item.qty * (item.variant?.price || item.product?.price || 0)).toLocaleString()}</td>
      </tr>
    `).join('');

    await transporter.sendMail({
      from: `"ULMGH369" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `✅ Order Confirmed - ${orderNumber}`,
      html: `
        <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;">
          <div style="background:linear-gradient(135deg,#10b981,#059669);padding:28px;text-align:center;">
            <div style="font-size:40px;margin-bottom:8px;">✅</div>
            <h1 style="color:#fff;margin:0;font-size:22px;">Order Confirmed!</h1>
            <p style="color:rgba(255,255,255,0.9);margin:8px 0 0;font-size:14px;">Thank you for your order, ${addr?.name || 'Customer'}!</p>
          </div>
          <div style="padding:24px;">
            <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:14px;margin-bottom:20px;text-align:center;">
              <p style="margin:0;font-size:13px;color:#166534;">Order Number</p>
              <p style="margin:4px 0 0;font-size:18px;font-weight:bold;color:#111;letter-spacing:1px;">${orderNumber}</p>
            </div>
            <h3 style="margin:0 0 12px;color:#111;font-size:15px;">Items Ordered</h3>
            <table style="width:100%;border-collapse:collapse;font-size:13px;">
              <tr style="background:#f9fafb;"><th style="padding:8px 12px;text-align:left;">Product</th><th style="padding:8px 12px;text-align:center;">Qty</th><th style="padding:8px 12px;text-align:right;">Amount</th></tr>
              ${itemsHtml}
            </table>
            <div style="background:#f9fafb;border-radius:8px;padding:14px;margin-top:16px;">
              <div style="display:flex;justify-content:space-between;margin-bottom:6px;"><span style="color:#666;">Payment</span><span style="font-weight:600;">${paymentMethod === 'cod' ? 'Cash on Delivery' : 'Paid Online'}</span></div>
              <div style="display:flex;justify-content:space-between;font-size:18px;"><span style="font-weight:bold;color:#111;">Total</span><span style="font-weight:bold;color:#059669;">₹${parseFloat(total).toLocaleString()}</span></div>
            </div>
            <hr style="border:none;border-top:1px solid #eee;margin:20px 0;">
            <h3 style="margin:0 0 8px;color:#111;font-size:15px;">Delivering To</h3>
            <p style="margin:4px 0;color:#555;line-height:1.6;">${addr?.name || ''}<br>${addr?.addressLine1 || ''} ${addr?.addressLine2 || ''}<br>${addr?.city || ''}, ${addr?.state || ''} - ${addr?.pincode || ''}<br>📞 ${addr?.mobile || ''}</p>
            <div style="text-align:center;margin-top:24px;">
              <p style="color:#888;font-size:12px;margin:0;">Need help? Reply to this email or contact us.</p>
            </div>
          </div>
        </div>
      `
    });
  } catch (err) {
    console.error('Customer email send failed:', err);
  }
}

async function sendOrderEmailToVendor(vendorEmail, vendorName, orderNumber, vendorItems, vendorTotal, address, paymentMethod) {
  if (!vendorEmail) return;
  try {
    const addr = typeof address === 'string' ? JSON.parse(address) : address;
    const itemsHtml = vendorItems.map(item => `
      <tr>
        <td style="padding:8px 12px;border-bottom:1px solid #eee;">${item.product?.name || 'Product'}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #eee;">${item.variant?.color ? item.variant.color + ' / ' : ''}${item.variant?.size || '-'}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:center;">${item.qty}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:right;">₹${(item.qty * (item.variant?.price || item.product?.price || 0)).toLocaleString()}</td>
      </tr>
    `).join('');

    await transporter.sendMail({
      from: `"ULMGH369" <${process.env.EMAIL_USER}>`,
      to: vendorEmail,
      subject: `🎉 New Order for Your Products - ${orderNumber}`,
      html: `
        <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;">
          <div style="background:linear-gradient(135deg,#7c3aed,#6d28d9);padding:28px;text-align:center;">
            <div style="font-size:40px;margin-bottom:8px;">🎉</div>
            <h1 style="color:#fff;margin:0;font-size:22px;">New Order for Your Products!</h1>
            <p style="color:rgba(255,255,255,0.9);margin:8px 0 0;font-size:14px;">Hi ${vendorName}, you have a new sale!</p>
          </div>
          <div style="padding:24px;">
            <div style="background:#f5f3ff;border:1px solid #ddd6fe;border-radius:8px;padding:14px;margin-bottom:20px;text-align:center;">
              <p style="margin:0;font-size:13px;color:#5b21b6;">Order Number</p>
              <p style="margin:4px 0 0;font-size:18px;font-weight:bold;color:#111;letter-spacing:1px;">${orderNumber}</p>
            </div>
            <h3 style="margin:0 0 12px;color:#111;font-size:15px;">Your Products in This Order</h3>
            <table style="width:100%;border-collapse:collapse;font-size:13px;">
              <tr style="background:#f9fafb;"><th style="padding:8px 12px;text-align:left;">Product</th><th style="padding:8px 12px;text-align:left;">Variant</th><th style="padding:8px 12px;text-align:center;">Qty</th><th style="padding:8px 12px;text-align:right;">Amount</th></tr>
              ${itemsHtml}
            </table>
            <div style="background:#f5f3ff;border-radius:8px;padding:14px;margin-top:16px;">
              <div style="display:flex;justify-content:space-between;font-size:18px;"><span style="font-weight:bold;color:#111;">Your Earnings</span><span style="font-weight:bold;color:#7c3aed;">₹${vendorTotal.toLocaleString()}</span></div>
              <p style="margin:8px 0 0;font-size:12px;color:#888;">This amount has been credited to your virtual wallet.</p>
            </div>
            <hr style="border:none;border-top:1px solid #eee;margin:20px 0;">
            <h3 style="margin:0 0 8px;color:#111;font-size:15px;">Ship To</h3>
            <p style="margin:4px 0;color:#555;line-height:1.6;">${addr?.name || ''}<br>${addr?.addressLine1 || ''} ${addr?.addressLine2 || ''}<br>${addr?.city || ''}, ${addr?.state || ''} - ${addr?.pincode || ''}<br>📞 ${addr?.mobile || ''}</p>
            <div style="text-align:center;margin-top:24px;">
              <p style="color:#888;font-size:12px;margin:0;">Please prepare and ship the order promptly. Check your vendor dashboard for details.</p>
            </div>
          </div>
        </div>
      `
    });
  } catch (err) {
    console.error('Vendor email send failed:', err);
  }
}

// GET /api/general/db-test
router.get('/db-test', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ time: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/general/categories
router.get('/categories', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM categories ORDER BY id ASC');
    res.json({ categories: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/general/products
router.get('/products', async (req, res) => {
  try {
    // Exclude products from vendors whose subscription has expired
    const result = await pool.query(`
      SELECT p.* FROM products p
      WHERE p.is_active = true
      AND (
        p.vendor_id IS NULL
        OR EXISTS (
          SELECT 1 FROM vendors v
          WHERE v.id = p.vendor_id
          AND v.subscription_expires_at IS NOT NULL
          AND v.subscription_expires_at > NOW()
        )
      )
      ORDER BY p.id DESC
    `);
    res.json({ products: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/general/orders (Checkout)
router.post('/orders', async (req, res) => {
  const {
    items,
    address,
    coupon_code,
    payment_method,
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature
  } = req.body;
  
  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Cart is empty' });
  }

  try {
    // Recalculate prices from database, check stock, and apply coupons via shared pricing utility
    const { verifiedItems, subtotal, discount, deliveryCharge, total: calculatedTotal } = await calculateOrder(items, coupon_code || req.body.couponCode);

    const pMethod = payment_method || 'prepaid';
    const advancePaid = pMethod === 'cod' ? 1 : calculatedTotal;

    // Check payment reuse via razorpay_payment_id
    if (razorpay_payment_id) {
      try {
        const dupCheck = await pool.query('SELECT id FROM orders WHERE razorpay_payment_id = $1', [razorpay_payment_id]);
        if (dupCheck.rows.length > 0) {
          return res.status(400).json({ error: 'This payment has already been used for another order' });
        }
      } catch (colErr) {
        // Continue if column not created yet prior to running MIGRATION.sql
      }
    }

    // Payment verification: mandatory for prepaid
    if (pMethod !== 'cod') {
      if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        return res.status(400).json({ error: 'Missing Razorpay payment details for prepaid order' });
      }
      await verifyRazorpayPayment(razorpay_order_id, razorpay_payment_id, razorpay_signature, Math.round(calculatedTotal * 100));
    } else if (razorpay_payment_id && razorpay_order_id && razorpay_signature) {
      // Verify COD advance payment (₹1 = 100 paise)
      await verifyRazorpayPayment(razorpay_order_id, razorpay_payment_id, razorpay_signature, 100);
    }

    const orderNumber = `ORD-${Date.now()}`;
    const itemsJson = JSON.stringify(verifiedItems);
    const addressJson = JSON.stringify(address);
    const orderStatus = pMethod === 'cod' ? 'pending' : 'paid';

    let result;
    try {
      result = await pool.query(
        `INSERT INTO orders (order_number, total, items, address, status, payment_method, advance_paid, razorpay_payment_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
        [orderNumber, calculatedTotal, itemsJson, addressJson, orderStatus, pMethod, advancePaid, razorpay_payment_id || null]
      );
    } catch (dbErr) {
      if (dbErr.code === '42703') { // undefined_column before migration
        result = await pool.query(
          `INSERT INTO orders (order_number, total, items, address, status, payment_method, advance_paid)
           VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
          [orderNumber, calculatedTotal, itemsJson, addressJson, orderStatus, pMethod, advancePaid]
        );
      } else {
        throw dbErr;
      }
    }

    // Credit vendors, record transactions, send vendor emails
    const vendorData = {}; // { vendor_id: { total, items: [] } }
    for (const item of verifiedItems) {
      if (item.product && item.product.vendor_id) {
        const vid = item.product.vendor_id;
        // Skip crediting if vendor subscription has expired
        const subCheck = await pool.query(
          'SELECT subscription_expires_at FROM vendors WHERE id=$1',
          [vid]
        );
        const expiry = subCheck.rows[0]?.subscription_expires_at;
        if (expiry && new Date(expiry) < new Date()) continue;
        const amt = item.qty * item.price;
        if (!vendorData[vid]) vendorData[vid] = { total: 0, items: [] };
        vendorData[vid].total += amt;
        vendorData[vid].items.push(item);
      }
    }
    for (const [vid, data] of Object.entries(vendorData)) {
      await pool.query('UPDATE vendors SET wallet_balance = COALESCE(wallet_balance, 0) + $1 WHERE id = $2', [data.total, vid]);
      await pool.query(
        'INSERT INTO vendor_transactions (vendor_id, type, amount, order_number, description) VALUES ($1, $2, $3, $4, $5)',
        [vid, 'credit', data.total, orderNumber, `Order ${orderNumber} - ${data.items.length} item(s)`]
      );
      // Send vendor email
      const vendorRes = await pool.query('SELECT name, email FROM vendors WHERE id = $1', [vid]);
      if (vendorRes.rows[0]) {
        sendOrderEmailToVendor(vendorRes.rows[0].email, vendorRes.rows[0].name, orderNumber, data.items, data.total, address, pMethod);
      }
    }
    
    // Send emails
    sendOrderEmailToAdmin(orderNumber, calculatedTotal, address, verifiedItems, pMethod);
    sendOrderEmailToCustomer(address?.email, orderNumber, calculatedTotal, address, verifiedItems, pMethod);
    
    res.json({ success: true, order: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to place order' });
  }
});

// POST /api/general/razorpay/order
router.post('/razorpay/order', async (req, res) => {
  const { items, coupon_code, couponCode, payment_method, paymentMethod, amount } = req.body;

  try {
    let chargeAmount = 0;
    if (items && Array.isArray(items) && items.length > 0) {
      const pMethod = payment_method || paymentMethod || 'prepaid';
      if (pMethod === 'cod') {
        chargeAmount = 1; // COD advance charge
      } else {
        const pricing = await calculateOrder(items, coupon_code || couponCode);
        chargeAmount = pricing.total;
      }
    } else if (amount) {
      // Fallback if client called without items
      chargeAmount = parseFloat(amount) || 0;
    } else {
      return res.status(400).json({ error: 'Cart items or amount required' });
    }

    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const options = {
      amount: Math.round(chargeAmount * 100), // amount in paise
      currency: 'INR',
      receipt: `receipt_${Date.now()}`
    };

    const order = await razorpay.orders.create(options);
    res.json({ success: true, order, calculated_amount: chargeAmount });
  } catch (err) {
    console.error('Razorpay order creation error:', err);
    res.status(err.statusCode || 500).json({ error: err.message || 'Failed to create Razorpay order' });
  }
});

// POST /api/general/razorpay/verify
router.post('/razorpay/verify', async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return res.status(400).json({ error: 'Missing payment details' });
  }

  try {
    const generated_signature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(razorpay_order_id + '|' + razorpay_payment_id)
      .digest('hex');

    if (generated_signature === razorpay_signature) {
      res.json({ success: true, message: 'Payment verified successfully' });
    } else {
      res.status(400).json({ error: 'Invalid signature' });
    }
  } catch (err) {
    console.error('Razorpay verification error:', err);
    res.status(500).json({ error: 'Verification failed' });
  }
});

// POST /api/general/razorpay/webhook
router.post('/razorpay/webhook', async (req, res) => {
  const signature = req.headers['x-razorpay-signature'];
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error('RAZORPAY_WEBHOOK_SECRET is not configured');
    return res.status(500).json({ error: 'Webhook secret not configured' });
  }

  if (!signature) {
    return res.status(400).json({ error: 'Missing webhook signature' });
  }

  try {
    // Verify HMAC signature using raw request body
    const rawBodyBuffer = req.rawBody || Buffer.from(JSON.stringify(req.body));
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(rawBodyBuffer)
      .digest('hex');

    if (expectedSignature !== signature) {
      console.warn('Invalid Razorpay webhook signature');
      return res.status(400).json({ error: 'Invalid webhook signature' });
    }

    const event = req.body.event;
    const payload = req.body.payload;

    // Handle payment.captured event
    if (event === 'payment.captured' && payload?.payment?.entity) {
      const payment = payload.payment.entity;
      const paymentId = payment.id;
      const orderId = payment.order_id;

      let orderQuery;
      try {
        orderQuery = await pool.query(
          `SELECT id, status, razorpay_payment_id FROM orders 
           WHERE razorpay_payment_id = $1 
              OR (razorpay_order_id = $2 AND razorpay_order_id IS NOT NULL)
           LIMIT 1`,
          [paymentId, orderId]
        );
      } catch (colErr) {
        orderQuery = { rows: [] };
      }

      if (orderQuery.rows.length > 0) {
        const order = orderQuery.rows[0];
        // Idempotency: only update if not already marked paid
        if (order.status !== 'paid') {
          try {
            await pool.query(
              `UPDATE orders 
               SET status = 'paid', razorpay_payment_id = COALESCE(razorpay_payment_id, $1) 
               WHERE id = $2`,
              [paymentId, order.id]
            );
          } catch (updateErr) {
            await pool.query(`UPDATE orders SET status = 'paid' WHERE id = $1`, [order.id]);
          }
        }
      }
    }

    res.status(200).json({ status: 'ok' });
  } catch (err) {
    console.error('Razorpay webhook processing error:', err);
    res.status(500).json({ error: 'Webhook processing error' });
  }
});

// POST /api/general/coupon/verify
router.post('/coupon/verify', async (req, res) => {
  const { code, items, subtotal, qty } = req.body;
  if (!code) return res.status(400).json({ error: 'Coupon code is required' });

  try {
    // Check admin coupons table first
    const adminResult = await pool.query(
      'SELECT *, \'admin\' as source FROM coupons WHERE UPPER(code) = UPPER($1) AND is_active = true',
      [code]
    );

    // Check vendor offers table (offer_type = coupon)
    const vendorResult = await pool.query(
      "SELECT *, 'vendor' as source FROM offers WHERE UPPER(code) = UPPER($1) AND is_active = true AND offer_type = 'coupon'",
      [code]
    );

    const row = adminResult.rows[0] || vendorResult.rows[0];
    if (!row) return res.status(400).json({ error: 'Invalid or expired coupon' });

    // Check expiry
    if (row.expires_at && new Date(row.expires_at) < new Date()) {
      return res.status(400).json({ error: 'This coupon has expired' });
    }

    let applicableSubtotal = 0;
    let applicableQty = 0;

    if (row.source === 'vendor' && row.vendor_id) {
       (items || []).forEach(item => {
          if (item.vendor_id === row.vendor_id) {
             applicableSubtotal += (item.price || 0) * (item.quantity || 1);
             applicableQty += (item.quantity || 1);
          }
       });
       if (applicableQty === 0) {
          return res.status(400).json({ error: 'This coupon is not applicable to any items in your cart.' });
       }
    } else {
       (items || []).forEach(item => {
          applicableSubtotal += (item.price || 0) * (item.quantity || 1);
          applicableQty += (item.quantity || 1);
       });
    }

    // Restriction check
    const restrictionType = row.restriction_type || row.min_type || 'min_amount';
    const restrictionValue = parseFloat(row.restriction_value || row.min_value || row.min_order_value || 0);

    if ((restrictionType === 'min_qty' || restrictionType === 'qty') && applicableQty < restrictionValue) {
      return res.status(400).json({ error: `Minimum ${restrictionValue} applicable items required` });
    }
    if (restrictionType !== 'min_qty' && restrictionType !== 'qty' && applicableSubtotal < restrictionValue) {
      return res.status(400).json({ error: `Minimum applicable order amount ₹${restrictionValue} required` });
    }

    // Normalise coupon fields for frontend
    const discountType = row.discount_type || 'percent';
    const coupon = {
      ...row,
      code: row.code,
      discount_type: discountType,
      type: discountType,
      value: parseFloat(row.discount_value || row.discount_percent || 0),
      discount_value: parseFloat(row.discount_value || row.discount_percent || 0),
    };

    res.json({ coupon });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/general/banners
router.get('/banners', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM banners WHERE is_active = true ORDER BY created_at DESC');
    res.json({ banners: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});


// GET /api/general/vendors
router.get('/vendors', async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, store_name as business_name, 'https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?w=500&q=80' as store_image FROM vendors WHERE status = 'approved' ORDER BY created_at DESC"
    );
    res.json({ vendors: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
