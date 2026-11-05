const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const Razorpay = require('razorpay');

/**
 * Helper to get Razorpay instance using environment variables
 */
function getRazorpayInstance() {
  const key_id = process.env.RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;

  if (!key_id || !key_secret) {
    const err = new Error('Razorpay credentials are not configured in environment variables');
    err.statusCode = 500;
    throw err;
  }

  return new Razorpay({ key_id, key_secret });
}

/**
 * STEP 1: BACKEND - Create Order
 * Endpoint: POST /api/create-order (and /api/payment/create-order)
 * Request body: { amount (in paise, integer >= 100), currency, receipt }
 * Return: { order_id, amount, currency, key_id }
 */
const handleCreateOrder = async (req, res) => {
  try {
    let { amount, currency, receipt } = req.body;

    if (amount === undefined || amount === null || isNaN(amount)) {
      return res.status(400).json({ error: 'amount is required and must be a valid number in paise' });
    }

    const amountInPaise = Math.round(Number(amount));

    // Validate minimum amount of 100 paise (₹1)
    if (amountInPaise < 100) {
      return res.status(400).json({ 
        error: 'Minimum amount must be at least 100 paise (₹1)' 
      });
    }

    const options = {
      amount: amountInPaise,
      currency: currency || 'INR',
      receipt: receipt ? String(receipt).slice(0, 40) : `rcpt_${Date.now()}`
    };

    let razorpay;
    try {
      razorpay = getRazorpayInstance();
    } catch (configErr) {
      return res.status(500).json({ error: configErr.message });
    }

    const order = await razorpay.orders.create(options);

    res.status(200).json({
      success: true,
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
      key_id: process.env.RAZORPAY_KEY_ID
    });
  } catch (err) {
    console.error('Razorpay Create Order Error:', err);

    // Handle authentication / unauthorized errors from Razorpay
    if (err.statusCode === 401 || (err.error && err.error.code === 'BAD_REQUEST_ERROR' && /auth/i.test(err.error.description))) {
      return res.status(401).json({ error: 'Razorpay authentication failed: invalid credentials' });
    }

    // Other Razorpay API errors (return 500)
    res.status(err.statusCode || 500).json({
      error: err.error?.description || err.message || 'Failed to create Razorpay order'
    });
  }
};

/**
 * STEP 3: BACKEND - Verify Signature
 * Endpoint: POST /api/verify-payment (and /api/payment/verify-payment)
 * Request body: { razorpay_order_id, razorpay_payment_id, razorpay_signature }
 * Algorithm: HMAC-SHA256(order_id + "|" + payment_id, KEY_SECRET)
 */
const handleVerifyPayment = async (req, res) => {
  try {
    const order_id = req.body.razorpay_order_id || req.body.order_id;
    const payment_id = req.body.razorpay_payment_id || req.body.payment_id;
    const signature = req.body.razorpay_signature || req.body.signature;

    // Validate required fields
    if (!order_id || !payment_id || !signature) {
      return res.status(400).json({
        success: false,
        error: 'Missing required payment verification fields (order_id, payment_id, signature)'
      });
    }

    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret) {
      return res.status(500).json({
        success: false,
        error: 'Razorpay key secret not configured on server'
      });
    }

    // Generate HMAC SHA256
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(`${order_id}|${payment_id}`)
      .digest('hex');

    // Secure timing-safe string comparison
    const expectedBuffer = Buffer.from(expectedSignature, 'utf8');
    const actualBuffer = Buffer.from(signature, 'utf8');

    let isValid = false;
    if (expectedBuffer.length === actualBuffer.length) {
      isValid = crypto.timingSafeEqual(expectedBuffer, actualBuffer);
    }

    if (!isValid) {
      return res.status(400).json({
        success: false,
        error: 'Invalid payment signature: verification failed'
      });
    }

    // Return success only if signatures match
    res.status(200).json({
      success: true,
      message: 'Payment verified successfully',
      order_id,
      payment_id
    });
  } catch (err) {
    console.error('Razorpay Verify Payment Error:', err);
    res.status(500).json({
      success: false,
      error: err.message || 'Internal server error during payment verification'
    });
  }
};

// Route mappings for /create-order and /verify-payment
router.post('/create-order', handleCreateOrder);
router.post('/payment/create-order', handleCreateOrder);

router.post('/verify-payment', handleVerifyPayment);
router.post('/payment/verify-payment', handleVerifyPayment);

module.exports = router;

