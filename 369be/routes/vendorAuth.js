const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db');
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
});

const { generateOTP, createOTP, verifyOTP } = require('../utils/otp');
const { authLimiter } = require('../utils/rateLimiter');
const { verifyRazorpayPayment } = require('../utils/razorpay');
const {
  validatePickupAddress,
  generateShiprocketNickname,
  formatFullAddress,
} = require('../utils/pickupValidation');

async function sendOTPEmail(email, otp, name) {
  await transporter.sendMail({
    from: `"ULMGH369 Vendor" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Your OTP for Vendor Signup',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:24px;border:1px solid #fe6603;border-radius:12px;">
        <h2 style="color:#fe6603;">Welcome to ULMGH369 Vendor Portal</h2>
        <p>Hi <strong>${name}</strong>,</p>
        <p>Your OTP for verifying your vendor application is:</p>
        <div style="font-size:36px;font-weight:bold;color:#ea580c;letter-spacing:8px;text-align:center;padding:16px;background:#fff7ed;border-radius:8px;margin:16px 0;">
          ${otp}
        </div>
        <p style="color:#6b7280;font-size:13px;">This OTP is valid for 10 minutes. Do not share it with anyone.</p>
      </div>
    `,
  });
}

async function sendVendorPasswordResetOTPEmail(email, otp, name) {
  await transporter.sendMail({
    from: `"ULMGH369 Vendor" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Vendor Password Reset OTP',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:24px;border:1px solid #fe6603;border-radius:12px;">
        <h2 style="color:#fe6603;">Vendor Password Reset Request</h2>
        <p>Hi <strong>${name}</strong>,</p>
        <p>Your OTP to reset your password is:</p>
        <div style="font-size:36px;font-weight:bold;color:#fe6603;letter-spacing:8px;text-align:center;padding:16px;background:#fff7ed;border-radius:8px;margin:16px 0;">
          ${otp}
        </div>
        <p style="color:#6b7280;font-size:13px;">This OTP is valid for 10 minutes. Do not share it with anyone.</p>
      </div>
    `,
  });
}

