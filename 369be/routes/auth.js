const router = require('express').Router();
const pool = require('../db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const { calculateOrder, DELIVERY_CHARGE } = require('../utils/pricing');
const { verifyRazorpayPayment } = require('../utils/razorpay');
const { generateOTP, createOTP, verifyOTP } = require('../utils/otp');
const { authLimiter, loginLimiter } = require('../utils/rateLimiter');
const { validate, signupSchema, loginSchema, addressSchema, orderSchema } = require('../utils/validation');
const { OAuth2Client } = require('google-auth-library');
const fulfillmentService = require('../services/fulfillmentService');

const googleClient = new OAuth2Client();

const JWT_SECRET = process.env.JWT_SECRET;

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
            <p style="margin:4px 0;color:#555;"><strong>${addr?.name || 'Customer'}</strong> &middot; ${addr?.mobile || ''}</p>
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

async function sendOTPEmail(email, otp, name) {
  await transporter.sendMail({
    from: `"ULMGH 369" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Your OTP for ULMGH 369 Signup',
    html: `
      <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 30px; border: 1px solid #eaeaea; border-radius: 16px; background-color: #ffffff; box-shadow: 0 4px 20px rgba(0,0,0,0.05);">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="color: #022A21; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: 2px;">ULMGH369</h1>
          <p style="color: #fe6603; margin: 4px 0 0; font-size: 11px; font-weight: bold; letter-spacing: 3px; text-transform: uppercase;">Your Choice, From Anywhere.</p>
        </div>
        <div style="border-top: 2px solid #f3f4f6; margin-bottom: 24px;"></div>
        <h2 style="color: #111827; font-size: 20px; font-weight: 700; margin-bottom: 16px;">Welcome to ULMGH369! 🚀</h2>
        <p style="color: #4b5563; font-size: 15px; line-height: 1.5; margin-bottom: 24px;">Hi <strong style="color: #111827;">${name}</strong>,</p>
        <p style="color: #4b5563; font-size: 15px; line-height: 1.5; margin-bottom: 20px;">Use the following OTP to verify your account and complete your registration:</p>
        <div style="font-size: 42px; font-weight: 900; color: #fe6603; letter-spacing: 12px; text-align: center; padding: 24px; background: linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%); border-radius: 12px; margin: 24px 0; border: 1px solid #fed7aa; box-shadow: inset 0 2px 4px rgba(254,102,3,0.05);">
          ${otp}
        </div>
        <p style="color: #6b7280; font-size: 13px; text-align: center; margin-bottom: 30px; background-color: #f9fafb; padding: 12px; border-radius: 8px;">
          ⏱️ This OTP is valid for <strong>10 minutes</strong>. Please do not share this code with anyone.
        </p>
        <div style="border-top: 1px solid #f3f4f6; margin-top: 30px; padding-top: 20px; text-align: center;">
          <p style="color: #9ca3af; font-size: 12px; margin: 0;">If you didn't request this email, you can safely ignore it.</p>
        </div>
      </div>
    `,
  });
}

async function sendPasswordResetOTPEmail(email, otp, name) {
  await transporter.sendMail({
    from: `"ULMGH369" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Password Reset OTP for ULMGH369',
    html: `
      <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 30px; border: 1px solid #eaeaea; border-radius: 16px; background-color: #ffffff; box-shadow: 0 4px 20px rgba(0,0,0,0.05);">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="color: #022A21; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: 2px;">ULMGH369</h1>
          <p style="color: #fe6603; margin: 4px 0 0; font-size: 11px; font-weight: bold; letter-spacing: 3px; text-transform: uppercase;">Your Choice, From Anywhere.</p>
        </div>
        <div style="border-top: 2px solid #f3f4f6; margin-bottom: 24px;"></div>
        <h2 style="color: #111827; font-size: 20px; font-weight: 700; margin-bottom: 16px;">Password Reset Request 🔐</h2>
        <p style="color: #4b5563; font-size: 15px; line-height: 1.5; margin-bottom: 24px;">Hi <strong style="color: #111827;">${name}</strong>,</p>
        <p style="color: #4b5563; font-size: 15px; line-height: 1.5; margin-bottom: 20px;">Use the following OTP to reset your password:</p>
        <div style="font-size: 42px; font-weight: 900; color: #fe6603; letter-spacing: 12px; text-align: center; padding: 24px; background: linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%); border-radius: 12px; margin: 24px 0; border: 1px solid #fed7aa; box-shadow: inset 0 2px 4px rgba(254,102,3,0.05);">
          ${otp}
        </div>
        <p style="color: #6b7280; font-size: 13px; text-align: center; margin-bottom: 30px; background-color: #f9fafb; padding: 12px; border-radius: 8px;">
          ⏱️ This OTP is valid for <strong>10 minutes</strong>. Please do not share this code with anyone.
        </p>
        <div style="border-top: 1px solid #f3f4f6; margin-top: 30px; padding-top: 20px; text-align: center;">
          <p style="color: #9ca3af; font-size: 12px; margin: 0;">If you didn't request a password reset, you can safely ignore this email.</p>
        </div>
      </div>
    `,
  });
}

// Middleware to verify JWT
function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}

