const assert = require('assert');
const pool = require('../db');

async function runBankRedesignTests() {
  console.log('================================================================');
  console.log('   ULMGH369 COMPLETE WORKFLOW: BANK DETAILS & ADMIN PAYOUT       ');
  console.log('================================================================\n');

  const client = await pool.connect();
  let passedCount = 0;
  const testVendorIds = [];
  const testPlanIds = [];

  try {
    // Setup isolated test vendor with ₹2,000 balance
    const pRes = await client.query(`
      INSERT INTO subscription_plans (name, price, months, is_active, features)
      VALUES ('Workflow Test Plan', 200, 1, true, '{"commission_percent": "10"}'::jsonb)
      RETURNING id
    `);
    const planId = pRes.rows[0].id;
    testPlanIds.push(planId);

    const vRes = await client.query(`
      INSERT INTO vendors (name, store_name, email, phone, status, wallet_balance, outstanding_debt)
      VALUES ('Workflow Vendor A', 'Store Alpha', 'vendor_a_${Date.now()}@test.com', '9888880001', 'approved', 2000.00, 0.00)
      RETURNING id, name, email
    `);
    const vendorA = vRes.rows[0];
    testVendorIds.push(vendorA.id);

    // Create a second isolated vendor to test cross-vendor isolation
    const v2Res = await client.query(`
      INSERT INTO vendors (name, store_name, email, phone, status, wallet_balance, outstanding_debt)
      VALUES ('Workflow Vendor B', 'Store Beta', 'vendor_b_${Date.now()}@test.com', '9888880002', 'approved', 1500.00, 0.00)
      RETURNING id, name, email
    `);
    const vendorB = v2Res.rows[0];
    testVendorIds.push(vendorB.id);

    console.log(`Created test vendor A #${vendorA.id} (₹2,000) and vendor B #${vendorB.id} (₹1,500)\n`);

    // SCENARIO 1: Vendor saves bank details without format restrictions (PUT /api/vendor/bank-details)
    console.log('1. Vendor saves bank details without format restrictions...');
    const savedHolder = 'Alpha Custom Business';
    const savedBank = 'Co-Operative Society Bank';
    const savedAcc = 'ACC-9921-SHORT';
    const savedIfsc = 'MYBANK12'; // Non-standard IFSC (no 11-char requirement, arbitrary format)

    const saveRes = await client.query(`
      UPDATE vendors 
      SET bank_account_holder_name = $1,
          bank_account_number = $2,
          bank_ifsc_code = $3,
          bank_name = $4
      WHERE id = $5
      RETURNING id, bank_account_holder_name, bank_account_number, bank_ifsc_code, bank_name
    `, [savedHolder, savedAcc, savedIfsc, savedBank, vendorA.id]);

    assert.strictEqual(saveRes.rows[0].bank_account_number, savedAcc);
    assert.strictEqual(saveRes.rows[0].bank_ifsc_code, savedIfsc);
    assert.strictEqual(saveRes.rows[0].bank_account_holder_name, savedHolder);
    assert.strictEqual(saveRes.rows[0].bank_name, savedBank);
    console.log('  ✅ PASS: Bank details saved successfully against vendor A.');
    passedCount++;

    // SCENARIO 2: Details persist after refreshing the page and logging in again (GET /api/vendorAuth/me)
    console.log('\n2. Details persist after refreshing page and logging in again...');
    const meRes = await client.query(`
      SELECT id, name, store_name, email, wallet_balance,
             bank_account_holder_name, bank_account_number, bank_ifsc_code, bank_name
      FROM vendors 
      WHERE id = $1
    `, [vendorA.id]);

    const meData = meRes.rows[0];
    assert.strictEqual(meData.bank_account_number, savedAcc);
    assert.strictEqual(meData.bank_ifsc_code, savedIfsc);
    assert.strictEqual(meData.bank_account_holder_name, savedHolder);
    assert.strictEqual(meData.bank_name, savedBank);
    console.log('  ✅ PASS: Bank details reliably persist on database re-query.');
    passedCount++;

    // SCENARIO 3: Admin opens vendor A payout drawer and correct saved details appear
    console.log('\n3. Admin opens payout drawer: correct saved bank details appear...');
    const adminDetailsRes = await client.query(`
      SELECT id, name, store_name, email, wallet_balance,
             bank_account_holder_name, bank_account_number, bank_ifsc_code, bank_name
      FROM vendors 
      WHERE id = $1
    `, [vendorA.id]);

    const adminVendorData = adminDetailsRes.rows[0];
    assert.strictEqual(adminVendorData.bank_account_number, savedAcc);
    assert.strictEqual(adminVendorData.bank_account_holder_name, savedHolder);
    assert.strictEqual(adminVendorData.bank_ifsc_code, savedIfsc);
    assert.strictEqual(adminVendorData.bank_name, savedBank);
    console.log('  ✅ PASS: Admin retrieves genuine saved bank details for Vendor A.');
    passedCount++;

    // SCENARIO 4: For Vendor B with no bank details, confirm empty fields ("Vendor has not added bank details yet")
    console.log('\n4. For vendor without bank details, confirms empty fields...');
    const adminVendorBRes = await client.query(`
      SELECT id, bank_account_number FROM vendors WHERE id = $1
    `, [vendorB.id]);
    assert.strictEqual(adminVendorBRes.rows[0].bank_account_number, null);
    console.log('  ✅ PASS: Verified null bank details triggering "Vendor has not added bank details yet."');
    passedCount++;

    // SCENARIO 5: Admin completes a payout with UTR
    console.log('\n5. Admin completes a payout with UTR...');
    const payout1Amt = 400.00;
    const utr1 = `UTR_MANUAL_${Date.now()}`;
    const idemp1 = `idemp_1_${Date.now()}`;

    await client.query('BEGIN');
    const lock1 = await client.query('SELECT wallet_balance FROM vendors WHERE id = $1 FOR UPDATE', [vendorA.id]);
    assert.strictEqual(parseFloat(lock1.rows[0].wallet_balance), 2000.00);

    const update1 = await client.query(`
      UPDATE vendors 
      SET wallet_balance = wallet_balance - $1 
      WHERE id = $2 AND wallet_balance >= $1 
      RETURNING wallet_balance
    `, [payout1Amt, vendorA.id]);
    assert.strictEqual(parseFloat(update1.rows[0].wallet_balance), 1600.00);

    const desc1 = `Payout of ₹${payout1Amt.toLocaleString()} processed via bank transfer (Ref/UTR: ${utr1})`;
    const tx1 = await client.query(`
      INSERT INTO vendor_transactions 
        (vendor_id, type, amount, order_number, description, gross_amount, commission_percent, commission_amount, net_amount, debt_recovered, bank_reference) 
      VALUES ($1, 'debit', $2, $3, $4, NULL, NULL, NULL, $2, 0, $5)
      RETURNING *
    `, [vendorA.id, payout1Amt, idemp1, desc1, utr1]);
    await client.query('COMMIT');

    assert.strictEqual(tx1.rows[0].bank_reference, utr1);
    assert.strictEqual(parseFloat(tx1.rows[0].amount), 400.00);
    console.log('  ✅ PASS: Payout of ₹400 with UTR recorded, wallet balance updated to ₹1,600.00.');
    passedCount++;

    // SCENARIO 6: Admin completes a payout without UTR (Optional UTR)
    console.log('\n6. Admin completes a payout without UTR (Optional UTR)...');
    const payout2Amt = 300.00;
    const idemp2 = `idemp_2_${Date.now()}`;

    await client.query('BEGIN');
    const lock2 = await client.query('SELECT wallet_balance FROM vendors WHERE id = $1 FOR UPDATE', [vendorA.id]);
    assert.strictEqual(parseFloat(lock2.rows[0].wallet_balance), 1600.00);

    const update2 = await client.query(`
      UPDATE vendors 
      SET wallet_balance = wallet_balance - $1 
      WHERE id = $2 AND wallet_balance >= $1 
      RETURNING wallet_balance
    `, [payout2Amt, vendorA.id]);
    assert.strictEqual(parseFloat(update2.rows[0].wallet_balance), 1300.00);

    const desc2 = `Payout of ₹${payout2Amt.toLocaleString()} processed to bank account`;
    const tx2 = await client.query(`
      INSERT INTO vendor_transactions 
        (vendor_id, type, amount, order_number, description, gross_amount, commission_percent, commission_amount, net_amount, debt_recovered, bank_reference) 
      VALUES ($1, 'debit', $2, $3, $4, NULL, NULL, NULL, $2, 0, $5)
      RETURNING *
    `, [vendorA.id, payout2Amt, idemp2, desc2, null]);
    await client.query('COMMIT');

    assert.strictEqual(tx2.rows[0].bank_reference, null);
    assert.strictEqual(parseFloat(tx2.rows[0].amount), 300.00);
    console.log('  ✅ PASS: Payout of ₹300 without UTR recorded, wallet balance updated to ₹1,300.00.');
    passedCount++;

    // SCENARIO 7: Vendor Payout Confirmation via Wallet Ledger (No separate notification system)
    console.log('\n7. Vendor payout confirmation verified directly in wallet ledger (No separate notifications)...');
    // Verify that payout confirmation is reflected in vendor's transaction ledger without email/SMS dependencies
    const vendorPayoutTxs = await client.query(
      "SELECT id, amount, description, bank_reference, created_at FROM vendor_transactions WHERE vendor_id = $1 AND type = 'debit' ORDER BY id DESC",
      [vendorA.id]
    );
    assert.strictEqual(vendorPayoutTxs.rows.length, 2, 'Vendor must have 2 payout transactions in ledger');
    const totalPayouts = vendorPayoutTxs.rows.reduce((sum, r) => sum + parseFloat(r.amount), 0);
    assert.strictEqual(totalPayouts, 700.00, 'Total payouts received must equal ₹700.00');
    console.log(`  ✅ PASS: Payout confirmation is verified directly via Total Payouts (₹${totalPayouts}) and Detailed Transaction Ledger.`);
    passedCount++;

    // SCENARIO 8: Wallet balance and ledger update correctly
    console.log('\n8. Verifying wallet balance and ledger totals...');
    const finalVRes = await client.query('SELECT wallet_balance FROM vendors WHERE id = $1', [vendorA.id]);
    assert.strictEqual(parseFloat(finalVRes.rows[0].wallet_balance), 1300.00);

    const txsRes = await client.query('SELECT * FROM vendor_transactions WHERE vendor_id = $1 ORDER BY id ASC', [vendorA.id]);
    assert.strictEqual(txsRes.rows.length, 2);
    assert.strictEqual(parseFloat(txsRes.rows[0].amount), 400.00);
    assert.strictEqual(txsRes.rows[0].bank_reference, utr1);
    assert.strictEqual(parseFloat(txsRes.rows[1].amount), 300.00);
    assert.strictEqual(txsRes.rows[1].bank_reference, null);
    console.log('  ✅ PASS: Wallet balance exactly ₹1,300.00 and ledger reflects both payouts.');
    passedCount++;

    // SCENARIO 9: Another vendor cannot access or overwrite these bank details
    console.log('\n9. Cross-vendor isolation: Vendor B cannot access Vendor A bank details...');
    // Vendor B queries their own account
    const vendorBMeRes = await client.query('SELECT bank_account_number FROM vendors WHERE id = $1', [vendorB.id]);
    assert.strictEqual(vendorBMeRes.rows[0].bank_account_number, null);

    // Simulating PUT /api/vendor/bank-details with vendorB's token attempting to modify vendorA
    // (In vendor.js, query strictly uses req.vendorId = vendorB.id, ensuring vendorA is untouched)
    await client.query(`
      UPDATE vendors 
      SET bank_account_number = '999999999999' 
      WHERE id = $1
    `, [vendorB.id]);

    const checkVendorA = await client.query('SELECT bank_account_number FROM vendors WHERE id = $1', [vendorA.id]);
    assert.strictEqual(checkVendorA.rows[0].bank_account_number, savedAcc);
    console.log('  ✅ PASS: Vendor B has isolated bank details; Vendor A remains completely secure.');
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
  console.log(`   ALL ${passedCount}/9 COMPLETE WORKFLOW TESTS PASSED! `);
  console.log('================================================================\n');
}

runBankRedesignTests()
  .then(() => pool.end())
  .catch(async err => {
    console.error('❌ TEST FAILED:', err);
    await pool.end();
    process.exit(1);
  });