// Registration
router.post('/signup', authLimiter, async (req, res) => {
  const {
    name, store_name, email, phone, password, address,
    pickup_contact_name, pickup_phone, pickup_line1, pickup_line2, pickup_city, pickup_state, pickup_pincode,
    plan_id, payment_id, razorpay_order_id, razorpay_payment_id, razorpay_signature
  } = req.body;
  const payId = razorpay_payment_id || payment_id;
  const orderId = razorpay_order_id;
  const signature = razorpay_signature;

  if (!email || !password || !store_name) return res.status(400).json({ error: 'Missing required fields' });
  if (!plan_id || !payId || !orderId || !signature) {
    return res.status(400).json({ error: 'Subscription payment verification details required (plan_id, razorpay_order_id, razorpay_payment_id, razorpay_signature)' });
  }

  // Validate structured pickup address if provided
  let structuredPickup = null;
  if (pickup_line1 || pickup_city || pickup_pincode) {
    const val = validatePickupAddress({
      pickup_contact_name: pickup_contact_name || name,
      pickup_phone: pickup_phone || phone,
      pickup_line1,
      pickup_line2,
      pickup_city,
      pickup_state,
      pickup_pincode,
    });
    if (!val.isValid) {
      return res.status(400).json({ error: val.error });
    }
    structuredPickup = val.sanitized;
  }

  const finalAddress = address || (structuredPickup ? formatFullAddress(structuredPickup) : '');

  try {
    // 1. Verify plan exists
    const planRes = await pool.query('SELECT * FROM subscription_plans WHERE id=$1 AND is_active=TRUE', [plan_id]);
    if (!planRes.rows.length) return res.status(400).json({ error: 'Invalid subscription plan' });
    const plan = planRes.rows[0];

    // 2. Block reuse of the same razorpay_payment_id
    const existingPayment = await pool.query('SELECT id FROM vendor_subscriptions WHERE payment_id = $1', [payId]);
    if (existingPayment.rows.length > 0) {
      return res.status(400).json({ error: 'This payment ID has already been used' });
    }

    // 3. Verify HMAC signature, status is captured/authorized, and amount in paise matches plan price
    const expectedAmountPaise = Math.round(Number(plan.price) * 100);
    await verifyRazorpayPayment(orderId, payId, signature, expectedAmountPaise);

    const check = await pool.query('SELECT id, status FROM vendors WHERE email = $1', [email]);
    if (check.rows.length > 0) {
      if (check.rows[0].status !== 'unverified') {
        return res.status(400).json({ error: 'Email already exists and is verified/pending.' });
      }
    }

    const password_hash = await bcrypt.hash(password, 10);
    const otp = generateOTP();

    let vendorId;
    if (check.rows.length > 0) {
      vendorId = check.rows[0].id;
      const srNickname = structuredPickup ? generateShiprocketNickname(vendorId, structuredPickup.pickup_pincode) : null;
      await pool.query(
        `UPDATE vendors 
         SET name=$1, store_name=$2, phone=$3, password_hash=$4, address=$5,
             pending_plan_id=$6, pending_payment_id=$7, pending_order_id=$8,
             pickup_contact_name=$9, pickup_phone=$10, pickup_line1=$11, pickup_line2=$12,
             pickup_city=$13, pickup_state=$14, pickup_pincode=$15, shiprocket_pickup_nickname=COALESCE($16, shiprocket_pickup_nickname)
         WHERE email=$17`,
        [
          name, store_name, phone, password_hash, finalAddress,
          plan_id, payId, orderId,
          structuredPickup?.pickup_contact_name || null,
          structuredPickup?.pickup_phone || null,
          structuredPickup?.pickup_line1 || null,
          structuredPickup?.pickup_line2 || null,
          structuredPickup?.pickup_city || null,
          structuredPickup?.pickup_state || null,
          structuredPickup?.pickup_pincode || null,
          srNickname,
          email
        ]
      );
    } else {
      const insRes = await pool.query(
        `INSERT INTO vendors (
          name, store_name, email, phone, password_hash, address, status,
          pending_plan_id, pending_payment_id, pending_order_id,
          pickup_contact_name, pickup_phone, pickup_line1, pickup_line2,
          pickup_city, pickup_state, pickup_pincode
        ) VALUES ($1, $2, $3, $4, $5, $6, 'unverified', $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
        RETURNING id`,
        [
          name, store_name, email, phone, password_hash, finalAddress,
          plan_id, payId, orderId,
          structuredPickup?.pickup_contact_name || null,
          structuredPickup?.pickup_phone || null,
          structuredPickup?.pickup_line1 || null,
          structuredPickup?.pickup_line2 || null,
          structuredPickup?.pickup_city || null,
          structuredPickup?.pickup_state || null,
          structuredPickup?.pickup_pincode || null
        ]
      );
      vendorId = insRes.rows[0].id;
      if (structuredPickup) {
        const srNickname = generateShiprocketNickname(vendorId, structuredPickup.pickup_pincode);
        await pool.query('UPDATE vendors SET shiprocket_pickup_nickname=$1 WHERE id=$2', [srNickname, vendorId]);
      }
    }

    await createOTP(email, otp);
    await sendOTPEmail(email, otp, name);
    res.json({ message: 'OTP sent to your email successfully.' });
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message });
  }
});

