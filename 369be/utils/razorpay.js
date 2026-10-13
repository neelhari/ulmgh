const crypto = require('crypto');
const Razorpay = require('razorpay');

function getRazorpayInstance() {
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
}

/**
 * Verifies Razorpay payment signature and confirms status and amount with Razorpay API.
 * @param {string} orderId - Razorpay order ID
 * @param {string} paymentId - Razorpay payment ID
 * @param {string} signature - Razorpay HMAC signature
 * @param {number} expectedAmountPaise - Expected amount in paise
 * @returns {Promise<object>} The verified Razorpay payment object
 */
async function verifyRazorpayPayment(orderId, paymentId, signature, expectedAmountPaise) {
  if (!orderId || !paymentId || !signature) {
    const err = new Error('Missing Razorpay payment verification details');
    err.statusCode = 400;
    throw err;
  }

  // 1. Verify HMAC SHA256 signature
  const generatedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '')
    .update(`${orderId}|${paymentId}`)
    .digest('hex');

  if (generatedSignature !== signature) {
    const err = new Error('Invalid Razorpay payment signature');
    err.statusCode = 400;
    throw err;
  }

  // 2. Fetch payment from Razorpay API
  const razorpay = getRazorpayInstance();
  let payment;
  try {
    payment = await razorpay.payments.fetch(paymentId);
  } catch (apiErr) {
    const err = new Error(`Failed to verify payment with Razorpay API: ${apiErr.message}`);
    err.statusCode = 400;
    throw err;
  }

  if (!payment) {
    const err = new Error('Payment not found in Razorpay');
    err.statusCode = 400;
    throw err;
  }

  // 3. Confirm payment status is captured or authorized
  if (payment.status !== 'captured' && payment.status !== 'authorized') {
    const err = new Error(`Payment is not completed (status: ${payment.status})`);
    err.statusCode = 400;
    throw err;
  }

  // 4. Confirm amount equals server-calculated total (in paise)
  const actualPaise = parseInt(payment.amount, 10);
  const expectedPaise = parseInt(expectedAmountPaise, 10);
  if (actualPaise !== expectedPaise) {
    const err = new Error(`Payment amount mismatch: expected ₹${(expectedPaise / 100).toFixed(2)}, received ₹${(actualPaise / 100).toFixed(2)}`);
    err.statusCode = 400;
    throw err;
  }

  return payment;
}

module.exports = {
  getRazorpayInstance,
  verifyRazorpayPayment,
};