// POST /api/auth/signup - send OTP
router.post('/signup', authLimiter, validate(signupSchema), async (req, res) => {
  const { name, email, phone, password } = req.body;
  if (!name || !email || !phone || !password)
    return res.status(400).json({ error: 'All fields are required' });

  try {
    const existing = await pool.query('SELECT id, is_verified FROM users WHERE email=$1', [email]);
    if (existing.rows.length && existing.rows[0].is_verified)
      return res.status(409).json({ error: 'Email already registered' });

    const hash = await bcrypt.hash(password, 10);
    const otp = generateOTP();

    if (existing.rows.length) {
      await pool.query(
        'UPDATE users SET name=$1, phone=$2, password_hash=$3 WHERE email=$4',
        [name, phone, hash, email]
      );
    } else {
      await pool.query(
        'INSERT INTO users (name, email, phone, password_hash) VALUES ($1,$2,$3,$4)',
        [name, email, phone, hash]
      );
    }

    await createOTP(email, otp);
    await sendOTPEmail(email, otp, name);
    res.json({ message: 'OTP sent to your email' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/auth/verify-otp
router.post('/verify-otp', authLimiter, async (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) return res.status(400).json({ error: 'Email and OTP required' });

  try {
    const check = await verifyOTP(email, otp, true);
    if (!check.valid) return res.status(400).json({ error: check.error });

    await pool.query('UPDATE users SET is_verified=TRUE WHERE email=$1', [email]);

    const user = await pool.query('SELECT id, name, email, phone, role FROM users WHERE email=$1', [email]);
    const u = user.rows[0];
    const token = jwt.sign({ id: u.id, email, role: u.role }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: u });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/auth/forgot-password
router.post('/forgot-password', authLimiter, async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email required' });

  try {
    const user = await pool.query('SELECT name FROM users WHERE email=$1', [email]);
    if (!user.rows.length) return res.status(404).json({ error: 'User not found' });

    const otp = generateOTP();
    await createOTP(email, otp);

    await sendPasswordResetOTPEmail(email, otp, user.rows[0].name);
    res.json({ message: 'OTP sent to your email' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/auth/verify-reset-otp
router.post('/verify-reset-otp', authLimiter, async (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) return res.status(400).json({ error: 'Email and OTP required' });

  try {
    const check = await verifyOTP(email, otp, false);
    if (!check.valid) return res.status(400).json({ error: check.error });

    res.json({ success: true, message: 'OTP verified' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/auth/reset-password
router.post('/reset-password', async (req, res) => {
  const { email, otp, newPassword } = req.body;
  if (!email || !otp || !newPassword) return res.status(400).json({ error: 'Missing required fields' });

  try {
    const check = await verifyOTP(email, otp, true);
    if (!check.valid) return res.status(400).json({ error: check.error });

    const hash = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE users SET password_hash=$1 WHERE email=$2', [hash, email]);

    res.json({ success: true, message: 'Password reset successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/auth/login
router.post('/login', loginLimiter, validate(loginSchema), async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

  try {
    const result = await pool.query('SELECT * FROM users WHERE email=$1', [email]);
    if (!result.rows.length) return res.status(401).json({ error: 'Invalid credentials' });

    const user = result.rows[0];
    if (user.is_deleted) return res.status(403).json({ error: 'This account has been deleted' });
    if (!user.is_verified) return res.status(403).json({ error: 'Please verify your email first' });

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, phone: user.phone, role: user.role } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/auth/google
router.post('/google', loginLimiter, async (req, res) => {
  const { idToken } = req.body;
  if (!idToken || typeof idToken !== 'string') {
    return res.status(400).json({ error: 'idToken is required' });
  }

  const clientId = process.env.GOOGLE_WEB_CLIENT_ID;
  if (!clientId) {
    console.error('GOOGLE_WEB_CLIENT_ID is not configured');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  let payload;
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: clientId,
    });
    payload = ticket.getPayload();
  } catch (err) {
    console.error('Google token verification failed:', err.message || err);
    return res.status(401).json({ error: 'Invalid Google token' });
  }

  if (!payload || !payload.email_verified) {
    return res.status(400).json({ error: 'Google email is not verified' });
  }

  const googleId = payload.sub;
  const email = payload.email?.toLowerCase()?.trim();
  if (!googleId || !email) {
    return res.status(400).json({ error: 'Invalid Google profile payload' });
  }
  const name = payload.name || email.split('@')[0] || 'User';
  const avatarUrl = payload.picture || null;

  try {
    let user = null;

    // 1. Find by google_id
    const byGoogle = await pool.query('SELECT * FROM users WHERE google_id = $1', [googleId]);
    if (byGoogle.rows.length) {
      user = byGoogle.rows[0];
    } else {
      // 2. Find by email (link the account)
      const byEmail = await pool.query('SELECT * FROM users WHERE LOWER(email) = $1', [email]);
      if (byEmail.rows.length) {
        user = byEmail.rows[0];
        const updateRes = await pool.query(
          'UPDATE users SET google_id = $1, is_verified = TRUE WHERE id = $2 RETURNING *',
          [googleId, user.id]
        );
        user = updateRes.rows[0];
      } else {
        // 3. Create a verified customer
        const insertRes = await pool.query(
          `INSERT INTO users (name, email, google_id, is_verified, role, avatar_url)
           VALUES ($1, $2, $3, TRUE, 'user', $4)
           RETURNING *`,
          [name, email, googleId, avatarUrl]
        );
        user = insertRes.rows[0];
      }
    }

    if (user.is_deleted) {
      return res.status(403).json({ error: 'This account has been deleted' });
    }

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    return res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone || null,
        role: user.role,
      },
    });
  } catch (err) {
    console.error('Google auth database error:', err);
    return res.status(500).json({ error: 'Server error during Google authentication' });
  }
});

// GET /api/auth/profile
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const user = await pool.query(
      'SELECT id, name, email, phone, avatar_url, created_at FROM users WHERE id=$1',
      [req.user.id]
    );
    const addresses = await pool.query('SELECT * FROM addresses WHERE user_id=$1 ORDER BY is_default DESC', [req.user.id]);
    const orders = await pool.query('SELECT * FROM orders WHERE user_id=$1 ORDER BY created_at DESC', [req.user.id]);

    for (const ord of orders.rows) {
      const fulRes = await pool.query(
        `SELECT f.id, f.fulfillment_number, f.status, f.subtotal, f.awb_code, f.courier_name, 
                f.tracking_url, f.shipped_at, f.delivered_at, f.vendor_id,
                v.name as vendor_name
         FROM order_fulfillments f
         LEFT JOIN vendors v ON f.vendor_id = v.id
         WHERE f.order_id = $1
         ORDER BY f.id ASC`,
        [ord.id]
      );
      ord.fulfillments = fulRes.rows;
    }

    res.json({ user: user.rows[0], addresses: addresses.rows, orders: orders.rows });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/auth/profile
router.put('/profile', authMiddleware, async (req, res) => {
  const { name, phone } = req.body;
  try {
    const result = await pool.query(
      'UPDATE users SET name=$1, phone=$2 WHERE id=$3 RETURNING id, name, email, phone',
      [name, phone, req.user.id]
    );
    res.json({ user: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/auth/address
router.post('/address', authMiddleware, validate(addressSchema), async (req, res) => {
  const { name, line1, line2, city, state, pincode, mobile, is_default } = req.body;
  try {
    if (is_default) {
      await pool.query('UPDATE addresses SET is_default=FALSE WHERE user_id=$1', [req.user.id]);
    }
    const result = await pool.query(
      'INSERT INTO addresses (user_id, name, line1, line2, city, state, pincode, mobile, is_default) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *',
      [req.user.id, name, line1, line2, city, state, pincode, mobile, is_default || false]
    );
    res.json({ address: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/auth/orders
router.post('/orders', authMiddleware, validate(orderSchema), async (req, res) => {
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

    // Prepare vendor earnings
    const vendorData = {};
    for (const item of verifiedItems) {
      if (item.product && item.product.vendor_id) {
        const vid = item.product.vendor_id;
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

    // Atomic transaction: Order insert + Stock deduction + Vendor wallet credit
    const client = await pool.connect();
    let result;
    try {
      await client.query('BEGIN');

      try {
        result = await client.query(
          `INSERT INTO orders (user_id, order_number, total, items, address, status, payment_method, advance_paid, razorpay_payment_id)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
          [req.user.id, orderNumber, calculatedTotal, itemsJson, addressJson, orderStatus, pMethod, advancePaid, razorpay_payment_id || null]
        );
      } catch (dbErr) {
        if (dbErr.code === '42703') { // undefined_column before migration
          result = await client.query(
            `INSERT INTO orders (user_id, order_number, total, items, address, status, payment_method, advance_paid)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
            [req.user.id, orderNumber, calculatedTotal, itemsJson, addressJson, orderStatus, pMethod, advancePaid]
          );
        } else {
          throw dbErr;
        }
      }

      // Atomic stock reduction (fails order if stock is insufficient)
      for (const item of verifiedItems) {
        const prodId = item.product?.id || item.id;
        const qty = item.qty || 1;
        const stockUpdate = await client.query(
          'UPDATE products SET stock = stock - $1 WHERE id = $2 AND stock >= $1',
          [qty, prodId]
        );
        if (stockUpdate.rowCount === 0) {
          const prodName = item.product?.name || `Product ID ${prodId}`;
          throw new Error(`Insufficient stock for "${prodName}". Order could not be completed.`);
        }
      }

      // Credit vendor wallets and record transactions within the transaction
      for (const [vid, data] of Object.entries(vendorData)) {
        await client.query('UPDATE vendors SET wallet_balance = COALESCE(wallet_balance, 0) + $1 WHERE id = $2', [data.total, vid]);
        await client.query(
          'INSERT INTO vendor_transactions (vendor_id, type, amount, order_number, description) VALUES ($1, $2, $3, $4, $5)',
          [vid, 'credit', data.total, orderNumber, `Order ${orderNumber} - ${data.items.length} item(s)`]
        );
      }

      // Phase 3: Atomically create vendor fulfillments
      await fulfillmentService.createFulfillmentsForOrder(result.rows[0], verifiedItems, client);

      await client.query('COMMIT');
    } catch (txErr) {
      await client.query('ROLLBACK');
      throw txErr;
    } finally {
      client.release();
    }

    // Send vendor notifications
    for (const [vid, data] of Object.entries(vendorData)) {
      const vendorRes = await pool.query('SELECT name, email FROM vendors WHERE id = $1', [vid]);
      if (vendorRes.rows[0]) {
        sendOrderEmailToVendor(vendorRes.rows[0].email, vendorRes.rows[0].name, orderNumber, data.items, data.total, address, pMethod);
      }
    }
    
    // Send customer and admin emails
    sendOrderEmailToAdmin(orderNumber, calculatedTotal, address, verifiedItems, pMethod);
    const userRes = await pool.query('SELECT email FROM users WHERE id = $1', [req.user.id]);
    const userEmail = userRes.rows[0]?.email || address?.email;
    sendOrderEmailToCustomer(userEmail, orderNumber, calculatedTotal, address, verifiedItems, pMethod);

    res.json({ success: true, order: result.rows[0] });
  } catch (err) {
    console.error('Auth order placement error:', err);
    res.status(err.statusCode || 400).json({ error: err.message || 'Failed to place order' });
  }
});

// DELETE /api/auth/address/:id
router.delete('/address/:id', authMiddleware, async (req, res) => {
  try {
    await pool.query('DELETE FROM addresses WHERE id=$1 AND user_id=$2', [req.params.id, req.user.id]);
    res.json({ message: 'Address deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/auth/change-password
router.put('/change-password', authMiddleware, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  try {
    const result = await pool.query('SELECT password_hash FROM users WHERE id=$1', [req.user.id]);
    const valid = await bcrypt.compare(currentPassword, result.rows[0].password_hash);
    if (!valid) return res.status(400).json({ error: 'Current password is incorrect' });
    const hash = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE users SET password_hash=$1 WHERE id=$2', [hash, req.user.id]);
    res.json({ message: 'Password changed' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/auth/me
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await pool.query(
      'SELECT id, name, email, role FROM users WHERE id=$1',
      [req.user.id]
    );
    if (!user.rows.length) return res.status(404).json({ error: 'User not found' });
    res.json({ user: user.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/auth/account
router.delete('/account', authMiddleware, async (req, res) => {
  const { password } = req.body;
  if (!password) {
    return res.status(400).json({ error: 'Password is required to delete your account' });
  }

  try {
    const userRes = await pool.query('SELECT * FROM users WHERE id = $1', [req.user.id]);
    if (!userRes.rows.length) {
      return res.status(404).json({ error: 'User not found' });
    }
    const user = userRes.rows[0];

    // 1. Verify password
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(400).json({ error: 'Incorrect password' });
    }

    // 2. Anonymize user record
    const anonymizedEmail = `deleted_user_${user.id}_${Date.now()}@deleted.ulmgh.invalid`;
    try {
      await pool.query(
        `UPDATE users
         SET name = 'Deleted User',
             email = $1,
             phone = '',
             password_hash = '',
             avatar_url = NULL,
             is_verified = FALSE,
             is_deleted = TRUE,
             deleted_at = NOW()
         WHERE id = $2`,
        [anonymizedEmail, req.user.id]
      );
    } catch (updateErr) {
      if (updateErr.code === '42703') { // is_deleted / deleted_at columns not created yet before migration
        await pool.query(
          `UPDATE users
           SET name = 'Deleted User',
               email = $1,
               phone = '',
               password_hash = '',
               avatar_url = NULL,
               is_verified = FALSE
           WHERE id = $2`,
          [anonymizedEmail, req.user.id]
        );
      } else {
        throw updateErr;
      }
    }

    // 3. Delete saved addresses
    await pool.query('DELETE FROM addresses WHERE user_id = $1', [req.user.id]);

    // 4. Delete OTP records for this user's email
    await pool.query('DELETE FROM otps WHERE email = $1', [user.email]);

    // Note: Order records in 'orders' table are intentionally preserved for accounting/tax compliance.

    res.json({ success: true, message: 'Account deleted successfully' });
  } catch (err) {
    console.error('Customer account deletion error:', err);
    res.status(500).json({ error: 'Failed to delete account' });
  }
});

module.exports = router;
module.exports.authMiddleware = authMiddleware;
