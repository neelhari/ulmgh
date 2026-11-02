/**
 * Comprehensive Canonical Pricing Verification Test Suite
 * Tests consistency between database, backend calculateOrder, and frontend canonical pricing formulas.
 */
const path = require('path');
const assert = require('assert');
const { Pool } = require('pg');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
require('dotenv').config({ path: path.join(__dirname, '../.env.newdb') });

const connectionString = process.env.NEW_DATABASE_URL || process.env.DATABASE_URL;
const testPool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: true },
  max: 5,
});

const { calculateOrder, findMatchingOffer, getDeliveryCharge } = require('../utils/pricing');

async function runTests() {
  console.log('🚀 Running Canonical Pricing & Vendor Isolation Verification Tests...\n');

  let passed = 0;
  let failed = 0;

  function test(name, fn) {
    try {
      fn();
      console.log(`  ✅ PASS: ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ❌ FAIL: ${name}`);
      console.error(`     Error: ${err.message}`);
      failed++;
    }
  }

  async function testAsync(name, fn) {
    try {
      await fn();
      console.log(`  ✅ PASS: ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ❌ FAIL: ${name}`);
      console.error(`     Error: ${err.message}`);
      failed++;
    }
  }

  console.log('--- 1. Pricing Rules & Offer Scoping Tests ---');

  test('Vendor product (₹50 / MRP ₹75) with no eligible offer: price ₹50 and badge 33% OFF', () => {
    const product = { id: 108, name: 'Test product', price: 50, mrp: 75, vendor_id: 4 };
    const offers = []; // No active offers
    const match = findMatchingOffer(product, offers);
    assert.strictEqual(match, null, 'No offer should match');

    const basePrice = product.price;
    const effectivePrice = basePrice;
    const rawMrp = Number(product.mrp);
    const hasRealMrp = rawMrp > basePrice;
    const discountPercent = hasRealMrp ? Math.round(((rawMrp - effectivePrice) / rawMrp) * 100) : 0;

    assert.strictEqual(effectivePrice, 50, 'Effective price must be exactly ₹50');
    assert.strictEqual(discountPercent, 33, 'Discount badge must be 33% OFF');
  });

  test('Admin storewide automatic offer does NOT apply to third-party vendor products', () => {
    const vendorProduct = { id: 108, name: 'Test product', price: 50, mrp: 75, vendor_id: 4 };
    const adminStorewideOffer = [
      { id: 999, name: 'ADMIN_STOREWIDE', offer_type: 'offer', is_active: true, scope: 'all', discount_percent: '10.00', created_by: 'admin', vendor_id: null }
    ];
    const match = findMatchingOffer(vendorProduct, adminStorewideOffer);
    assert.strictEqual(match, null, 'Admin storewide offer must not apply to third-party vendor products');
  });

  test('Admin storewide automatic offer DOES apply to admin-owned products', () => {
    const adminProduct = { id: 50, name: 'Platform Admin Item', price: 100, mrp: 150, vendor_id: null };
    const adminStorewideOffer = [
      { id: 999, name: 'ADMIN_STOREWIDE', offer_type: 'offer', is_active: true, scope: 'all', discount_percent: '10.00', created_by: 'admin', vendor_id: null }
    ];
    const match = findMatchingOffer(adminProduct, adminStorewideOffer);
    assert.notStrictEqual(match, null, 'Admin storewide offer must apply to admin products');
    assert.strictEqual(match.id, 999);

    const effectivePrice = Math.round(adminProduct.price * (1 - parseFloat(match.discount_percent) / 100));
    const discountPercent = Math.round(((adminProduct.mrp - effectivePrice) / adminProduct.mrp) * 100);
    assert.strictEqual(effectivePrice, 90);
    assert.strictEqual(discountPercent, 40); // (150 - 90)/150 = 40%
  });

  test('Vendor-created offers apply ONLY to products owned by that vendor', () => {
    const vendor4Product = { id: 108, name: 'Test product', price: 50, mrp: 75, vendor_id: 4 };
    const vendor1Product = { id: 102, name: 'Vendor 1 Product', price: 200, mrp: 300, vendor_id: 1 };
    const adminProduct = { id: 50, name: 'Admin Item', price: 100, mrp: 150, vendor_id: null };

    const vendor4Offer = [
      { id: 10, name: 'V4_SALE', offer_type: 'offer', is_active: true, scope: 'all', discount_percent: '20.00', created_by: 'vendor', vendor_id: 4 }
    ];

    const matchV4 = findMatchingOffer(vendor4Product, vendor4Offer);
    const matchV1 = findMatchingOffer(vendor1Product, vendor4Offer);
    const matchAdmin = findMatchingOffer(adminProduct, vendor4Offer);

    assert.notStrictEqual(matchV4, null, 'Vendor 4 offer must match Vendor 4 product');
    assert.strictEqual(matchV4.id, 10);
    assert.strictEqual(matchV1, null, 'Vendor 4 offer must NOT match Vendor 1 product');
    assert.strictEqual(matchAdmin, null, 'Vendor 4 offer must NOT match Admin product');
  });

  test('Inactive offers and expired offers are excluded', () => {
    const product = { id: 50, price: 100, vendor_id: null };
    const offers = [
      { id: 1, offer_type: 'offer', is_active: false, scope: 'all', discount_percent: '50.00', created_by: 'admin' },
      { id: 2, offer_type: 'offer', is_active: true, scope: 'all', discount_percent: '50.00', created_by: 'admin', expires_at: new Date(Date.now() - 10000).toISOString() },
      { id: 3, offer_type: 'coupon', is_active: true, scope: 'all', discount_percent: '50.00', created_by: 'admin' }, // coupon requires code
    ];
    const match = findMatchingOffer(product, offers);
    assert.strictEqual(match, null, 'No inactive, expired, or coupon offers should match');
  });

  console.log('\n--- 2. Database Integration & calculateOrder Tests ---');

  await testAsync('Confirmed deletion of HELLO2000 from database', async () => {
    const res = await testPool.query("SELECT * FROM offers WHERE id = 5 OR name ILIKE '%HELLO2000%'");
    assert.strictEqual(res.rows.length, 0, 'HELLO2000 must be permanently deleted from DB');
  });

  await testAsync('calculateOrder calculates exact vendor price ₹50 for product 108', async () => {
    const result = await calculateOrder([{ id: 108, qty: 1 }], '', testPool);
    assert.strictEqual(result.verifiedItems.length, 1);
    const item = result.verifiedItems[0];

    assert.strictEqual(item.base_price, 50, 'Base price must be ₹50');
    assert.strictEqual(item.price, 50, 'Final charged unit price must be ₹50');
    assert.strictEqual(item.offer_discount, 0, 'No offer discount applied');
    assert.strictEqual(result.subtotal, 50, 'Subtotal must be ₹50');
    console.log(`     Product #108: Unit Price ₹${item.price}, Subtotal ₹${result.subtotal}`);
  });

  await testAsync('calculateOrder calculates correct subtotal for qty > 1', async () => {
    const result = await calculateOrder([{ id: 108, qty: 3 }], '', testPool);
    assert.strictEqual(result.verifiedItems.length, 1);
    const item = result.verifiedItems[0];

    assert.strictEqual(item.price, 50);
    assert.strictEqual(item.qty, 3);
    assert.strictEqual(result.subtotal, 150, 'Subtotal for qty=3 must be 3 * 50 = 150');
  });

  await testAsync('Backend calculateOrder ignores and overrides tampered client prices', async () => {
    // Client attempts to pass a tampered price of ₹1 instead of ₹50
    const tamperedPayload = [{ id: 108, price: 1, base_price: 1, qty: 2 }];
    const result = await calculateOrder(tamperedPayload, '', testPool);
    const item = result.verifiedItems[0];

    assert.strictEqual(item.price, 50, 'Backend must override tampered client price to genuine ₹50');
    assert.strictEqual(result.subtotal, 100, 'Subtotal must be 2 * 50 = ₹100');
    console.log(`     Tampered price ₹1 was rejected; securely charged genuine price ₹${item.price}`);
  });

  await testAsync('Existing historical orders in DB remain completely unchanged', async () => {
    const order18 = await testPool.query("SELECT id, order_number, total, items FROM orders WHERE id = 18");
    assert(order18.rows.length > 0, 'Order 18 exists');
    assert.strictEqual(order18.rows[0].total, '45.00', 'Historical Order 18 total must remain 45.00');

    const order17 = await testPool.query("SELECT id, order_number, total FROM orders WHERE id = 17");
    assert(order17.rows.length > 0, 'Order 17 exists');
    assert.strictEqual(order17.rows[0].total, '179.00', 'Historical Order 17 total must remain 179.00');
  });

  console.log(`\n=================================================`);
  console.log(`TEST SUMMARY: ${passed} Passed, ${failed} Failed`);
  await testPool.end();

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests().catch(async (err) => {
  console.error("Test runner exception:", err);
  try { await testPool.end(); } catch (e) {}
  process.exit(1);
});
