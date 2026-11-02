const assert = require('assert');
const pool = require('../db');

/**
 * Simulates the backend payout execution logic directly against the database
 * with the exact same queries, locking, transactions, and validations as in POST /api/admin/vendors/:id/payout.
 */
async function executePayout({ vendorId, amount, idempotencyKey, simulateLedgerFailure = false }) {
  // 1. Amount validation
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

    // 2. Row locking
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

    // 3. Idempotency check
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

    // 4. Validate available balance
    const currentBalance = parseFloat(vendor.wallet_balance || 0);
    if (currentBalance < payoutAmount) {
      await client.query('ROLLBACK');
      const err = new Error(`Insufficient wallet balance. Available: ₹${currentBalance.toLocaleString()}, Requested: ₹${payoutAmount.toLocaleString()}`);
      err.statusCode = 400;
      throw err;
    }

    // 5. Atomic deduction with safety guard
    const updateRes = await client.query(
      'UPDATE vendors SET wallet_balance = wallet_balance - $1 WHERE id = $2 AND wallet_balance >= $1 RETURNING id, name, store_name, wallet_balance',
      [payoutAmount, vendor.id]
    );

    if (updateRes.rowCount === 0) {
      await client.query('ROLLBACK');
      const err = new Error('Insufficient wallet balance or concurrent payout conflict');
      err.statusCode = 400;
      throw err;
    }

    // Optional simulated ledger failure for rollback verification
    if (simulateLedgerFailure) {
      throw new Error('SIMULATED_LEDGER_FAILURE: Database crash during transaction insert');
    }

    // 6. Record payout in vendor_transactions
    const desc = `Payout of ₹${payoutAmount.toLocaleString()} processed to bank account`;
    await client.query(
      `INSERT INTO vendor_transactions 
         (vendor_id, type, amount, order_number, description, gross_amount, commission_percent, commission_amount, net_amount, debt_recovered) 
       VALUES ($1, 'debit', $2, $3, $4, NULL, NULL, NULL, $2, 0)`,
      [vendor.id, payoutAmount, idempotencyKey || null, desc]
    );

    await client.query('COMMIT');
    return { message: 'Payout successful', vendor: updateRes.rows[0], alreadyProcessed: false };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function runPayoutSafetyTests() {
  console.log('====================================================');
  console.log('   RUNNING PHASE 1.1 PAYOUT SAFETY TEST SUITE       ');
  console.log('====================================================\n');

  const client = await pool.connect();
  let testVendorId = null;
  let passedCount = 0;

  try {
    // -------------------------------------------------------------------------
    // TEST 6 (PRE-CHECK): Existing payout history & wallet balances baseline
    // -------------------------------------------------------------------------
    console.log('Test 6 (Baseline): Verifying existing vendor balances before tests...');
    const v1Baseline = await client.query('SELECT wallet_balance FROM vendors WHERE id = 1');
    const v1Bal = parseFloat(v1Baseline.rows[0].wallet_balance);
    assert.strictEqual(v1Bal, 3959.00, 'Vendor 1 baseline must be ₹3,959.00');

    const v4Baseline = await client.query('SELECT wallet_balance FROM vendors WHERE id = 4');
    const v4Bal = parseFloat(v4Baseline.rows[0].wallet_balance);
    assert.strictEqual(v4Bal, 0.00, 'Vendor 4 baseline must be ₹0.00');

    const totalTxBaseline = await client.query('SELECT COUNT(*) FROM vendor_transactions');
    const baselineTxCount = parseInt(totalTxBaseline.rows[0].count, 10);
    console.log(`  ℹ️ Baseline confirmed: Vendor 1 = ₹${v1Bal}, Vendor 4 = ₹${v4Bal}, Total Tx = ${baselineTxCount}`);
    console.log('  ✅ PASS: Existing historical records confirmed and protected.\n');
    passedCount++;

    // -------------------------------------------------------------------------
    // SETUP: Create isolated test vendor with ₹1,000 balance
    // -------------------------------------------------------------------------
    console.log('--- Setting up isolated test vendor with ₹1,000 balance ---');
    const testVendorRes = await client.query(`
      INSERT INTO vendors (name, store_name, email, phone, status, wallet_balance, outstanding_debt)
      VALUES ('Payout Test Vendor', 'Payout Safety Store', 'payout_test_${Date.now()}@test.com', '9999990099', 'approved', 1000.00, 0.00)
      RETURNING id, wallet_balance
    `);
    testVendorId = testVendorRes.rows[0].id;
    console.log(`✅ Test vendor created (ID: ${testVendorId}, Initial Balance: ₹${testVendorRes.rows[0].wallet_balance})\n`);


    // -------------------------------------------------------------------------
    // TEST 1: Payout within the available balance
    // -------------------------------------------------------------------------
    console.log('Test 1: Payout of ₹400 within available balance of ₹1,000...');
    const t1Res = await executePayout({
      vendorId: testVendorId,
      amount: 400.00,
      idempotencyKey: 'payout_key_t1'
    });

    assert.strictEqual(t1Res.message, 'Payout successful');
    assert.strictEqual(parseFloat(t1Res.vendor.wallet_balance), 600.00);

    const vCheck1 = await client.query('SELECT wallet_balance FROM vendors WHERE id = $1', [testVendorId]);
    assert.strictEqual(parseFloat(vCheck1.rows[0].wallet_balance), 600.00);

    const txCheck1 = await client.query('SELECT * FROM vendor_transactions WHERE vendor_id = $1 AND order_number = $2', [testVendorId, 'payout_key_t1']);
    assert.strictEqual(txCheck1.rows.length, 1);
    assert.strictEqual(parseFloat(txCheck1.rows[0].amount), 400.00);
    assert.strictEqual(txCheck1.rows[0].type, 'debit');

    console.log('  ✅ PASS: Payout of ₹400 processed correctly, new balance is ₹600.00.');
    passedCount++;


    // -------------------------------------------------------------------------
    // TEST 2: Payout exceeding the available balance
    // -------------------------------------------------------------------------
    console.log('\nTest 2: Payout of ₹700 exceeding available balance of ₹600...');
    let excessiveBlocked = false;
    try {
      await executePayout({
        vendorId: testVendorId,
        amount: 700.00,
        idempotencyKey: 'payout_key_t2'
      });
    } catch (err) {
      excessiveBlocked = true;
      assert(err.message.includes('Insufficient wallet balance'), `Unexpected error message: ${err.message}`);
    }

    assert.strictEqual(excessiveBlocked, true, 'Excessive payout must be rejected with 400');

    // Confirm wallet balance remained ₹600
    const vCheck2 = await client.query('SELECT wallet_balance FROM vendors WHERE id = $1', [testVendorId]);
    assert.strictEqual(parseFloat(vCheck2.rows[0].wallet_balance), 600.00);

    // Confirm no transaction was logged
    const txCheck2 = await client.query('SELECT * FROM vendor_transactions WHERE vendor_id = $1 AND order_number = $2', [testVendorId, 'payout_key_t2']);
    assert.strictEqual(txCheck2.rows.length, 0);

    console.log('  ✅ PASS: Excessive payout rejected; wallet balance remained exactly ₹600.00.');
    passedCount++;


    // -------------------------------------------------------------------------
    // TEST 3: Two concurrent payout requests competing for the same balance
    // -------------------------------------------------------------------------
    console.log('\nTest 3: Two concurrent payout requests of ₹400 each competing for ₹600 balance...');
    // Balance is ₹600. Two simultaneous requests of ₹400 total ₹800. Exactly ONE must succeed and ONE must fail.
    const concurrentKeyA = `payout_conc_a_${Date.now()}`;
    const concurrentKeyB = `payout_conc_b_${Date.now()}`;

    const [resA, resB] = await Promise.allSettled([
      executePayout({ vendorId: testVendorId, amount: 400.00, idempotencyKey: concurrentKeyA }),
      executePayout({ vendorId: testVendorId, amount: 400.00, idempotencyKey: concurrentKeyB })
    ]);

    const successes = [resA, resB].filter(r => r.status === 'fulfilled');
    const rejections = [resA, resB].filter(r => r.status === 'rejected');

    assert.strictEqual(successes.length, 1, 'Exactly one concurrent payout request must succeed');
    assert.strictEqual(rejections.length, 1, 'Exactly one concurrent payout request must fail');
    assert(rejections[0].reason.message.includes('Insufficient wallet balance'), 'Rejected request must state insufficient balance');

    // Balance must now be ₹600 - ₹400 = ₹200.00 (NOT negative!)
    const vCheck3 = await client.query('SELECT wallet_balance FROM vendors WHERE id = $1', [testVendorId]);
    assert.strictEqual(parseFloat(vCheck3.rows[0].wallet_balance), 200.00);

    console.log('  ✅ PASS: Row locking serialized concurrent requests: 1 succeeded, 1 rejected, final balance is ₹200.00.');
    passedCount++;


    // -------------------------------------------------------------------------
    // TEST 4: Duplicate retry of the same payout request (Idempotency)
    // -------------------------------------------------------------------------
    console.log('\nTest 4: Duplicate retry of the same payout request (Idempotency)...');
    // Balance is ₹200. Request ₹100 with idempotency key.
    const idempotentKey = `payout_idem_${Date.now()}`;

    // Attempt 1: First submission
    const idemRes1 = await executePayout({
      vendorId: testVendorId,
      amount: 100.00,
      idempotencyKey: idempotentKey
    });
    assert.strictEqual(idemRes1.message, 'Payout successful');
    assert.strictEqual(idemRes1.alreadyProcessed, false);
    assert.strictEqual(parseFloat(idemRes1.vendor.wallet_balance), 100.00);

    // Attempt 2: Immediate duplicate retry with the same idempotency key
    const idemRes2 = await executePayout({
      vendorId: testVendorId,
      amount: 100.00,
      idempotencyKey: idempotentKey
    });
    assert.strictEqual(idemRes2.alreadyProcessed, true);
    assert.strictEqual(idemRes2.message, 'Payout already processed');

    // Balance must STILL be ₹100.00 (NOT deducted a second time to ₹0.00!)
    const vCheck4 = await client.query('SELECT wallet_balance FROM vendors WHERE id = $1', [testVendorId]);
    assert.strictEqual(parseFloat(vCheck4.rows[0].wallet_balance), 100.00);

    // Transaction ledger must contain exactly ONE debit entry for this idempotency key
    const txCheck4 = await client.query(
      'SELECT * FROM vendor_transactions WHERE vendor_id = $1 AND order_number = $2 AND type = $3',
      [testVendorId, idempotentKey, 'debit']
    );
    assert.strictEqual(txCheck4.rows.length, 1);

    console.log('  ✅ PASS: Duplicate retry was recognized idempotently; zero duplicate debit occurred.');
    passedCount++;


    // -------------------------------------------------------------------------
    // TEST 5: Failure during ledger insertion rolls back the wallet deduction
    // -------------------------------------------------------------------------
    console.log('\nTest 5: Simulated failure during ledger insert, confirming atomic rollback...');
    // Balance is ₹100.00. Attempt ₹50 payout with simulated ledger crash.
    let ledgerFailureCaught = false;
    try {
      await executePayout({
        vendorId: testVendorId,
        amount: 50.00,
        idempotencyKey: `payout_fail_${Date.now()}`,
        simulateLedgerFailure: true
      });
    } catch (err) {
      ledgerFailureCaught = true;
      assert(err.message.includes('SIMULATED_LEDGER_FAILURE'));
    }
    assert.strictEqual(ledgerFailureCaught, true);

    // Balance must NOT have changed: still ₹100.00
    const vCheck5 = await client.query('SELECT wallet_balance FROM vendors WHERE id = $1', [testVendorId]);
    assert.strictEqual(parseFloat(vCheck5.rows[0].wallet_balance), 100.00, 'Wallet deduction must roll back when ledger insert fails');

    console.log('  ✅ PASS: Database transaction atomicity verified: wallet deduction completely rolled back.');
    passedCount++;


    // -------------------------------------------------------------------------
    // TEST 6 (POST-CHECK): Confirm real vendor balances remained 100% untouched
    // -------------------------------------------------------------------------
    console.log('\nTest 6 (Post-check): Verifying production vendor balances after tests...');
    const v1Final = await client.query('SELECT wallet_balance FROM vendors WHERE id = 1');
    assert.strictEqual(parseFloat(v1Final.rows[0].wallet_balance), 3959.00);

    const v4Final = await client.query('SELECT wallet_balance FROM vendors WHERE id = 4');
    assert.strictEqual(parseFloat(v4Final.rows[0].wallet_balance), 0.00);

    console.log('  ✅ PASS: Production vendor balances and records remain completely untouched.');
    passedCount++;

  } catch (testErr) {
    console.error('\n❌ PAYOUT SAFETY TEST FAILED:', testErr);
    throw testErr;
  } finally {
    // -------------------------------------------------------------------------
    // CLEANUP: Remove isolated test records
    // -------------------------------------------------------------------------
    console.log('\n--- Cleaning up isolated test vendor records ---');
    if (testVendorId) {
      await client.query('DELETE FROM vendor_transactions WHERE vendor_id = $1', [testVendorId]);
      await client.query('DELETE FROM vendors WHERE id = $1', [testVendorId]);
      console.log(`✅ Test vendor #${testVendorId} cleaned up.`);
    }
    client.release();
    await pool.end();
  }

  console.log('\n====================================================');
  console.log(`  ALL ${passedCount}/6 PAYOUT SAFETY TESTS PASSED!   `);
  console.log('====================================================\n');
}

runPayoutSafetyTests().catch(err => {
  console.error(err);
  process.exit(1);
});