// Verify OTP
router.post('/verify-otp', authLimiter, async (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) return res.status(400).json({ error: 'Email and OTP required' });

  try {
    const check = await verifyOTP(email, otp, true);
    if (!check.valid) return res.status(400).json({ error: check.error });

    // Get vendor with pending subscription info
    const vendorRes = await pool.query('SELECT id, pending_plan_id, pending_payment_id FROM vendors WHERE email=$1', [email]);
    const vendor = vendorRes.rows[0];

    // Activate subscription if payment was made
    if (vendor && vendor.pending_plan_id && vendor.pending_payment_id) {
      const planRes = await pool.query('SELECT * FROM subscription_plans WHERE id=$1', [vendor.pending_plan_id]);
      if (planRes.rows.length) {
        const plan = planRes.rows[0];
        const expiresAt = new Date();
        expiresAt.setMonth(expiresAt.getMonth() + plan.months);
        await pool.query(
          `INSERT INTO vendor_subscriptions (vendor_id, plan_id, plan_name, months, amount, payment_id, starts_at, expires_at, features)
           VALUES ($1,$2,$3,$4,$5,$6,NOW(),$7,$8)`,
          [vendor.id, plan.id, plan.name, plan.months, plan.price, vendor.pending_payment_id, expiresAt, plan.features || {}]
        );
        await pool.query(
          'UPDATE vendors SET subscription_expires_at=$1, pending_plan_id=NULL, pending_payment_id=NULL WHERE id=$2',
          [expiresAt, vendor.id]
        );
      }
    }

    await pool.query("UPDATE vendors SET status='pending' WHERE email=$1", [email]);
    res.json({ message: 'Application verified. Awaiting admin approval.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Login
router.post('/login', authLimiter, async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await pool.query('SELECT * FROM vendors WHERE email = $1', [email]);
    if (result.rows.length === 0) return res.status(400).json({ error: 'Invalid credentials' });

    const vendor = result.rows[0];
    if (vendor.is_deleted || vendor.status === 'inactive') {
      return res.status(403).json({ error: 'This vendor account has been deleted or closed.' });
    }
    const match = await bcrypt.compare(password, vendor.password_hash);
    if (!match) return res.status(400).json({ error: 'Invalid credentials' });

    if (vendor.status === 'pending') {
      return res.status(403).json({ error: 'The application is under review. Once admin approves you can login here.' });
    }
    if (vendor.status === 'rejected') {
      return res.status(403).json({ error: 'Your vendor application has been rejected by the admin.' });
    }
    if (vendor.status === 'unverified') {
      return res.status(403).json({ error: 'Please verify your email via the OTP sent during signup before logging in.' });
    }

    const token = jwt.sign({ id: vendor.id, role: 'vendor' }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, vendor: { id: vendor.id, name: vendor.name, email: vendor.email, store_name: vendor.store_name } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/vendorAuth/forgot-password
router.post('/forgot-password', authLimiter, async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email required' });

  try {
    const vendor = await pool.query(
      'SELECT name, email FROM vendors WHERE LOWER(email)=LOWER($1) AND COALESCE(is_deleted, false) = false',
      [email.trim()]
    );
    if (!vendor.rows.length) return res.status(404).json({ error: 'Vendor not found' });

    const otp = generateOTP();
    await createOTP(vendor.rows[0].email, otp);

    await sendVendorPasswordResetOTPEmail(vendor.rows[0].email, otp, vendor.rows[0].name);
    res.json({ message: 'OTP sent to your email' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/vendorAuth/verify-reset-otp
router.post('/verify-reset-otp', authLimiter, async (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) return res.status(400).json({ error: 'Email and OTP required' });

  try {
    const check = await verifyOTP(email, otp, false);
    if (!check.valid) return res.status(400).json({ error: check.error });
    res.json({ success: true, message: 'OTP verified' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/vendorAuth/reset-password
router.post('/reset-password', authLimiter, async (req, res) => {
  const { email, otp, newPassword } = req.body;
  if (!email || !otp || !newPassword) return res.status(400).json({ error: 'Missing required fields' });

  try {
    const check = await verifyOTP(email, otp, true);
    if (!check.valid) return res.status(400).json({ error: check.error });

    const hash = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE vendors SET password_hash=$1 WHERE email=$2', [hash, email]);

    res.json({ success: true, message: 'Password reset successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Auth Middleware for Vendors
const vendorAuthMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== 'vendor') return res.status(403).json({ error: 'Vendor access only' });
    req.vendorId = decoded.id;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Get current vendor
router.get('/me', vendorAuthMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT v.id, v.name, v.store_name, v.email, v.phone, v.address, v.status,
              v.wallet_balance, COALESCE(v.outstanding_debt, 0) as outstanding_debt, v.subscription_expires_at, v.created_at,
              v.bank_account_holder_name, v.bank_account_number, v.bank_ifsc_code, v.bank_name,
              COALESCE(v.bank_verification_status, 'not_provided') as bank_verification_status,
              v.pickup_contact_name, v.pickup_phone, v.pickup_line1, v.pickup_line2,
              v.pickup_city, v.pickup_state, v.pickup_pincode, v.shiprocket_pickup_nickname,
              v.is_pickup_synced, v.shiprocket_pickup_id, v.pickup_synced_at, v.pickup_sync_error, v.pickup_version,
              vs.plan_name, vs.months, vs.amount, vs.expires_at as sub_expires_at, vs.features as sub_features
       FROM vendors v
       LEFT JOIN LATERAL (
         SELECT plan_name, months, amount, expires_at, features
         FROM vendor_subscriptions
         WHERE vendor_id = v.id
         ORDER BY created_at DESC
         LIMIT 1
       ) vs ON true
       WHERE v.id = $1`,
      [req.vendorId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Vendor not found' });
    res.json({ vendor: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Shared helper to close and anonymize a vendor account while preserving
 * statutory order, fulfillment, subscription, and payout records.
 */
async function closeAndAnonymizeVendorAccount(vendor) {
  const balance = parseFloat(vendor.wallet_balance || 0);
  if (balance > 0) {
    return {
      blocked: true,
      error: `Cannot delete account with an active wallet balance of ₹${balance.toLocaleString()}. Please contact admin to withdraw your remaining balance first.`
    };
  }

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
           deleted_at = NOW(),
           pickup_contact_name = '',
           pickup_phone = '',
           pickup_line1 = '',
           pickup_line2 = '',
           bank_account_holder_name = NULL,
           bank_account_number = NULL,
           bank_ifsc_code = NULL,
           bank_name = NULL,
           bank_verification_status = 'not_provided'
       WHERE id = $2`,
      [anonymizedEmail, vendor.id]
    );
  } catch (updateErr) {
    if (updateErr.code === '42703') {
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
        [anonymizedEmail, vendor.id]
      );
    } else {
      throw updateErr;
    }
  }

  // Deactivate vendor products & support agents (if support_agents table exists)
  await pool.query(
    "UPDATE products SET is_active = FALSE, status = 'archived' WHERE vendor_id = $1",
    [vendor.id]
  );
  try {
    await pool.query(
      "UPDATE support_agents SET is_active = FALSE WHERE scope = 'vendor' AND vendor_id = $1",
      [vendor.id]
    );
  } catch (agentErr) {
    if (agentErr.code !== '42P01') throw agentErr;
  }

  // Clean up pending OTPs and push notification device tokens for this vendor
  if (vendor.email) {
    await pool.query('DELETE FROM otps WHERE LOWER(email) = LOWER($1)', [vendor.email]);
  }
  try {
    await pool.query("DELETE FROM fcm_device_tokens WHERE user_type = 'vendor' AND user_id = $1", [vendor.id]);
  } catch (tokenErr) {
    if (tokenErr.code !== '42P01') console.warn('FCM cleanup warning:', tokenErr.message);
  }

  return { blocked: false };
}

// POST /api/vendorAuth/deletion-request/send-code (Public)
router.post('/deletion-request/send-code', authLimiter, async (req, res) => {
  const { email } = req.body;
  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return res.status(400).json({ error: 'Valid email address is required' });
  }

  const cleanEmail = email.trim().toLowerCase();

  try {
    const vendorRes = await pool.query(
      `SELECT id, name, store_name, email FROM vendors
       WHERE LOWER(email) = $1 AND COALESCE(is_deleted, false) = false`,
      [cleanEmail]
    );

    if (vendorRes.rows.length) {
      const vendor = vendorRes.rows[0];
      const otp = generateOTP();
      await createOTP(vendor.email, otp);

      try {
        await transporter.sendMail({
          from: `"ULMGH-369 Vendor Support" <${process.env.EMAIL_USER}>`,
          to: vendor.email,
          subject: 'ULMGH-369 Vendor Account Deletion Verification Code',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; border: 1px solid #eee; border-radius: 12px; background: #fff;">
              <h2 style="color: #022A21; margin-top: 0;">Vendor Account Deletion Request</h2>
              <p style="color: #555; line-height: 1.6;">
                We received a request to close and delete the vendor account for <strong>${vendor.store_name || vendor.name}</strong> on <strong>ULMGH-369</strong>.
              </p>
              <p style="color: #555; line-height: 1.6;">Your 6-digit email ownership verification code is:</p>
              <div style="text-align: center; margin: 24px 0;">
                <span style="display: inline-block; font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #fe6603; background: #fff5ee; padding: 12px 28px; border-radius: 8px; border: 1px dashed #fe6603;">
                  ${otp}
                </span>
              </div>
              <p style="color: #777; font-size: 13px; line-height: 1.5;">
                This verification code is valid for 10 minutes. If you did not request this, no action is required and your vendor account remains active.
              </p>
            </div>
          `
        });
      } catch (mailErr) {
        console.error('Failed to send vendor deletion OTP email:', mailErr);
      }
    }

    res.json({
      success: true,
      message: 'If an active vendor account exists with this email, a 6-digit verification code has been sent.'
    });
  } catch (err) {
    console.error('Vendor deletion send-code error:', err);
    res.status(500).json({ error: 'Server error processing vendor deletion request' });
  }
});

// POST /api/vendorAuth/deletion-request/confirm (Public)
router.post('/deletion-request/confirm', authLimiter, async (req, res) => {
  const { email, otp, phone, reason } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ error: 'Email and verification code are required' });
  }

  const cleanEmail = email.trim().toLowerCase();
  const cleanOtp = otp.toString().trim();

  try {
    const otpResult = await verifyOTP(cleanEmail, cleanOtp, true);
    if (!otpResult.valid) {
      return res.status(400).json({ error: otpResult.error || 'Invalid or expired verification code' });
    }

    const vendorRes = await pool.query(
      `SELECT * FROM vendors
       WHERE LOWER(email) = $1 AND COALESCE(is_deleted, false) = false`,
      [cleanEmail]
    );

    const vendor = vendorRes.rows[0] || null;
    const vendorId = vendor?.id || null;
    const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket.remoteAddress || null;

    let reqStatus = 'completed';
    let processedAt = new Date();
    let blockedMsg = null;

    if (vendor) {
      const outcome = await closeAndAnonymizeVendorAccount(vendor);
      if (outcome.blocked) {
        reqStatus = 'pending';
        processedAt = null;
        blockedMsg = outcome.error;
      }
    } else {
      reqStatus = 'pending';
      processedAt = null;
    }

    await pool.query(
      `INSERT INTO vendor_deletion_requests
       (vendor_id, email, phone, reason, verification_status, verified_at, status, processed_at, ip_address)
       VALUES ($1, $2, $3, $4, 'verified', NOW(), $5, $6, $7)`,
      [vendorId, cleanEmail, phone ? String(phone).trim() : null, reason ? String(reason).trim() : null, reqStatus, processedAt, ip]
    );

    // Notify admin
    try {
      await transporter.sendMail({
        from: `"ULMGH-369 Alerts" <${process.env.EMAIL_USER}>`,
        to: process.env.EMAIL_USER,
        subject: `⚠️ Verified Vendor Account Deletion Request - ${cleanEmail}`,
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
            <h3 style="color: #c00;">Verified Vendor Account Deletion Request</h3>
            <p><strong>Email:</strong> ${cleanEmail}</p>
            <p><strong>Vendor ID:</strong> ${vendorId || 'N/A'}</p>
            <p><strong>Store Name:</strong> ${vendor?.store_name || 'N/A'}</p>
            <p><strong>Phone:</strong> ${phone || 'N/A'}</p>
            <p><strong>Reason / Comments:</strong> ${reason || 'None provided'}</p>
            <p><strong>Status:</strong> ${reqStatus}${blockedMsg ? ` (${blockedMsg})` : ''}</p>
            <p><strong>Verification:</strong> Email ownership verified via OTP</p>
            <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
            <p><strong>IP:</strong> ${ip || 'N/A'}</p>
          </div>
        `
      });
    } catch (e) {
      console.error('Failed to notify admin of vendor deletion request:', e);
    }

    if (blockedMsg) {
      return res.status(400).json({ error: blockedMsg, blockedByBalance: true });
    }

    // Acknowledge to vendor
    try {
      await transporter.sendMail({
        from: `"ULMGH-369 Vendor Support" <${process.env.EMAIL_USER}>`,
        to: cleanEmail,
        subject: 'ULMGH-369 Vendor Account Deletion Confirmed',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; border: 1px solid #eee; border-radius: 12px; background: #fff;">
            <h2 style="color: #022A21; margin-top: 0;">Vendor Deletion Request Confirmed</h2>
            <p style="color: #555; line-height: 1.6;">
              We have received and verified your request to close and delete the vendor account for <strong>${cleanEmail}</strong>.
            </p>
            <p style="color: #555; line-height: 1.6;">
              Your vendor profile details, login credentials, pickup address, bank payout details, product listings, and vendor support access have been removed/deactivated. Completed order, fulfillment, payout, and subscription records are retained strictly for statutory accounting and tax compliance.
            </p>
            <p style="color: #777; font-size: 13px; line-height: 1.5;">
              If you have any questions, contact our vendor support desk at ulmgh369@gmail.com.
            </p>
          </div>
        `
      });
    } catch (e) {
      console.error('Failed to send confirmation email to vendor:', e);
    }

    res.json({
      success: true,
      message: 'Your email ownership has been verified and your vendor account deletion request has been processed.'
    });
  } catch (err) {
    console.error('Vendor deletion confirm error:', err);
    res.status(500).json({ error: 'Server error confirming vendor deletion request' });
  }
});

module.exports = { router, vendorAuthMiddleware, closeAndAnonymizeVendorAccount };
