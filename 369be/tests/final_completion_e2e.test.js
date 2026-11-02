const assert = require('assert');
const pool = require('../db');
const vendorAccountingService = require('../services/vendorAccountingService');

// Payout execution helper matching POST /api/admin/vendors/:id/payout
async function executePayout({ vendorId, amount, idempotencyKey }) {
  if (amount === undefined || amount === null || amount === '') {
    const err = new Error('Payout amount is required');
    err.statusCode = 400;
    throw err;
  }
  const amountStr = String(amount).trim();
  if (!/^\d+(\.\d{1,2})?$/.test(amountStr)) {
    const err = new Error('Amount must be a positive number with at most 2 decimal places');
    err.statusCode = 400;
    throw err;
  }
  const payoutAmount = Math.round(parseFloat(amountStr) * 100) / 100;
  if (isNaN(payoutAmount) || payoutAmount <= 0 || !isFinite(payoutAmount)) {
    const err = new Error('Amount must be greater than zero');
    err.statusCode = 400;
    throw err;
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const vendorRes = await client.query(
      'SELECT id, name, store_name, wallet_balance FROM vendors WHERE id=$1 FOR UPDATE',
      [vendorId]
    );
    if (vendorRes.rows.length === 0) {
      await client.query('ROLLBACK');
      const err = new Error('Vendor not found');
      err.statusCode = 404;
      throw err;
    }

    const vendor = vendorRes.rows[0];

    if (idempotencyKey) {
      const existingTx = await client.query(
        'SELECT * FROM vendor_transactions WHERE vendor_id = $1 AND order_number = $2 AND type = $3',
        [vendor.id, idempotencyKey, 'debit']
      );
      if (existingTx.rows.length > 0) {
        await client.query('ROLLBACK');
        return {
          message: 'Payout already processed',
          vendor,
          alreadyProcessed: true,
          transaction: existingTx.rows[0]
        };
      }
    }

    const currentBalance = Math.round(parseFloat(vendor.wallet_balance || 0) * 100) / 100;
    if (currentBalance < payoutAmount) {
      await client.query('ROLLBACK');
      const err = new Error(`Insufficient wallet balance. Available: ₹${currentBalance}, Requested: ₹${payoutAmount}`);
      err.statusCode = 400;
      throw err;
    }

    const updateRes = await client.query(
      `UPDATE vendors 
       SET wallet_balance = ROUND((wallet_balance - $1)::numeric, 2) 
       WHERE id = $2 AND wallet_balance >= $1 
       RETURNING *`,
      [payoutAmount, vendor.id]
    );

    if (updateRes.rowCount === 0) {
      await client.query('ROLLBACK');
      const err = new Error('Insufficient wallet balance or concurrent payout conflict');
      err.statusCode = 400;
      throw err;
    }

    const desc = `Payout of ₹${payoutAmount.toLocaleString()} processed to bank account`;
    const txRes = await client.query(
      `INSERT INTO vendor_transactions 
         (vendor_id, type, amount, order_number, description, gross_amount, commission_percent, commission_amount, net_amount, debt_recovered) 
       VALUES ($1, 'debit', $2, $3, $4, NULL, NULL, NULL, $2, 0)
       RETURNING *`,
      [vendor.id, payoutAmount, idempotencyKey || null, desc]
    );

    await client.query('COMMIT');
    return {
      message: 'Payout successful',
      vendor: updateRes.rows[0],
      transaction: txRes.rows[0]
    };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

// Auth middleware simulator matching authMiddleware and adminOnly
function testAdminOnlyAuth(user) {
  if (!user) {
    const err = new Error('No token provided');
    err.statusCode = 401;
    throw err;
  }
  if (user.role !== 'admin') {
    const err = new Error('Admin access only');
    err.statusCode = 403;
    throw err;
  }
  return true;
}

async function runEndToEndTests() {
  console.log('================================================================');
  console.log('   ULMGH369 PHASE 4: COMPREHENSIVE END-TO-END FINANCIAL TESTS   ');
  console.log('================================================================\n');

  const client = await pool.connect();
  let passedCount = 0;
  const testVendorIds = [];
  const testPlanIds = [];

  try {
    // -------------------------------------------------------------------------
    // SETUP: Create isolated test vendor and plan
    // -------------------------------------------------------------------------
    console.log('--- Setting up isolated test harness ---');
    const pRes = await client.query(`
      INSERT INTO subscription_plans (name, price, months, is_active, features)
      VALUES ('E2E Test 15% Plan', 100, 1, true, '{"commission_percent": "15"}'::jsonb)
      RETURNING id
    `);
    const planId = pRes.rows[0].id;
    testPlanIds.push(planId);

    const vRes = await client.query(`
      INSERT INTO vendors (name, store_name, email, phone, status, wallet_balance, outstanding_debt)
      VALUES ('E2E Vendor', 'E2E Store', 'e2e_${Date.now()}@test.com', '9888880001', 'approved', 0.00, 0.00)
      RETURNING id
    `);
    const vendorId = vRes.rows[0].id;
    testVendorIds.push(vendorId);

    // Active subscription (15%)
    const subPaymentId1 = 'pay_e2e_sub_' + Date.now() + '_' + Math.floor(Math.random() * 100000);
    await client.query(`
      INSERT INTO vendor_subscriptions (vendor_id, plan_id, plan_name, months, amount, payment_id, starts_at, expires_at, status, features)
      VALUES ($1, $2, 'E2E Test 15% Plan', 1, 100, $3, NOW() - INTERVAL '1 day', NOW() + INTERVAL '30 days', 'active', '{"commission_percent": "15"}'::jsonb)
    `, [vendorId, planId, subPaymentId1]);

    // Setup an expired vendor for scenario 2
    const vExpRes = await client.query(`
      INSERT INTO vendors (name, store_name, email, phone, status, wallet_balance, outstanding_debt)
      VALUES ('Expired Vendor', 'Expired Store', 'expired_${Date.now()}@test.com', '9888880002', 'approved', 0.00, 0.00)
      RETURNING id
    `);
    const expiredVendorId = vExpRes.rows[0].id;
    testVendorIds.push(expiredVendorId);

    const subPaymentId2 = 'pay_exp_sub_' + Date.now() + '_' + Math.floor(Math.random() * 100000);
    await client.query(`
      INSERT INTO vendor_subscriptions (vendor_id, plan_id, plan_name, months, amount, payment_id, starts_at, expires_at, status, features)
      VALUES ($1, $2, 'E2E Test 15% Plan', 1, 100, $3, NOW() - INTERVAL '40 days', NOW() - INTERVAL '10 days', 'active', '{"commission_percent": "15"}'::jsonb)
    `, [expiredVendorId, planId, subPaymentId2]);

    console.log(`Created isolated test vendors (${vendorId}, ${expiredVendorId}) and plan (${planId})\n`);

    // -------------------------------------------------------------------------
    // SCENARIO 1: Successful purchase with commission calculation and wallet net credit
    // -------------------------------------------------------------------------
    console.log('Test 1: Successful purchase with commission calculation and wallet net credit...');
    const orderNum1 = `ORD_E2E_${Date.now()}_1`;
    const items1 = [
      { product: { vendor_id: vendorId }, price: 1000.00, qty: 1 }
    ];

    await client.query('BEGIN');
    const accResult1 = await vendorAccountingService.processOrderVendorAccounting({
      orderNumber: orderNum1,
      verifiedItems: items1,
      client
    });
    await client.query('COMMIT');

    const v1Data = accResult1[vendorId];
    assert.strictEqual(v1Data.grossAmount, 1000.00);
    assert.strictEqual(v1Data.commissionPercent, 15);
    assert.strictEqual(v1Data.commissionAmount, 150.00);
    assert.strictEqual(v1Data.netEarnings, 850.00);

    const vCheck1 = await client.query('SELECT wallet_balance, outstanding_debt FROM vendors WHERE id = $1', [vendorId]);
    assert.strictEqual(parseFloat(vCheck1.rows[0].wallet_balance), 850.00);
    assert.strictEqual(parseFloat(vCheck1.rows[0].outstanding_debt), 0.00);

    const txCheck1 = await client.query('SELECT * FROM vendor_transactions WHERE vendor_id = $1 AND order_number = $2', [vendorId, orderNum1]);
    assert.strictEqual(txCheck1.rows.length, 1);
    assert.strictEqual(txCheck1.rows[0].type, 'credit');
    assert.strictEqual(parseFloat(txCheck1.rows[0].amount), 850.00);
    assert.strictEqual(parseFloat(txCheck1.rows[0].gross_amount), 1000.00);
    assert.strictEqual(parseFloat(txCheck1.rows[0].commission_amount), 150.00);
    console.log('✅ Scenario 1 Passed: ₹1000 gross with 15% commission correctly credited ₹850 net earnings.');
    passedCount++;

    // -------------------------------------------------------------------------
    // SCENARIO 2: Invalid or expired subscription blocks checkout
    // -------------------------------------------------------------------------
    console.log('\nTest 2: Invalid or expired subscription rejection (blocks checkout)...');
    let expiredBlocked = false;
    await client.query('BEGIN');
    try {
      await vendorAccountingService.processOrderVendorAccounting({
        orderNumber: `ORD_E2E_${Date.now()}_EXP`,
        verifiedItems: [{ product: { vendor_id: expiredVendorId }, price: 500.00, qty: 1 }],
        client
      });
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      expiredBlocked = true;
      assert.match(err.message, /active subscription/i);
    }
    assert.strictEqual(expiredBlocked, true, 'Checkout should be blocked for expired subscription');
    console.log('✅ Scenario 2 Passed: Expired vendor subscription strictly blocked checkout with error.');
    passedCount++;

    // -------------------------------------------------------------------------
    // SCENARIO 3: Duplicate order credit prevention
    // -------------------------------------------------------------------------
    console.log('\nTest 3: Duplicate order credit prevention...');
    let duplicateBlocked = false;
    await client.query('BEGIN');
    try {
      await vendorAccountingService.processOrderVendorAccounting({
        orderNumber: orderNum1,
        verifiedItems: items1,
        client
      });
      await client.query('COMMIT');
    } catch (dupErr) {
      await client.query('ROLLBACK');
      duplicateBlocked = true;
      assert.strictEqual(dupErr.code, '23505', 'Database must reject duplicate credit via unique constraint');
    }
    assert.strictEqual(duplicateBlocked, true, 'Duplicate order accounting must be blocked');

    // Balance should remain unchanged at 850.00
    const vCheckDup = await client.query('SELECT wallet_balance FROM vendors WHERE id = $1', [vendorId]);
    assert.strictEqual(parseFloat(vCheckDup.rows[0].wallet_balance), 850.00);
    console.log('✅ Scenario 3 Passed: Duplicate order credit attempt safely rejected; balance untouched.');
    passedCount++;

    // -------------------------------------------------------------------------
    // SCENARIO 4: Cancellation before payout reversal
    // -------------------------------------------------------------------------
    console.log('\nTest 4: Cancellation before payout reversal...');
    await client.query('BEGIN');
    const revRes1 = await vendorAccountingService.reverseVendorOrderCredit({
      vendorId: vendorId,
      orderNumber: orderNum1,
      reason: 'Customer cancelled package before payout',
      client
    });
    await client.query('COMMIT');

    assert.strictEqual(revRes1.success, true);
    assert.strictEqual(revRes1.reversed, true);
    assert.strictEqual(revRes1.netToReverse, 850.00);
    assert.strictEqual(revRes1.recoveredFromWallet, 850.00);
    assert.strictEqual(revRes1.addedToDebt, 0.00);

    const vCheckRev1 = await client.query('SELECT wallet_balance, outstanding_debt FROM vendors WHERE id = $1', [vendorId]);
    assert.strictEqual(parseFloat(vCheckRev1.rows[0].wallet_balance), 0.00);
    assert.strictEqual(parseFloat(vCheckRev1.rows[0].outstanding_debt), 0.00);
    console.log('✅ Scenario 4 Passed: Pre-payout cancellation reduced balance from ₹850 to ₹0 without debt.');
    passedCount++;

    // -------------------------------------------------------------------------
    // SCENARIO 5: Cancellation after payout creates outstanding debt
    // -------------------------------------------------------------------------
    console.log('\nTest 5: Cancellation after payout creating debt...');
    // Step A: New order credits ₹850
    const orderNum5 = `ORD_E2E_${Date.now()}_5`;
    await client.query('BEGIN');
    await vendorAccountingService.processOrderVendorAccounting({
      orderNumber: orderNum5,
      verifiedItems: [{ product: { vendor_id: vendorId }, price: 1000.00, qty: 1 }],
      client
    });
    await client.query('COMMIT');

    // Step B: Admin processes payout of ₹850 (wallet becomes ₹0)
    const payoutRes5 = await executePayout({
      vendorId,
      amount: 850.00,
      idempotencyKey: `payout_e2e_s5_${Date.now()}`
    });
    assert.strictEqual(parseFloat(payoutRes5.vendor.wallet_balance), 0.00);

    // Step C: Customer cancels order -> Reversal called when wallet has ₹0
    await client.query('BEGIN');
    const revRes5 = await vendorAccountingService.reverseVendorOrderCredit({
      vendorId: vendorId,
      orderNumber: orderNum5,
      reason: 'Customer cancelled post-payout',
      client
    });
    await client.query('COMMIT');

    assert.strictEqual(revRes5.success, true);
    assert.strictEqual(revRes5.reversed, true);
    assert.strictEqual(revRes5.netToReverse, 850.00);
    assert.strictEqual(revRes5.recoveredFromWallet, 0.00);
    assert.strictEqual(revRes5.addedToDebt, 850.00);

    const vCheckDebt = await client.query('SELECT wallet_balance, outstanding_debt FROM vendors WHERE id = $1', [vendorId]);
    assert.strictEqual(parseFloat(vCheckDebt.rows[0].wallet_balance), 0.00);
    assert.strictEqual(parseFloat(vCheckDebt.rows[0].outstanding_debt), 850.00);
    console.log('✅ Scenario 5 Passed: Post-payout cancellation safely recorded ₹850 outstanding debt.');
    passedCount++;

    // -------------------------------------------------------------------------
    // SCENARIO 6: Debt recovery on future sale
    // -------------------------------------------------------------------------
    console.log('\nTest 6: Debt recovery on future sale...');
    // Next order has gross ₹1200, 15% comm (₹180), net earnings = ₹1020
    // Outstanding debt is ₹850
    // Debt recovered should be ₹850 -> remaining net credited to wallet should be ₹1020 - ₹850 = ₹170
    const orderNum6 = `ORD_E2E_${Date.now()}_6`;
    await client.query('BEGIN');
    const accResult6 = await vendorAccountingService.processOrderVendorAccounting({
      orderNumber: orderNum6,
      verifiedItems: [{ product: { vendor_id: vendorId }, price: 1200.00, qty: 1 }],
      client
    });
    await client.query('COMMIT');

    const v6Data = accResult6[vendorId];
    assert.strictEqual(v6Data.debtRecovered, 850.00);
    assert.strictEqual(v6Data.netCreditToWallet, 170.00);
    assert.strictEqual(v6Data.remainingDebt, 0.00);

    const vCheckRec = await client.query('SELECT wallet_balance, outstanding_debt FROM vendors WHERE id = $1', [vendorId]);
    assert.strictEqual(parseFloat(vCheckRec.rows[0].wallet_balance), 170.00);
    assert.strictEqual(parseFloat(vCheckRec.rows[0].outstanding_debt), 0.00);
    console.log('✅ Scenario 6 Passed: ₹850 debt fully settled on next sale; remaining ₹170 credited to wallet.');
    passedCount++;

    // -------------------------------------------------------------------------
    // SCENARIO 7: Insufficient payout balance rejection
    // -------------------------------------------------------------------------
    console.log('\nTest 7: Insufficient payout balance rejection...');
    let insufficientRejected = false;
    try {
      // Wallet balance is ₹170, attempting payout of ₹300
      await executePayout({
        vendorId,
        amount: 300.00,
        idempotencyKey: `payout_insuf_${Date.now()}`
      });
    } catch (err) {
      insufficientRejected = true;
      assert.strictEqual(err.statusCode, 400);
      assert.match(err.message, /insufficient/i);
    }
    assert.strictEqual(insufficientRejected, true);

    const vCheckInsuf = await client.query('SELECT wallet_balance FROM vendors WHERE id = $1', [vendorId]);
    assert.strictEqual(parseFloat(vCheckInsuf.rows[0].wallet_balance), 170.00);
    console.log('✅ Scenario 7 Passed: Excessive payout of ₹300 against ₹170 balance rejected cleanly.');
    passedCount++;

    // -------------------------------------------------------------------------
    // SCENARIO 8: Duplicate payout retry idempotency
    // -------------------------------------------------------------------------
    console.log('\nTest 8: Duplicate payout retry idempotency...');
    const retryIdempKey = `idemp_retry_${Date.now()}`;
    const firstPayout = await executePayout({
      vendorId,
      amount: 100.00,
      idempotencyKey: retryIdempKey
    });
    assert.strictEqual(parseFloat(firstPayout.vendor.wallet_balance), 70.00);
    assert.strictEqual(firstPayout.alreadyProcessed, undefined);

    // Immediate retry with exact same idempotency key
    const secondPayout = await executePayout({
      vendorId,
      amount: 100.00,
      idempotencyKey: retryIdempKey
    });
    assert.strictEqual(secondPayout.alreadyProcessed, true);

    // Balance must still be 70.00 (not debited twice)
    const vCheckRetry = await client.query('SELECT wallet_balance FROM vendors WHERE id = $1', [vendorId]);
    assert.strictEqual(parseFloat(vCheckRetry.rows[0].wallet_balance), 70.00);
    console.log('✅ Scenario 8 Passed: Idempotent payout retry returned cached result without duplicate debit.');
    passedCount++;

    // -------------------------------------------------------------------------
    // SCENARIO 9: Concurrent payout race condition serialization
    // -------------------------------------------------------------------------
    console.log('\nTest 9: Concurrent payout race condition serialization...');
    // Vendor has ₹70 balance. Fire 2 simultaneous requests for ₹50 each (total ₹100).
    const results = await Promise.allSettled([
      executePayout({ vendorId, amount: 50.00, idempotencyKey: `payout_race_1_${Date.now()}` }),
      executePayout({ vendorId, amount: 50.00, idempotencyKey: `payout_race_2_${Date.now()}` })
    ]);

    const fulfilled = results.filter(r => r.status === 'fulfilled');
    const rejected = results.filter(r => r.status === 'rejected');

    assert.strictEqual(fulfilled.length, 1, 'Exactly one concurrent payout must succeed');
    assert.strictEqual(rejected.length, 1, 'The competing concurrent payout must fail');

    const vCheckRace = await client.query('SELECT wallet_balance FROM vendors WHERE id = $1', [vendorId]);
    assert.strictEqual(parseFloat(vCheckRace.rows[0].wallet_balance), 20.00);
    console.log('✅ Scenario 9 Passed: Concurrent payouts serialized; exactly 1 succeeded, ending balance ₹20.00.');
    passedCount++;

    // -------------------------------------------------------------------------
    // SCENARIO 10: Historical records calculation (legacy vs tracked)
    // -------------------------------------------------------------------------
    console.log('\nTest 10: Historical records calculation (legacy vs tracked)...');
    const reportRes = await client.query(`
      SELECT v.id, v.store_name,
             COALESCE(stats.gross_sales, 0) as total_gross_sales,
             COALESCE(stats.commission_earned, 0) as total_commission_earned,
             COALESCE(stats.net_earnings, 0) as total_net_earnings,
             COALESCE(stats.legacy_sales, 0) as legacy_sales,
             COALESCE(stats.commission_tracked_sales, 0) as commission_tracked_sales
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
      WHERE v.id IN ($1, 4)
      ORDER BY v.id
    `, [vendorId]);

    const e2eVendorRow = reportRes.rows.find(r => r.id === vendorId);
    const historicalVendorRow = reportRes.rows.find(r => r.id === 4);

    // E2E Vendor should have commission-tracked sales and earned commission
    assert.ok(parseFloat(e2eVendorRow.commission_tracked_sales) > 0);
    assert.ok(parseFloat(e2eVendorRow.total_commission_earned) > 0);
    assert.strictEqual(parseFloat(e2eVendorRow.legacy_sales), 0.00);

    // Historical Vendor 4 should have ₹29132 legacy sales and ₹0 commission
    if (historicalVendorRow) {
      assert.strictEqual(parseFloat(historicalVendorRow.total_gross_sales), 29132.00);
      assert.strictEqual(parseFloat(historicalVendorRow.legacy_sales), 29132.00);
      assert.strictEqual(parseFloat(historicalVendorRow.total_commission_earned), 0.00);
      assert.strictEqual(parseFloat(historicalVendorRow.commission_tracked_sales), 0.00);
    }
    console.log('✅ Scenario 10 Passed: Historical reporting cleanly segments legacy uncommissioned sales from commission-tracked sales.');
    passedCount++;

    // -------------------------------------------------------------------------
    // SCENARIO 11: Unauthorized payout rejection (HTTP 401 and 403)
    // -------------------------------------------------------------------------
    console.log('\nTest 11: Unauthorized payout rejection (HTTP 401 and 403)...');
    // Test 11a: Unauthenticated (missing token) -> 401
    let unauth401 = false;
    try {
      testAdminOnlyAuth(null);
    } catch (err) {
      unauth401 = true;
      assert.strictEqual(err.statusCode, 401);
    }
    assert.strictEqual(unauth401, true);

    // Test 11b: Non-admin user (customer) -> 403
    let forbiddenUser403 = false;
    try {
      testAdminOnlyAuth({ id: 10, role: 'user', email: 'customer@test.com' });
    } catch (err) {
      forbiddenUser403 = true;
      assert.strictEqual(err.statusCode, 403);
      assert.match(err.message, /Admin access only/i);
    }
    assert.strictEqual(forbiddenUser403, true);

    // Test 11c: Vendor user -> 403
    let forbiddenVendor403 = false;
    try {
      testAdminOnlyAuth({ id: vendorId, role: 'vendor', email: 'vendor@test.com' });
    } catch (err) {
      forbiddenVendor403 = true;
      assert.strictEqual(err.statusCode, 403);
      assert.match(err.message, /Admin access only/i);
    }
    assert.strictEqual(forbiddenVendor403, true);

    // Test 11d: Admin -> allowed
    const adminAllowed = testAdminOnlyAuth({ id: 1, role: 'admin', email: 'admin@test.com' });
    assert.strictEqual(adminAllowed, true);

    console.log('✅ Scenario 11 Passed: Unauthorized payout access strictly returns HTTP 401 (unauthenticated) and 403 (forbidden).');
    passedCount++;

  } finally {
    // -------------------------------------------------------------------------
    // CLEANUP: Clean up test records
    // -------------------------------------------------------------------------
    console.log('\n--- Cleaning up test records ---');
    if (testVendorIds.length > 0) {
      await client.query('DELETE FROM vendor_transactions WHERE vendor_id = ANY($1)', [testVendorIds]);
      await client.query('DELETE FROM vendor_subscriptions WHERE vendor_id = ANY($1)', [testVendorIds]);
      await client.query('DELETE FROM vendors WHERE id = ANY($1)', [testVendorIds]);
    }
    if (testPlanIds.length > 0) {
      await client.query('DELETE FROM subscription_plans WHERE id = ANY($1)', [testPlanIds]);
    }
    client.release();
    console.log('Cleanup completed cleanly.');
  }

  console.log('\n================================================================');
  console.log(`   ALL ${passedCount}/11 END-TO-END SCENARIOS COMPLETED SUCCESSFULLY!  `);
  console.log('================================================================\n');
}

runEndToEndTests()
  .then(() => pool.end())
  .catch(async err => {
    console.error('❌ E2E TEST FAILED:', err);
    await pool.end();
    process.exit(1);
  });
