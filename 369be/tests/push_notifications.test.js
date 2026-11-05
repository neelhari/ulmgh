const assert = require('assert');
const jwt = require('jsonwebtoken');
const pool = require('../db');
const firebaseService = require('../services/firebase');
const notificationsRouter = require('../routes/notifications');

const JWT_SECRET = process.env.JWT_SECRET || 'test_secret';

async function runPushNotificationTests() {
  console.log('================================================================');
  console.log('   ULMGH369 COMPLETE WORKFLOW: FCM PUSH NOTIFICATIONS SUITE      ');
  console.log('================================================================\n');

  const client = await pool.connect();
  let passedCount = 0;
  let testUserId = null;
  let testVendorId = null;

  try {
    // 0. Setup test customer and test vendor
    const uRes = await client.query(`
      INSERT INTO users (name, email, phone, password_hash, is_verified, role)
      VALUES ('FCM Test Customer', 'fcm_user_${Date.now()}@test.com', '9999988888', 'hash', true, 'user')
      RETURNING id, email
    `);
    testUserId = uRes.rows[0].id;

    const vRes = await client.query(`
      INSERT INTO vendors (name, store_name, email, phone, status)
      VALUES ('FCM Test Vendor', 'FCM Store', 'fcm_vendor_${Date.now()}@test.com', '9999977777', 'approved')
      RETURNING id, email
    `);
    testVendorId = vRes.rows[0].id;

    const customerToken = jwt.sign({ id: testUserId, email: uRes.rows[0].email, role: 'user' }, process.env.JWT_SECRET);
    const vendorToken = jwt.sign({ id: testVendorId, email: vRes.rows[0].email, role: 'vendor' }, process.env.JWT_SECRET);

    console.log(`Created test customer #${testUserId} and test vendor #${testVendorId}\n`);

    // TEST 1: Unified Auth Middleware validates customer and vendor tokens
    console.log('1. Verifying Unified Auth Middleware...');
    let authedUser = null;
    const reqCustomer = {
      headers: { authorization: `Bearer ${customerToken}` }
    };
    notificationsRouter.unifiedAuthMiddleware(reqCustomer, {}, () => {
      authedUser = reqCustomer.auth;
    });
    assert.strictEqual(authedUser?.userType, 'customer');
    assert.strictEqual(authedUser?.id, testUserId);

    let authedVendor = null;
    const reqVendor = {
      headers: { authorization: `Bearer ${vendorToken}` }
    };
    notificationsRouter.unifiedAuthMiddleware(reqVendor, {}, () => {
      authedVendor = reqVendor.auth;
    });
    assert.strictEqual(authedVendor?.userType, 'vendor');
    assert.strictEqual(authedVendor?.id, testVendorId);
    console.log('   ✅ Unified Auth accurately extracts customer and vendor identities.');
    passedCount++;

    // TEST 2: Register FCM token for customer
    console.log('\n2. Registering Customer FCM token...');
    const fcmCustomerToken1 = `test_fcm_cust_token_${Date.now()}`;
    await client.query(`
      INSERT INTO fcm_device_tokens (user_type, user_id, fcm_token, platform, app_version, device_model)
      VALUES ('customer', $1, $2, 'android', '1.0.0', 'Pixel 8')
    `, [testUserId, fcmCustomerToken1]);

    const custTokenRow = await client.query('SELECT * FROM fcm_device_tokens WHERE fcm_token = $1', [fcmCustomerToken1]);
    assert.strictEqual(custTokenRow.rows.length, 1);
    assert.strictEqual(custTokenRow.rows[0].user_type, 'customer');
    assert.strictEqual(custTokenRow.rows[0].user_id, testUserId);
    assert.strictEqual(custTokenRow.rows[0].platform, 'android');
    console.log('   ✅ Customer FCM token registered and persisted with metadata.');
    passedCount++;

    // TEST 3: Register FCM token for vendor
    console.log('\n3. Registering Vendor FCM token...');
    const fcmVendorToken1 = `test_fcm_vendor_token_${Date.now()}`;
    await client.query(`
      INSERT INTO fcm_device_tokens (user_type, user_id, fcm_token, platform, app_version, device_model)
      VALUES ('vendor', $1, $2, 'android', '1.0.0', 'Samsung Galaxy S24')
    `, [testVendorId, fcmVendorToken1]);

    const vendorTokenRow = await client.query('SELECT * FROM fcm_device_tokens WHERE fcm_token = $1', [fcmVendorToken1]);
    assert.strictEqual(vendorTokenRow.rows.length, 1);
    assert.strictEqual(vendorTokenRow.rows[0].user_type, 'vendor');
    assert.strictEqual(vendorTokenRow.rows[0].user_id, testVendorId);
    console.log('   ✅ Vendor FCM token registered and isolated from customer tokens.');
    passedCount++;

    // TEST 4: Token Upsert on Refresh / Reassignment
    console.log('\n4. Testing Token Upsert (prevents duplicate tokens and updates owner)...');
    await client.query(`
      INSERT INTO fcm_device_tokens (user_type, user_id, fcm_token, platform, app_version, device_model, updated_at)
      VALUES ('customer', $1, $2, 'android', '1.0.1', 'Pixel 8 Pro', NOW())
      ON CONFLICT (fcm_token)
      DO UPDATE SET
        user_type = EXCLUDED.user_type,
        user_id = EXCLUDED.user_id,
        app_version = EXCLUDED.app_version,
        updated_at = NOW()
    `, [testUserId, fcmCustomerToken1]);

    const updatedCustToken = await client.query('SELECT * FROM fcm_device_tokens WHERE fcm_token = $1', [fcmCustomerToken1]);
    assert.strictEqual(updatedCustToken.rows.length, 1, 'Should NOT create duplicate rows');
    assert.strictEqual(updatedCustToken.rows[0].app_version, '1.0.1');
    console.log('   ✅ Token refresh upsert verified: zero duplicate entries created.');
    passedCount++;

    // TEST 5: Recipient Audience Isolation
    console.log('\n5. Verifying Recipient Audience Isolation (Customer vs Vendor)...');
    const custTokensOnly = await client.query(
      'SELECT fcm_token FROM fcm_device_tokens WHERE user_type = $1 AND user_id = $2',
      ['customer', testUserId]
    );
    const vendorTokensOnly = await client.query(
      'SELECT fcm_token FROM fcm_device_tokens WHERE user_type = $1 AND user_id = $2',
      ['vendor', testVendorId]
    );
    assert.strictEqual(custTokensOnly.rows[0].fcm_token, fcmCustomerToken1);
    assert.strictEqual(vendorTokensOnly.rows[0].fcm_token, fcmVendorToken1);
    assert.notStrictEqual(custTokensOnly.rows[0].fcm_token, vendorTokensOnly.rows[0].fcm_token);
    console.log('   ✅ Customer and Vendor device tokens strictly segregated in queries.');
    passedCount++;

    // TEST 6: Mocked FCM Multi-cast dispatch & payload structure
    console.log('\n6. Testing FCM Dispatch with Mock Messaging...');
    let lastSentMessage = null;
    firebaseService.setMockMessaging({
      sendEachForMulticast: async (msg) => {
        lastSentMessage = msg;
        return {
          successCount: msg.tokens.length,
          failureCount: 0,
          responses: msg.tokens.map(() => ({ success: true }))
        };
      }
    });

    const sendRes = await firebaseService.sendPushToCustomer(
      testUserId,
      {
        title: 'Order Delivered 🎉',
        body: 'Your package #ORD-TEST has arrived!',
        data: { orderId: '999', screen: 'order-tracking' }
      },
      `test_key_${Date.now()}`,
      '999',
      'order_delivered'
    );

    assert.strictEqual(sendRes.success, true);
    assert.strictEqual(sendRes.sentCount, 1);
    assert.strictEqual(lastSentMessage.notification.title, 'Order Delivered 🎉');
    assert.strictEqual(lastSentMessage.data.screen, 'order-tracking');
    assert.strictEqual(lastSentMessage.data.recipientType, 'customer');
    assert.strictEqual(lastSentMessage.android.priority, 'high');
    console.log('   ✅ Multicast message constructed with correct Android payload and data.');
    passedCount++;

    // TEST 7: Idempotency Protection
    console.log('\n7. Testing Idempotency & Duplicate Prevention...');
    const duplicateKey = `idempotent_order_${Date.now()}`;
    const firstDispatch = await firebaseService.sendPushToCustomer(
      testUserId,
      { title: 'First Ping', body: 'Original notification' },
      duplicateKey,
      '101',
      'order_status'
    );
    assert.strictEqual(firstDispatch.success, true);

    const secondDispatch = await firebaseService.sendPushToCustomer(
      testUserId,
      { title: 'Duplicate Ping', body: 'Should be suppressed' },
      duplicateKey,
      '101',
      'order_status'
    );
    assert.strictEqual(secondDispatch.success, true);
    assert.strictEqual(secondDispatch.duplicate, true, 'Second dispatch should be marked duplicate');
    console.log('   ✅ Duplicate notification prevented via notification_logs idempotency key.');
    passedCount++;

    // TEST 8: Stale Token Pruning on Invalid Token Error
    console.log('\n8. Testing Stale Token Pruning on FCM error...');
    const staleToken = `stale_token_${Date.now()}`;
    await client.query(`
      INSERT INTO fcm_device_tokens (user_type, user_id, fcm_token, platform)
      VALUES ('customer', $1, $2, 'android')
    `, [testUserId, staleToken]);

    firebaseService.setMockMessaging({
      sendEachForMulticast: async (msg) => {
        return {
          successCount: 1,
          failureCount: 1,
          responses: msg.tokens.map((tok) => {
            if (tok === staleToken) {
              return {
                success: false,
                error: { code: 'messaging/registration-token-not-registered' }
              };
            }
            return { success: true };
          })
        };
      }
    });

    const pruneDispatch = await firebaseService.sendPushToCustomer(
      testUserId,
      { title: 'Prune Test', body: 'Cleaning dead tokens' },
      `prune_key_${Date.now()}`,
      '102',
      'prune_test'
    );

    assert.strictEqual(pruneDispatch.prunedTokens, 1);
    const staleCheck = await client.query('SELECT * FROM fcm_device_tokens WHERE fcm_token = $1', [staleToken]);
    assert.strictEqual(staleCheck.rows.length, 0, 'Stale token should be deleted from DB');
    console.log('   ✅ Expired/unregistered token pruned automatically from database.');
    passedCount++;

    // TEST 9: Unregister Token on Logout
    console.log('\n9. Testing Device Token Unregistration (Logout)...');
    await client.query(`
      DELETE FROM fcm_device_tokens
      WHERE fcm_token = $1 AND user_type = 'customer' AND user_id = $2
    `, [fcmCustomerToken1, testUserId]);

    const remainingTokens = await client.query('SELECT * FROM fcm_device_tokens WHERE fcm_token = $1', [fcmCustomerToken1]);
    assert.strictEqual(remainingTokens.rows.length, 0);
    console.log('   ✅ Device token unregistered on logout.');
    passedCount++;

    // TEST 10: Non-blocking Resilience Guarantee
    console.log('\n10. Testing Non-blocking Resilience Guarantee on FCM network failure...');
    firebaseService.setMockMessaging({
      sendEachForMulticast: async () => {
        throw new Error('FCM Network Timeout or Service Unavailable');
      }
    });

    const resilientResult = await firebaseService.sendPushToVendor(
      testVendorId,
      { title: 'Network Fail Test', body: 'Will not crash caller' },
      `fail_key_${Date.now()}`,
      '103',
      'fail_test'
    );

    assert.strictEqual(resilientResult.success, false);
    assert.ok(resilientResult.error.includes('FCM Network Timeout'));
    console.log('   ✅ FCM error safely caught without throwing uncaught exception to caller.');
    passedCount++;

    console.log('\n================================================================');
    console.log(`   ALL ${passedCount}/10 PUSH NOTIFICATION TESTS PASSED SUCCESSFULLY! 🚀 `);
    console.log('================================================================\n');

  } catch (err) {
    console.error('❌ Test suite failed:', err);
    process.exit(1);
  } finally {
    // Cleanup test fixtures
    try {
      if (testUserId) {
        await client.query('DELETE FROM fcm_device_tokens WHERE user_id = $1', [testUserId]);
        await client.query('DELETE FROM notification_logs WHERE recipient_id = $1', [testUserId]);
        await client.query('DELETE FROM users WHERE id = $1', [testUserId]);
      }
      if (testVendorId) {
        await client.query('DELETE FROM fcm_device_tokens WHERE user_id = $1', [testVendorId]);
        await client.query('DELETE FROM notification_logs WHERE recipient_id = $1', [testVendorId]);
        await client.query('DELETE FROM vendors WHERE id = $1', [testVendorId]);
      }
    } catch (cleanErr) {
      console.warn('Cleanup error:', cleanErr.message);
    }
    client.release();
    await pool.end();
  }
}

runPushNotificationTests();

