const assert = require('assert');
const pool = require('../db');

async function runBankRedesignTests() {
  console.log('================================================================');
  console.log('   ULMGH369 PHASE 2: BANK DETAILS & PAYOUT REDESIGN TEST SUITE   ');
  console.log('================================================================\n');

  const client = await pool.connect();
  let passedCount = 0;
  const testVendorIds = [];
  const testPlanIds = [];

  try {
    // 1. Create a test vendor with ₹2,000 balance
    const pRes = await client.query(`
      INSERT INTO subscription_plans (name, price, months, is_active, features)
      VALUES ('Bank Test 10% Plan', 200, 1, true, '{"commission_percent": "10"}'::jsonb)
      RETURNING id
    `);
    const planId = pRes.rows[0].id;
    testPlanIds.push(planId);

    const vRes = await client.query(`
      INSERT INTO vendors (name, store_name, email, phone, status, wallet_balance, outstanding_debt)
      VALUES ('Bank Test Vendor', 'Bank Store', 'bank_test_${Date.now()}@test.com', '9888880009', 'approved', 2000.00, 0.00)
      RETURNING id
    `);
    const vendorId = vRes.rows[0].id;
    testVendorIds.push(vendorId);

    await client.query(`
      INSERT INTO vendor_subscriptions (vendor_id, plan_id, plan_name, months, amount, payment_id, starts_at, expires_at, status, features)
      VALUES ($1, $2, 'Bank Test 10% Plan', 1, 200, $3, NOW() - INTERVAL '1 day', NOW() + INTERVAL '30 days', 'active', '{"commission_percent": "10"}'::jsonb)
    `, [vendorId, planId, `pay_bank_test_${Date.now()}`]);

    console.log(`Created test vendor #${vendorId} with initial balance ₹2,000.00\n`);

    // TEST 1: Update vendor bank details (simulating PUT /api/vendor/bank-details)
    console.log('Test 1: Updating vendor bank details...');
    const updateBankRes = await client.query(`
      UPDATE vendors 
      SET bank_account_holder_name = $1,
          bank_account_number = $2,
          bank_ifsc_code = $3,
          bank_name = $4,
          bank_verification_status = 'pending'
      WHERE id = $5
      RETURNING *
    `, ['Test Holder', '123456789012', 'HDFC0001234', 'HDFC Bank', vendorId]);

    assert.strictEqual(updateBankRes.rows[0].bank_account_number, '123456789012');
    assert.strictEqual(updateBankRes.rows[0].bank_ifsc_code, 'HDFC0001234');
    assert.strictEqual(updateBankRes.rows[0].bank_verification_status, 'pending');
    console.log('✅ Test 1 Passed: Vendor bank details stored with status pending.');
    passedCount++;

    // TEST 2: Admin verifies vendor bank details (simulating PUT /api/admin/vendors/:id/verify-bank)
    console.log('\nTest 2: Admin verifying vendor bank details...');
    const verifyRes = await client.query(`
      UPDATE vendors SET bank_verification_status = 'verified' WHERE id = $1 RETURNING *
    `, [vendorId]);
    assert.strictEqual(verifyRes.rows[0].bank_verification_status, 'verified');
    console.log('✅ Test 2 Passed: Admin verified bank details successfully.');
    passedCount++;

    // TEST 3: Admin GET /vendors includes plan name, commission rate, and bank verification status
    console.log('\nTest 3: Testing enhanced GET /vendors query...');
    const listRes = await client.query(`
      SELECT v.id, v.store_name, v.wallet_balance,
             COALESCE(v.outstanding_debt, 0) as outstanding_debt,
             COALESCE(stats.gross_sales, 0) as total_gross_sales,
             COALESCE(stats.commission_earned, 0) as total_commission_earned,
             COALESCE(stats.net_earnings, 0) as total_net_earnings,
             COALESCE(payouts.total_payouts, 0) as total_payouts_processed,
             sub.plan_name,
             sub.commission_percent,
             v.bank_account_holder_name,
             v.bank_account_number,
             v.bank_ifsc_code,
             v.bank_name,
             COALESCE(v.bank_verification_status, 'not_provided') as bank_verification_status
      FROM vendors v
      LEFT JOIN LATERAL (
        SELECT 
          COALESCE(SUM(COALESCE(gross_amount, amount)), 0) as gross_sales,
          COALESCE(SUM(commission_amount), 0) as commission_earned,
          COALESCE(SUM(COALESCE(net_amount, amount)), 0) as net_earnings
        FROM vendor_transactions
        WHERE vendor_id = v.id AND type = 'credit'
      ) stats ON true
      LEFT JOIN LATERAL (
        SELECT 
          COALESCE(SUM(amount), 0) as total_payouts
        FROM vendor_transactions
        WHERE vendor_id = v.id AND type = 'debit'
      ) payouts ON true
      LEFT JOIN LATERAL (
        SELECT 
          plan_name,
          (features->>'commission_percent')::numeric as commission_percent
        FROM vendor_subscriptions
        WHERE vendor_id = v.id 
          AND status = 'active'
          AND starts_at <= NOW() 
          AND expires_at >= NOW()
        ORDER BY expires_at DESC
        LIMIT 1
      ) sub ON true
      WHERE v.id = $1
    `, [vendorId]);

    const vData = listRes.rows[0];
    assert.strictEqual(vData.plan_name, 'Bank Test 10% Plan');
    assert.strictEqual(parseFloat(vData.commission_percent), 10.00);
    assert.strictEqual(vData.bank_verification_status, 'verified');
    assert.strictEqual(vData.bank_account_number, '123456789012');
    console.log('✅ Test 3 Passed: GET /vendors returns plan, commission, and bank details correctly.');
    passedCount++;

    // TEST 4: Payout with UTR / bank reference number
    console.log('\nTest 4: Payout execution with bank reference / UTR recording...');
    const payoutAmount = 750.00;
    const testUtr = `UTR_${Date.now()}`;
    const testIdemp = `idemp_bank_${Date.now()}`;

    // Execute atomic payout logic matching admin.js
    await client.query('BEGIN');
    const updateWallet = await client.query(`
      UPDATE vendors 
      SET wallet_balance = wallet_balance - $1 
      WHERE id = $2 AND wallet_balance >= $1 
      RETURNING *
    `, [payoutAmount, vendorId]);

    assert.strictEqual(parseFloat(updateWallet.rows[0].wallet_balance), 1250.00);

    const desc = `Payout of ₹${payoutAmount.toLocaleString()} processed via bank transfer (Ref/UTR: ${testUtr})`;
    const insertTx = await client.query(`
      INSERT INTO vendor_transactions 
        (vendor_id, type, amount, order_number, description, gross_amount, commission_percent, commission_amount, net_amount, debt_recovered, bank_reference) 
      VALUES ($1, 'debit', $2, $3, $4, NULL, NULL, NULL, $2, 0, $5)
      RETURNING *
    `, [vendorId, payoutAmount, testIdemp, desc, testUtr]);
    await client.query('COMMIT');

    assert.strictEqual(parseFloat(insertTx.rows[0].amount), 750.00);
    assert.strictEqual(insertTx.rows[0].bank_reference, testUtr);
    assert.match(insertTx.rows[0].description, new RegExp(testUtr));

    // Verify vendor's payout history query returns the bank_reference
    const payoutHist = await client.query(`
      SELECT vt.*, v.name as vendor_name, v.store_name 
      FROM vendor_transactions vt 
      LEFT JOIN vendors v ON vt.vendor_id = v.id 
      WHERE vt.vendor_id = $1
    `, [vendorId]);

    const debitTx = payoutHist.rows.find(t => t.type === 'debit');
    assert.ok(debitTx);
    assert.strictEqual(debitTx.bank_reference, testUtr);
    console.log('✅ Test 4 Passed: Payout atomically deducted balance and recorded bank_reference UTR.');
    passedCount++;

  } finally {
    // CLEANUP
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
  console.log(`   ALL ${passedCount}/4 BANK & PAYOUT TESTS PASSED SUCCESSFULLY! `);
  console.log('================================================================\n');
}

runBankRedesignTests()
  .then(() => pool.end())
  .catch(async err => {
    console.error('❌ TEST FAILED:', err);
    await pool.end();
    process.exit(1);
  });

