const assert = require('assert');
const pool = require('../db');
const vendorAccountingService = require('../services/vendorAccountingService');

async function runAllTests() {
  console.log('====================================================');
  console.log('   RUNNING ULMGH369 VENDOR COMMISSION TEST SUITE    ');
  console.log('====================================================\n');

  const client = await pool.connect();
  let passedCount = 0;
  let testVendorIds = [];
  let testPlanIds = [];

  try {
    // -------------------------------------------------------------------------
    // SETUP: Create isolated test plans and vendors
    // -------------------------------------------------------------------------
    console.log('--- Setting up test plans and vendors ---');

    // Test Plan 1 (21%)
    const p1 = await client.query(`
      INSERT INTO subscription_plans (name, price, months, is_active, features)
      VALUES ('Test Plan 21%', 0, 1, true, '{"commission_percent": "21"}'::jsonb)
      RETURNING id
    `);
    const plan21Id = p1.rows[0].id;
    testPlanIds.push(plan21Id);

    // Test Plan 2 (0.20%)
    const p2 = await client.query(`
      INSERT INTO subscription_plans (name, price, months, is_active, features)
      VALUES ('Test Plan 0.20%', 1000, 1, true, '{"commission_percent": "0.20"}'::jsonb)
      RETURNING id
    `);
    const plan020Id = p2.rows[0].id;
    testPlanIds.push(plan020Id);

    // Test Vendor A (21% Plan)
    const vA = await client.query(`
      INSERT INTO vendors (name, store_name, email, phone, status, wallet_balance, outstanding_debt)
      VALUES ('Vendor Alpha', 'Alpha Store', 'alpha_test_${Date.now()}@test.com', '9999990001', 'approved', 0, 0)
      RETURNING id
    `);
    const vendorAId = vA.rows[0].id;
    testVendorIds.push(vendorAId);

    await client.query(`
      INSERT INTO vendor_subscriptions (vendor_id, plan_id, plan_name, months, amount, payment_id, starts_at, expires_at, status, features)
      VALUES ($1, $2, 'Test Plan 21%', 1, 0, 'pay_test_a', NOW() - INTERVAL '1 day', NOW() + INTERVAL '30 days', 'active', '{"commission_percent": "21"}'::jsonb)
    `, [vendorAId, plan21Id]);

    // Test Vendor B (0.20% Plan)
    const vB = await client.query(`
      INSERT INTO vendors (name, store_name, email, phone, status, wallet_balance, outstanding_debt)
      VALUES ('Vendor Beta', 'Beta Store', 'beta_test_${Date.now()}@test.com', '9999990002', 'approved', 0, 0)
      RETURNING id
    `);
    const vendorBId = vB.rows[0].id;
    testVendorIds.push(vendorBId);

    await client.query(`
      INSERT INTO vendor_subscriptions (vendor_id, plan_id, plan_name, months, amount, payment_id, starts_at, expires_at, status, features)
      VALUES ($1, $2, 'Test Plan 0.20%', 1, 1000, 'pay_test_b', NOW() - INTERVAL '1 day', NOW() + INTERVAL '30 days', 'active', '{"commission_percent": "0.20"}'::jsonb)
    `, [vendorBId, plan020Id]);

    // Test Vendor C (Expired Subscription)
    const vC = await client.query(`
      INSERT INTO vendors (name, store_name, email, phone, status, wallet_balance, outstanding_debt)
      VALUES ('Vendor Gamma', 'Gamma Expired', 'gamma_test_${Date.now()}@test.com', '9999990003', 'approved', 0, 0)
      RETURNING id
    `);
    const vendorCId = vC.rows[0].id;
    testVendorIds.push(vendorCId);

    await client.query(`
      INSERT INTO vendor_subscriptions (vendor_id, plan_id, plan_name, months, amount, payment_id, starts_at, expires_at, status, features)
      VALUES ($1, $2, 'Test Plan 21%', 1, 0, 'pay_test_c', NOW() - INTERVAL '60 days', NOW() - INTERVAL '30 days', 'active', '{"commission_percent": "21"}'::jsonb)
    `, [vendorCId, plan21Id]);

    // Test Vendor D (Missing / Invalid Commission Rate in Subscription)
    const vD = await client.query(`
      INSERT INTO vendors (name, store_name, email, phone, status, wallet_balance, outstanding_debt)
      VALUES ('Vendor Delta', 'Delta Invalid Rate', 'delta_test_${Date.now()}@test.com', '9999990004', 'approved', 0, 0)
      RETURNING id
    `);
    const vendorDId = vD.rows[0].id;
    testVendorIds.push(vendorDId);

    await client.query(`
      INSERT INTO vendor_subscriptions (vendor_id, plan_id, plan_name, months, amount, payment_id, starts_at, expires_at, status, features)
      VALUES ($1, $2, 'Test Plan Invalid', 1, 0, 'pay_test_d', NOW() - INTERVAL '1 day', NOW() + INTERVAL '30 days', 'active', '{"commission_percent": "invalid_number"}'::jsonb)
    `, [vendorDId, plan21Id]);

    console.log('✅ Setup complete.\n');


    // -------------------------------------------------------------------------
    // TEST 1: ₹1,000 sale at 21% commission: ₹210 commission and ₹790 vendor net
    // -------------------------------------------------------------------------
    console.log('Test 1: ₹1,000 sale at 21% commission...');
    const t1OrderNum = `TEST-ORD-1-${Date.now()}`;
    const t1Items = [{ product: { vendor_id: vendorAId }, price: 1000, qty: 1 }];

    await client.query('BEGIN');
    const t1Res = await vendorAccountingService.processOrderVendorAccounting({
      orderNumber: t1OrderNum,
      verifiedItems: t1Items,
      client
    });
    await client.query('COMMIT');

    assert.strictEqual(t1Res[vendorAId].grossAmount, 1000);
    assert.strictEqual(t1Res[vendorAId].commissionPercent, 21);
    assert.strictEqual(t1Res[vendorAId].commissionAmount, 210);
    assert.strictEqual(t1Res[vendorAId].netEarnings, 790);
    assert.strictEqual(t1Res[vendorAId].netCreditToWallet, 790);

    const vACheck1 = await client.query('SELECT wallet_balance FROM vendors WHERE id = $1', [vendorAId]);
    assert.strictEqual(parseFloat(vACheck1.rows[0].wallet_balance), 790.00);

    const txCheck1 = await client.query('SELECT * FROM vendor_transactions WHERE order_number = $1', [t1OrderNum]);
    assert.strictEqual(txCheck1.rows.length, 1);
    assert.strictEqual(parseFloat(txCheck1.rows[0].amount), 790.00);
    assert.strictEqual(parseFloat(txCheck1.rows[0].gross_amount), 1000.00);
    assert.strictEqual(parseFloat(txCheck1.rows[0].commission_percent), 21.00);
    assert.strictEqual(parseFloat(txCheck1.rows[0].commission_amount), 210.00);
    assert.strictEqual(parseFloat(txCheck1.rows[0].net_amount), 790.00);

    console.log('  ✅ PASS: ₹1,000 @ 21% gives ₹210 commission and ₹790 vendor net.');
    passedCount++;


    // -------------------------------------------------------------------------
    // TEST 2: ₹1,000 sale at 0.20% commission: ₹2 commission and ₹998 vendor net
    // -------------------------------------------------------------------------
    console.log('Test 2: ₹1,000 sale at 0.20% commission...');
    const t2OrderNum = `TEST-ORD-2-${Date.now()}`;
    const t2Items = [{ product: { vendor_id: vendorBId }, price: 1000, qty: 1 }];

    await client.query('BEGIN');
    const t2Res = await vendorAccountingService.processOrderVendorAccounting({
      orderNumber: t2OrderNum,
      verifiedItems: t2Items,
      client
    });
    await client.query('COMMIT');

    assert.strictEqual(t2Res[vendorBId].grossAmount, 1000);
    assert.strictEqual(t2Res[vendorBId].commissionPercent, 0.20);
    assert.strictEqual(t2Res[vendorBId].commissionAmount, 2);
    assert.strictEqual(t2Res[vendorBId].netEarnings, 998);
    assert.strictEqual(t2Res[vendorBId].netCreditToWallet, 998);

    const vBCheck2 = await client.query('SELECT wallet_balance FROM vendors WHERE id = $1', [vendorBId]);
    assert.strictEqual(parseFloat(vBCheck2.rows[0].wallet_balance), 998.00);

    console.log('  ✅ PASS: ₹1,000 @ 0.20% gives ₹2 commission and ₹998 vendor net.');
    passedCount++;


    // -------------------------------------------------------------------------
    // TEST 3: Correct two-decimal rounding
    // -------------------------------------------------------------------------
    console.log('Test 3: Correct two-decimal rounding...');
    // ₹499.00 sale at 21%: 499 * 0.21 = 104.79 commission, net = 394.21
    const t3Calc1 = vendorAccountingService.calculateVendorEarnings([{ price: 499, qty: 1 }], 21);
    assert.strictEqual(t3Calc1.grossAmount, 499);
    assert.strictEqual(t3Calc1.commissionAmount, 104.79);
    assert.strictEqual(t3Calc1.netEarnings, 394.21);

    // ₹333.33 sale at 15.5%: 333.33 * 0.155 = 51.66615 -> rounded to 51.67 commission, net = 281.66
    const t3Calc2 = vendorAccountingService.calculateVendorEarnings([{ price: 333.33, qty: 1 }], 15.5);
    assert.strictEqual(t3Calc2.grossAmount, 333.33);
    assert.strictEqual(t3Calc2.commissionAmount, 51.67);
    assert.strictEqual(t3Calc2.netEarnings, 281.66);

    console.log('  ✅ PASS: Two-decimal financial rounding verified accurately.');
    passedCount++;


    // -------------------------------------------------------------------------
    // TEST 4: Multi-vendor orders using each vendor's applicable subscription rate
    // -------------------------------------------------------------------------
    console.log('Test 4: Multi-vendor order (Vendor A @ 21% + Vendor B @ 0.20%)...');
    const t4OrderNum = `TEST-ORD-4-${Date.now()}`;
    const t4Items = [
      { product: { vendor_id: vendorAId }, price: 500, qty: 2 }, // ₹1,000 for Vendor A
      { product: { vendor_id: vendorBId }, price: 200, qty: 5 }, // ₹1,000 for Vendor B
    ];

    await client.query('BEGIN');
    const t4Res = await vendorAccountingService.processOrderVendorAccounting({
      orderNumber: t4OrderNum,
      verifiedItems: t4Items,
      client
    });
    await client.query('COMMIT');

    // Vendor A: 1000 @ 21% -> 210 comm, 790 net
    assert.strictEqual(t4Res[vendorAId].commissionPercent, 21);
    assert.strictEqual(t4Res[vendorAId].commissionAmount, 210);
    assert.strictEqual(t4Res[vendorAId].netEarnings, 790);

    // Vendor B: 1000 @ 0.20% -> 2 comm, 998 net
    assert.strictEqual(t4Res[vendorBId].commissionPercent, 0.20);
    assert.strictEqual(t4Res[vendorBId].commissionAmount, 2);
    assert.strictEqual(t4Res[vendorBId].netEarnings, 998);

    console.log('  ✅ PASS: Multi-vendor order applied individual subscription commission rates.');
    passedCount++;


    // -------------------------------------------------------------------------
    // TEST 5: Plan rate changes affecting renewed subscriptions, but NOT existing
    // -------------------------------------------------------------------------
    console.log('Test 5: Plan rate changes affecting renewals but not existing subscriptions...');
    // Create new plan with 10%
    const p5 = await client.query(`
      INSERT INTO subscription_plans (name, price, months, is_active, features)
      VALUES ('Dynamic Plan', 500, 1, true, '{"commission_percent": "10"}'::jsonb)
      RETURNING id
    `);
    const dynamicPlanId = p5.rows[0].id;
    testPlanIds.push(dynamicPlanId);

    const vE = await client.query(`
      INSERT INTO vendors (name, store_name, email, phone, status, wallet_balance, outstanding_debt)
      VALUES ('Vendor Epsilon', 'Epsilon Store', 'epsilon_test_${Date.now()}@test.com', '9999990005', 'approved', 0, 0)
      RETURNING id
    `);
    const vendorEId = vE.rows[0].id;
    testVendorIds.push(vendorEId);

    // Initial subscription captures 10%
    await client.query(`
      INSERT INTO vendor_subscriptions (vendor_id, plan_id, plan_name, months, amount, payment_id, starts_at, expires_at, status, features)
      VALUES ($1, $2, 'Dynamic Plan', 1, 500, 'pay_test_e1', NOW() - INTERVAL '1 day', NOW() + INTERVAL '30 days', 'active', '{"commission_percent": "10"}'::jsonb)
    `, [vendorEId, dynamicPlanId]);

    // Admin updates plan to 15%
    await client.query(`
      UPDATE subscription_plans SET features = '{"commission_percent": "15"}'::jsonb WHERE id = $1
    `, [dynamicPlanId]);

    // Existing active subscription must still be 10%
    const rateBeforeRenewal = await vendorAccountingService.getVendorActiveCommissionRate(vendorEId, client);
    assert.strictEqual(rateBeforeRenewal.commissionPercent, 10, 'Existing subscription must retain agreed 10%');

    // Vendor renews under the new plan -> now captures 15%
    await client.query(`
      INSERT INTO vendor_subscriptions (vendor_id, plan_id, plan_name, months, amount, payment_id, starts_at, expires_at, status, features)
      VALUES ($1, $2, 'Dynamic Plan', 1, 500, 'pay_test_e2', NOW(), NOW() + INTERVAL '30 days', 'active', '{"commission_percent": "15"}'::jsonb)
    `, [vendorEId, dynamicPlanId]);

    const rateAfterRenewal = await vendorAccountingService.getVendorActiveCommissionRate(vendorEId, client);
    assert.strictEqual(rateAfterRenewal.commissionPercent, 15, 'Renewed subscription captures updated 15%');

    console.log('  ✅ PASS: Existing subscription retained 10%; renewal captured updated 15%.');
    passedCount++;


    // -------------------------------------------------------------------------
    // TEST 6: Expired subscriptions and missing/invalid rates being rejected safely
    // -------------------------------------------------------------------------
    console.log('Test 6: Expired subscriptions and invalid rates rejected safely...');
    // Vendor C has expired subscription
    let expiredRejected = false;
    try {
      await vendorAccountingService.getVendorActiveCommissionRate(vendorCId, client);
    } catch (err) {
      expiredRejected = true;
      assert(err.message.includes('subscription'), `Expected subscription error but got: ${err.message}`);
    }
    assert.strictEqual(expiredRejected, true, 'Expired subscription must throw error');

    // Vendor D has invalid commission rate
    let invalidRateRejected = false;
    try {
      await vendorAccountingService.getVendorActiveCommissionRate(vendorDId, client);
    } catch (err) {
      invalidRateRejected = true;
      assert(err.message.includes('commission rate'), `Expected commission rate error but got: ${err.message}`);
    }
    assert.strictEqual(invalidRateRejected, true, 'Invalid commission rate must throw error');

    console.log('  ✅ PASS: Expired subscriptions and invalid rates safely rejected without silent fallbacks.');
    passedCount++;


    // -------------------------------------------------------------------------
    // TEST 7: Both guest and logged-in checkout use identical accounting service
    // -------------------------------------------------------------------------
    console.log('Test 7: Verify single shared accounting service is integrated in both routes...');
    const authCode = require('fs').readFileSync('369be/routes/auth.js', 'utf8');
    const genCode = require('fs').readFileSync('369be/routes/general.js', 'utf8');

    assert(authCode.includes('vendorAccountingService.processOrderVendorAccounting'), 'auth.js must call vendorAccountingService');
    assert(genCode.includes('vendorAccountingService.processOrderVendorAccounting'), 'general.js must call vendorAccountingService');
    assert(!authCode.includes('vendorData[vid].total += amt'), 'Legacy gross addition removed from auth.js');
    assert(!genCode.includes('vendorData[vid].total += amt'), 'Legacy gross addition removed from general.js');

    console.log('  ✅ PASS: Shared vendorAccountingService verified in both auth.js and general.js.');
    passedCount++;


    // -------------------------------------------------------------------------
    // TEST 8: Duplicate order requests not creating duplicate credits
    // -------------------------------------------------------------------------
    console.log('Test 8: Duplicate order requests idempotency protection...');
    const t8OrderNum = `TEST-ORD-8-${Date.now()}`;
    const t8Items = [{ product: { vendor_id: vendorAId }, price: 500, qty: 1 }];

    await client.query('BEGIN');
    await vendorAccountingService.processOrderVendorAccounting({
      orderNumber: t8OrderNum,
      verifiedItems: t8Items,
      client
    });
    await client.query('COMMIT');

    // Attempt duplicate credit with same orderNumber and vendor_id
    let duplicateRejected = false;
    try {
      await client.query('BEGIN');
      await vendorAccountingService.processOrderVendorAccounting({
        orderNumber: t8OrderNum,
        verifiedItems: t8Items,
        client
      });
      await client.query('COMMIT');
    } catch (dupErr) {
      await client.query('ROLLBACK');
      duplicateRejected = true;
      assert.strictEqual(dupErr.code, '23505', 'Database must reject duplicate credit via unique constraint');
    }
    assert.strictEqual(duplicateRejected, true, 'Duplicate order credit must be rejected');

    console.log('  ✅ PASS: Unique index uq_vendor_tx_order_credit prevented duplicate credit.');
    passedCount++;


    // -------------------------------------------------------------------------
    // TEST 9: Cancellation before payout reversing the correct net earnings
    // -------------------------------------------------------------------------
    console.log('Test 9: Cancellation before payout reversing net earnings...');
    const t9OrderNum = `TEST-ORD-9-${Date.now()}`;
    const t9Items = [{ product: { vendor_id: vendorAId }, price: 1000, qty: 1 }];

    // Record wallet balance before order
    const vABefore = await client.query('SELECT wallet_balance FROM vendors WHERE id = $1', [vendorAId]);
    const balanceBeforeT9 = parseFloat(vABefore.rows[0].wallet_balance);

    // Place order: adds ₹790 net
    await client.query('BEGIN');
    await vendorAccountingService.processOrderVendorAccounting({
      orderNumber: t9OrderNum,
      verifiedItems: t9Items,
      client
    });
    await client.query('COMMIT');

    // Cancel order before payout
    await client.query('BEGIN');
    const revResult9 = await vendorAccountingService.reverseVendorOrderCredit({
      vendorId: vendorAId,
      orderNumber: t9OrderNum,
      reason: 'Customer cancelled before payout',
      client
    });
    await client.query('COMMIT');

    assert.strictEqual(revResult9.success, true);
    assert.strictEqual(revResult9.reversed, true);
    assert.strictEqual(revResult9.netToReverse, 790);
    assert.strictEqual(revResult9.recoveredFromWallet, 790);
    assert.strictEqual(revResult9.addedToDebt, 0);

    const vAAfter = await client.query('SELECT wallet_balance, outstanding_debt FROM vendors WHERE id = $1', [vendorAId]);
    assert.strictEqual(parseFloat(vAAfter.rows[0].wallet_balance), balanceBeforeT9, 'Balance restored to before order');
    assert.strictEqual(parseFloat(vAAfter.rows[0].outstanding_debt), 0, 'No debt created when balance was sufficient');

    console.log('  ✅ PASS: Full ₹790 net reversed from wallet before payout without creating debt.');
    passedCount++;


    // -------------------------------------------------------------------------
    // TEST 10: Cancellation after payout recording debt and recovering from future earnings
    // -------------------------------------------------------------------------
    console.log('Test 10: Cancellation after payout recording debt and future recovery...');
    const t10OrderNum1 = `TEST-ORD-10A-${Date.now()}`;
    const t10Items1 = [{ product: { vendor_id: vendorAId }, price: 1000, qty: 1 }];

    // Place order: earns ₹790 net
    await client.query('BEGIN');
    await vendorAccountingService.processOrderVendorAccounting({
      orderNumber: t10OrderNum1,
      verifiedItems: t10Items1,
      client
    });
    await client.query('COMMIT');

    // Simulate Admin Payout: vendor withdraws all funds in wallet down to 0
    await client.query('UPDATE vendors SET wallet_balance = 0 WHERE id = $1', [vendorAId]);

    // Order 10A is now cancelled after payout
    await client.query('BEGIN');
    const revResult10 = await vendorAccountingService.reverseVendorOrderCredit({
      vendorId: vendorAId,
      orderNumber: t10OrderNum1,
      reason: 'Order cancelled after vendor payout',
      client
    });
    await client.query('COMMIT');

    assert.strictEqual(revResult10.reversed, true);
    assert.strictEqual(revResult10.netToReverse, 790);
    assert.strictEqual(revResult10.recoveredFromWallet, 0);
    assert.strictEqual(revResult10.addedToDebt, 790);

    const vADebtCheck = await client.query('SELECT wallet_balance, outstanding_debt FROM vendors WHERE id = $1', [vendorAId]);
    assert.strictEqual(parseFloat(vADebtCheck.rows[0].wallet_balance), 0);
    assert.strictEqual(parseFloat(vADebtCheck.rows[0].outstanding_debt), 790);

    // Next sale comes in: vendor sells ₹1,000 (net earnings = ₹790)
    const t10OrderNum2 = `TEST-ORD-10B-${Date.now()}`;
    const t10Items2 = [{ product: { vendor_id: vendorAId }, price: 1000, qty: 1 }];

    await client.query('BEGIN');
    const t10Res2 = await vendorAccountingService.processOrderVendorAccounting({
      orderNumber: t10OrderNum2,
      verifiedItems: t10Items2,
      client
    });
    await client.query('COMMIT');

    // Debt recovery should recover the ₹790 debt, resulting in ₹0 wallet credit and ₹0 remaining debt
    assert.strictEqual(t10Res2[vendorAId].debtRecovered, 790);
    assert.strictEqual(t10Res2[vendorAId].netCreditToWallet, 0);
    assert.strictEqual(t10Res2[vendorAId].remainingDebt, 0);

    const vASettledCheck = await client.query('SELECT wallet_balance, outstanding_debt FROM vendors WHERE id = $1', [vendorAId]);
    assert.strictEqual(parseFloat(vASettledCheck.rows[0].outstanding_debt), 0, 'Debt fully settled');
    assert.strictEqual(parseFloat(vASettledCheck.rows[0].wallet_balance), 0, 'Wallet balance reflects deduction');

    console.log('  ✅ PASS: Unrecovered ₹790 safely recorded as debt and recovered from next sale.');
    passedCount++;


    // -------------------------------------------------------------------------
    // TEST 11: Repeated cancellations or recoveries not creating duplicate entries
    // -------------------------------------------------------------------------
    console.log('Test 11: Idempotency of repeated cancellation calls...');
    await client.query('BEGIN');
    const repeatRev = await vendorAccountingService.reverseVendorOrderCredit({
      vendorId: vendorAId,
      orderNumber: t10OrderNum1, // Already reversed in Test 10
      reason: 'Repeated cancellation click',
      client
    });
    await client.query('COMMIT');

    assert.strictEqual(repeatRev.reversed, false);
    assert.strictEqual(repeatRev.alreadyReversed, true);

    const revTxCount = await client.query(
      'SELECT COUNT(*) FROM vendor_transactions WHERE vendor_id = $1 AND order_number = $2 AND type = $3',
      [vendorAId, t10OrderNum1, 'reversal']
    );
    assert.strictEqual(parseInt(revTxCount.rows[0].count, 10), 1, 'Exactly one reversal transaction must exist');

    console.log('  ✅ PASS: Repeated cancellation was ignored idempotently; no duplicate reversal logged.');
    passedCount++;


    // -------------------------------------------------------------------------
    // TEST 12: Existing wallet balances, historical transactions and payouts untouched
    // -------------------------------------------------------------------------
    console.log('Test 12: Historical vendor data integrity check...');
    // Vendor 1 (Beautifull Store)
    const v1Res = await client.query('SELECT wallet_balance FROM vendors WHERE id = 1');
    assert.strictEqual(parseFloat(v1Res.rows[0].wallet_balance), 3959.00, 'Vendor 1 balance must remain ₹3,959.00');

    const v1TxRes = await client.query('SELECT COUNT(*) FROM vendor_transactions WHERE vendor_id = 1');
    assert.strictEqual(parseInt(v1TxRes.rows[0].count, 10), 2, 'Vendor 1 must retain exactly 2 historical transactions');

    // Vendor 4 (mobiles)
    const v4Res = await client.query('SELECT wallet_balance FROM vendors WHERE id = 4');
    assert.strictEqual(parseFloat(v4Res.rows[0].wallet_balance), 10009.94, 'Vendor 4 balance must remain ₹10,009.94');

    const v4TxRes = await client.query('SELECT COUNT(*) FROM vendor_transactions WHERE vendor_id = 4');
    assert.strictEqual(parseInt(v4TxRes.rows[0].count, 10), 6, 'Vendor 4 must retain exactly 6 historical transactions');

    console.log('  ✅ PASS: Historical balances and transactions remain completely untouched.');
    passedCount++;

  } catch (testErr) {
    console.error('\n❌ TEST FAILED:', testErr);
    throw testErr;
  } finally {
    // -------------------------------------------------------------------------
    // CLEANUP: Clean up test vendor data only
    // -------------------------------------------------------------------------
    console.log('\n--- Cleaning up test records ---');
    try {
      if (testVendorIds.length > 0) {
        await client.query('DELETE FROM vendor_transactions WHERE vendor_id = ANY($1)', [testVendorIds]);
        await client.query('DELETE FROM vendor_subscriptions WHERE vendor_id = ANY($1)', [testVendorIds]);
        await client.query('DELETE FROM vendors WHERE id = ANY($1)', [testVendorIds]);
      }
      if (testPlanIds.length > 0) {
        await client.query('DELETE FROM subscription_plans WHERE id = ANY($1)', [testPlanIds]);
      }
      console.log('✅ Test artifacts cleaned up safely.');
    } catch (cleanupErr) {
      console.warn('Cleanup warning:', cleanupErr.message);
    }
    client.release();
    await pool.end();
  }

  console.log('\n====================================================');
  console.log(`  ALL ${passedCount}/12 TESTS PASSED SUCCESSFULLY! `);
  console.log('====================================================\n');
}

runAllTests().catch(err => {
  console.error(err);
  process.exit(1);
});

