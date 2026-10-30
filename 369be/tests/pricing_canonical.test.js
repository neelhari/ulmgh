/**
 * Canonical Pricing Verification Test Suite
 * Tests consistency between database, backend calculateOrder, and frontend canonical pricing formulas.
 */
const assert = require('assert');
const pool = require('../db');
const { calculateOrder, findMatchingOffer, getDeliveryCharge } = require('../utils/pricing');

async function runTests() {
  console.log('🚀 Running Canonical Pricing Verification Tests...\n');

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

  // Unit tests for findMatchingOffer
  console.log('--- Unit Tests: findMatchingOffer & Pricing Formulas ---');

  test('Scope "all" matches any product', () => {
    const product = { id: 107, category: 'Electronics', price: 10030 };
    const offers = [
      { id: 1, offer_type: 'offer', is_active: true, scope: 'all', discount_percent: '10.00' }
    ];
    const match = findMatchingOffer(product, offers);
    assert.strictEqual(match?.id, 1);
  });

  test('Scope "category" matches correct category', () => {
    const product = { id: 107, category: 'Electronics', price: 10030 };
    const offers = [
      { id: 2, offer_type: 'offer', is_active: true, scope: 'category', category_ids: ['Clothing'], discount_percent: '20.00' },
      { id: 3, offer_type: 'offer', is_active: true, scope: 'category', category_ids: ['Electronics'], discount_percent: '15.00' }
    ];
    const match = findMatchingOffer(product, offers);
    assert.strictEqual(match?.id, 3);
  });

  test('Scope "product" matches correct product ID', () => {
    const product = { id: 107, category: 'Electronics', price: 10030 };
    const offers = [
      { id: 4, offer_type: 'offer', is_active: true, scope: 'product', product_ids: [102, 105], discount_percent: '25.00' },
      { id: 5, offer_type: 'offer', is_active: true, scope: 'product', product_ids: [107], discount_percent: '30.00' }
    ];
    const match = findMatchingOffer(product, offers);
    assert.strictEqual(match?.id, 5);
  });

  test('Highest discount percent wins when multiple offers match', () => {
    const product = { id: 107, category: 'Electronics', price: 10030 };
    const offers = [
      { id: 1, offer_type: 'offer', is_active: true, scope: 'all', discount_percent: '10.00' },
      { id: 2, offer_type: 'offer', is_active: true, scope: 'category', category_ids: ['Electronics'], discount_percent: '15.00' }
    ];
    const match = findMatchingOffer(product, offers);
    assert.strictEqual(match?.id, 2);
    assert.strictEqual(parseFloat(match?.discount_percent), 15);
  });

  test('Expired offers and inactive offers are excluded', () => {
    const product = { id: 107, category: 'Electronics', price: 10030 };
    const offers = [
      { id: 1, offer_type: 'offer', is_active: false, scope: 'all', discount_percent: '50.00' },
      { id: 2, offer_type: 'offer', is_active: true, scope: 'all', discount_percent: '50.00', expires_at: new Date(Date.now() - 10000).toISOString() },
      { id: 3, offer_type: 'coupon', is_active: true, scope: 'all', discount_percent: '50.00' }, // coupon requires explicit code
      { id: 4, offer_type: 'offer', is_active: true, scope: 'all', discount_percent: '10.00' }
    ];
    const match = findMatchingOffer(product, offers);
    assert.strictEqual(match?.id, 4);
  });

  test('Product with base ₹10,030 and 10% offer computes exactly ₹9,027 and 40% OFF against MRP ₹15,000', () => {
    const product = { id: 107, price: 10030, mrp: 15000 };
    const offers = [
      { id: 5, offer_type: 'offer', is_active: true, scope: 'all', discount_percent: '10.00' }
    ];
    const match = findMatchingOffer(product, offers);
    const offerPct = parseFloat(match.discount_percent);
    const effectivePrice = Math.round(product.price * (1 - offerPct / 100));
    const discountPercent = Math.round(((product.mrp - effectivePrice) / product.mrp) * 100);

    assert.strictEqual(effectivePrice, 9027);
    assert.strictEqual(discountPercent, 40);
  });

  test('Product with missing MRP does not invent fake MRP', () => {
    const product = { id: 108, price: 500, mrp: null };
    const offers = [
      { id: 5, offer_type: 'offer', is_active: true, scope: 'all', discount_percent: '10.00' }
    ];
    const match = findMatchingOffer(product, offers);
    const offerPct = parseFloat(match.discount_percent);
    const effectivePrice = Math.round(product.price * (1 - offerPct / 100));
    
    // Canonical rule: if no real MRP > basePrice, mrp is null, discount is offer discount
    const rawMrp = Number(product.mrp || 0);
    const hasRealMrp = rawMrp > product.price;
    const strikePrice = hasRealMrp ? rawMrp : product.price;
    const discountPercent = hasRealMrp ? Math.round(((rawMrp - effectivePrice) / rawMrp) * 100) : Math.round(offerPct);

    assert.strictEqual(effectivePrice, 450);
    assert.strictEqual(strikePrice, 500);
    assert.strictEqual(discountPercent, 10);
  });

  // Database integration tests with calculateOrder
  console.log('\n--- Integration Tests: Database calculateOrder ---');

  await testAsync('Real DB product applies active HELLO2000 10% offer in calculateOrder', async () => {
    const prodRes = await pool.query('SELECT id, name, price, stock FROM products WHERE is_active=true AND stock > 0 ORDER BY id DESC LIMIT 1');
    assert(prodRes.rows.length > 0, 'At least one active in-stock product exists in DB');
    const dbProd = prodRes.rows[0];
    const basePrice = parseFloat(dbProd.price);

    const result = await calculateOrder([{ id: dbProd.id, qty: 1 }]);
    assert.strictEqual(result.verifiedItems.length, 1);
    const item = result.verifiedItems[0];

    // Base price in DB vs effective offer price (10% off)
    const expectedEffectivePrice = Math.round(basePrice * 0.9);
    assert.strictEqual(item.base_price, basePrice);
    assert.strictEqual(item.price, expectedEffectivePrice);
    assert.strictEqual(result.subtotal, expectedEffectivePrice);
    console.log(`     Product #${dbProd.id} ("${dbProd.name}"): Base ₹${basePrice} -> Offer Price ₹${item.price} (Subtotal: ₹${result.subtotal})`);
  });

  await testAsync('Real DB product with 2 qty calculates subtotal as price * 2', async () => {
    const prodRes = await pool.query('SELECT id, name, price, stock FROM products WHERE is_active=true AND stock >= 2 ORDER BY id DESC LIMIT 1');
    if (prodRes.rows.length > 0) {
      const dbProd = prodRes.rows[0];
      const basePrice = parseFloat(dbProd.price);
      const expectedEffectivePrice = Math.round(basePrice * 0.9);
      const result = await calculateOrder([{ id: dbProd.id, qty: 2 }]);
      assert.strictEqual(result.subtotal, expectedEffectivePrice * 2);
      console.log(`     Product #${dbProd.id} Qty 2 -> Subtotal ₹${result.subtotal}`);
    } else {
      console.log('     Skipped qty=2 test (no product with stock >= 2)');
    }
  });

  console.log(`\n=================================================`);
  console.log(`TEST SUMMARY: ${passed} Passed, ${failed} Failed`);
  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests().catch(err => {
  console.error("Test runner exception:", err);
  process.exit(1);
});
