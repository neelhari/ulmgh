const assert = require('assert');
const crypto = require('crypto');
const app = require('../index');

async function runRazorpayStandardTests() {
  console.log('================================================================');
  console.log('      ULMGH369 RAZORPAY STANDARD WEB CHECKOUT TEST SUITE        ');
  console.log('================================================================\n');

  const PORT = 5098;
  const server = app.listen(PORT);
  let passedCount = 0;

  try {
    const baseUrl = `http://localhost:${PORT}/api`;

    // TEST 1: Validate minimum amount validation (>= 100 paise)
    console.log('1. Testing minimum amount validation (< 100 paise rejection)...');
    const resUnderMin = await fetch(`${baseUrl}/create-order`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: 50, currency: 'INR' })
    });
    assert.strictEqual(resUnderMin.status, 400, 'Must return 400 when amount is < 100 paise');
    const underMinData = await resUnderMin.json();
    assert.ok(underMinData.error, 'Must include error message');
    console.log('   ✅ Rejection verified for amount < 100 paise:', underMinData.error);
    passedCount++;

    // TEST 2: Create Order via Razorpay API (POST /api/create-order)
    console.log('\n2. Testing Razorpay Order creation (POST /api/create-order)...');
    const orderAmount = 25000; // ₹250.00
    const resCreate = await fetch(`${baseUrl}/create-order`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: orderAmount,
        currency: 'INR',
        receipt: `test_rcpt_${Date.now()}`
      })
    });
    assert.strictEqual(resCreate.status, 200, 'Order creation must return 200 OK');
    const orderData = await resCreate.json();
    assert.ok(orderData.order_id, 'Must return order_id');
    assert.strictEqual(orderData.amount, orderAmount, 'Must return correct amount in paise');
    assert.strictEqual(orderData.currency, 'INR', 'Must return INR currency');
    console.log(`   ✅ Order created with Razorpay API: order_id=${orderData.order_id}, amount=${orderData.amount} paise`);
    passedCount++;

    // TEST 3: Verify HMAC-SHA256 Signature with valid signature (POST /api/verify-payment)
    console.log('\n3. Testing valid HMAC-SHA256 signature verification (POST /api/verify-payment)...');
    const secret = process.env.RAZORPAY_KEY_SECRET;
    assert.ok(secret, 'RAZORPAY_KEY_SECRET must be configured');

    const mockPaymentId = `pay_mock_${Date.now()}`;
    const validSignature = crypto
      .createHmac('sha256', secret)
      .update(`${orderData.order_id}|${mockPaymentId}`)
      .digest('hex');

    const resVerify = await fetch(`${baseUrl}/verify-payment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        razorpay_order_id: orderData.order_id,
        razorpay_payment_id: mockPaymentId,
        razorpay_signature: validSignature
      })
    });
    assert.strictEqual(resVerify.status, 200, 'Valid signature must return 200 OK');
    const verifyData = await resVerify.json();
    assert.strictEqual(verifyData.success, true, 'Verification response must indicate success');
    console.log('   ✅ Valid signature verified successfully by backend HMAC comparison.');
    passedCount++;

    // TEST 4: Reject tampered / invalid signature (POST /api/verify-payment)
    console.log('\n4. Testing tampered signature rejection (POST /api/verify-payment)...');
    const tamperedSignature = validSignature.slice(0, -4) + '0000';
    const resTampered = await fetch(`${baseUrl}/verify-payment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        razorpay_order_id: orderData.order_id,
        razorpay_payment_id: mockPaymentId,
        razorpay_signature: tamperedSignature
      })
    });
    assert.strictEqual(resTampered.status, 400, 'Tampered signature must return 400 Bad Request');
    const tamperedData = await resTampered.json();
    assert.strictEqual(tamperedData.success, false, 'Must reject with success: false');
    console.log('   ✅ Tampered signature strictly rejected:', tamperedData.error);
    passedCount++;

    // TEST 5: Reject missing required verification fields
    console.log('\n5. Testing missing fields rejection...');
    const resMissing = await fetch(`${baseUrl}/verify-payment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        razorpay_order_id: orderData.order_id
        // missing payment_id and signature
      })
    });
    assert.strictEqual(resMissing.status, 400, 'Missing fields must return 400 Bad Request');
    console.log('   ✅ Missing fields rejected with 400.');
    passedCount++;

    console.log('\n================================================================');
    console.log(`   ALL ${passedCount}/5 RAZORPAY STANDARD CHECKOUT TESTS PASSED! 🚀 `);
    console.log('================================================================\n');
  } catch (err) {
    console.error('❌ Test failed with error:', err);
    process.exit(1);
  } finally {
    server.close();
    process.exit(0);
  }
}

runRazorpayStandardTests();

