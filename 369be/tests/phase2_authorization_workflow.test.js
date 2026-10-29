const assert = require('assert');
const fulfillmentService = require('../services/fulfillmentService');

async function runPhase2Tests() {
  console.log('--- Starting Phase 2 Authorization & Workflow Test Suite ---');

  // MOCK DATA
  const vendor4Package = {
    id: 401,
    order_id: 88,
    vendor_id: 4,
    vendor_name: 'Organic Farm Hub',
    vendor_status: 'approved',
    vendor_pickup_synced: true,
    pickup_location_nickname: 'vnd_4_509209',
    fulfillment_number: 'ORD-88-V4',
    status: 'paid',
    subtotal: 1200,
    package_weight: 1.0,
    order_address: JSON.stringify({ line1: '123 Test St', city: 'Hyderabad', pincode: '500001', state: 'Telangana' }),
    user_name: 'Customer One'
  };

  const platformPackage = {
    id: 501,
    order_id: 88,
    vendor_id: null,
    fulfillment_number: 'ORD-88-P',
    status: 'paid',
    subtotal: 500,
    package_weight: 0.5,
    order_address: JSON.stringify({ line1: '123 Test St', city: 'Hyderabad', pincode: '500001', state: 'Telangana' }),
    user_name: 'Customer One'
  };

  // TEST 1: Unauthorized Vendor Access (Cross-Vendor Boundary)
  console.log('\n[Test 1] Testing unauthorized vendor access...');
  
  // Test 1a: Vendor 2 trying to dispatch Vendor 4's package
  const mockDbVendor4 = {
    query: async (sql, params) => {
      if (sql.includes('FROM order_fulfillments f') && sql.includes('WHERE f.id = $1')) {
        return { rows: [vendor4Package] };
      }
      return { rows: [] };
    }
  };

  try {
    await fulfillmentService.shipFulfillment(401, { vendorId: 2, dbClient: mockDbVendor4 });
    assert.fail('Vendor 2 should NOT be allowed to dispatch Vendor 4 package');
  } catch (err) {
    assert.strictEqual(err.statusCode, 403);
    assert.ok(err.message.includes('Unauthorized'), 'Error message must specify unauthorized');
    console.log('✅ Vendor 2 blocked from dispatching Vendor 4 package (403 Forbidden)');
  }

  // Test 1b: Vendor 2 trying to cancel Vendor 4's package
  try {
    await fulfillmentService.cancelFulfillmentPackage(401, { cancelledBy: 'vendor', vendorId: 2 }, mockDbVendor4);
    assert.fail('Vendor 2 should NOT be allowed to cancel Vendor 4 package');
  } catch (err) {
    assert.strictEqual(err.statusCode, 403);
    console.log('✅ Vendor 2 blocked from cancelling Vendor 4 package (403 Forbidden)');
  }

  // Test 1c: Vendor 4 trying to dispatch a Platform package (null vendor_id)
  const mockDbPlatform = {
    query: async (sql, params) => {
      if (sql.includes('FROM order_fulfillments f') && sql.includes('WHERE f.id = $1')) {
        return { rows: [platformPackage] };
      }
      return { rows: [] };
    }
  };

  try {
    await fulfillmentService.shipFulfillment(501, { vendorId: 4, dbClient: mockDbPlatform });
    assert.fail('Vendor 4 should NOT be allowed to dispatch Platform package');
  } catch (err) {
    assert.strictEqual(err.statusCode, 403);
    console.log('✅ Vendor 4 blocked from dispatching Platform package (403 Forbidden)');
  }

  // TEST 2: Authorized Vendor Dispatch
  console.log('\n[Test 2] Testing authorized vendor dispatch...');
  let srCreateCalled = false;
  let usedPickupLocation = null;
  let savedStatus = null;

  const mockDbAuthorized = {
    query: async (sql, params) => {
      if (sql.includes('FROM order_fulfillments f') && sql.includes('WHERE f.id = $1')) {
        return { rows: [vendor4Package] };
      }
      if (sql.includes('SELECT * FROM order_fulfillment_items')) {
        return { rows: [{ id: 1, fulfillment_id: 401, product_name: 'Organic Tea', unit_price: 1200, quantity: 1 }] };
      }
      if (sql.includes('UPDATE order_fulfillments SET shiprocket_order_id')) {
        return { rows: [] };
      }
      if (sql.includes('UPDATE order_fulfillments SET awb_code')) {
        return { rows: [] };
      }
      if (sql.includes('UPDATE order_fulfillments') && sql.includes('RETURNING *')) {
        savedStatus = params[0];
        return { rows: [{ ...vendor4Package, status: savedStatus, awb_code: 'AWB_V4_999' }] };
      }
      if (sql.includes('SELECT status FROM order_fulfillments WHERE order_id = $1')) {
        return { rows: [{ status: 'ready_to_ship' }] };
      }
      if (sql.includes('UPDATE orders SET status =')) {
        return { rows: [] };
      }
      return { rows: [] };
    }
  };

  const mockSrClient = {
    createCustomOrder: async (payload) => {
      srCreateCalled = true;
      usedPickupLocation = payload.pickup_location;
      return { shipment_id: 'SH_V4_111', order_id: 'ORD_SR_111' };
    },
    assignAWB: async () => ({ awb_code: 'AWB_V4_999', courier_name: 'Delhivery' }),
    generateLabel: async () => ({ label_url: 'https://cdn.shiprocket.in/label.pdf' }),
    requestPickup: async () => ({ pickup_token_number: 'TOK_V4_555' })
  };

  const vendorDispatchResult = await fulfillmentService.shipFulfillment(
    401,
    { vendorId: 4, dbClient: mockDbAuthorized, shiprocketClient: mockSrClient }
  );

  assert.strictEqual(vendorDispatchResult.success, true);
  assert.strictEqual(vendorDispatchResult.status, 'ready_to_ship');
  assert.strictEqual(srCreateCalled, true);
  assert.strictEqual(usedPickupLocation, 'vnd_4_509209', 'Vendor warehouse must be used');
  console.log('✅ Vendor 4 successfully dispatched their package using registered warehouse vnd_4_509209');

  // TEST 3: Duplicate Dispatch Requests (Idempotency)
  console.log('\n[Test 3] Testing duplicate dispatch prevention (Idempotency)...');
  let duplicateSrCall = false;

  const mockDbAlreadyScheduled = {
    query: async (sql, params) => {
      if (sql.includes('FROM order_fulfillments f') && sql.includes('WHERE f.id = $1')) {
        return {
          rows: [{
            ...vendor4Package,
            status: 'ready_to_ship',
            awb_code: 'AWB_V4_999',
            courier_name: 'Delhivery',
            pickup_token_number: 'TOK_V4_555',
            tracking_url: 'https://shiprocket.co/tracking/AWB_V4_999',
            sync_error: null
          }]
        };
      }
      return { rows: [] };
    }
  };

  const mockSrClientDuplicate = {
    createCustomOrder: async () => { duplicateSrCall = true; },
    assignAWB: async () => { duplicateSrCall = true; },
    requestPickup: async () => { duplicateSrCall = true; }
  };

  const duplicateResult = await fulfillmentService.shipFulfillment(
    401,
    { vendorId: 4, dbClient: mockDbAlreadyScheduled, shiprocketClient: mockSrClientDuplicate }
  );

  assert.strictEqual(duplicateResult.success, true);
  assert.strictEqual(duplicateResult.alreadyScheduled, true, 'Must return alreadyScheduled: true');
  assert.strictEqual(duplicateSrCall, false, 'Shiprocket API must NOT be called for already-scheduled package');
  console.log('✅ Duplicate dispatch prevented: returns cached schedule without calling Shiprocket API');

  // TEST 4: Failed Shiprocket Requests
  console.log('\n[Test 4] Testing graceful failure on Shiprocket error...');
  let recordedErrorStatus = null;
  let recordedErrorMsg = null;

  const mockDbFailing = {
    query: async (sql, params) => {
      if (sql.includes('FROM order_fulfillments f') && sql.includes('WHERE f.id = $1')) {
        return { rows: [vendor4Package] };
      }
      if (sql.includes('SELECT * FROM order_fulfillment_items')) {
        return { rows: [{ id: 1, unit_price: 1200, quantity: 1 }] };
      }
      if (sql.includes('UPDATE order_fulfillments SET sync_error =')) {
        recordedErrorMsg = params[0];
        recordedErrorStatus = params[1];
        return { rows: [] };
      }
      if (sql.includes('SELECT awb_code, status FROM order_fulfillments')) {
        return { rows: [{ awb_code: null, status: 'failed' }] };
      }
      return { rows: [] };
    }
  };

  const mockSrClientError = {
    createCustomOrder: async () => {
      throw new Error('Shiprocket API 500: Internal server timeout');
    }
  };

  try {
    await fulfillmentService.shipFulfillment(
      401,
      { vendorId: 4, dbClient: mockDbFailing, shiprocketClient: mockSrClientError }
    );
    assert.fail('Should have thrown on Shiprocket failure');
  } catch (apiErr) {
    assert.strictEqual(recordedErrorStatus, 'failed');
    assert.ok(recordedErrorMsg.includes('Internal server timeout'));
    console.log('✅ Failed Shiprocket request handled cleanly: records error and does not corrupt state');
  }

  // TEST 5: Cancellation of an Already-Collected Shipment
  console.log('\n[Test 5] Testing cancellation restriction on already-collected shipments...');
  
  // Test 5a: Package already marked 'shipped' (in transit)
  const mockDbAlreadyShipped = {
    query: async (sql, params) => {
      if (sql.includes('FROM order_fulfillments f') && sql.includes('WHERE f.id = $1')) {
        return {
          rows: [{
            ...vendor4Package,
            status: 'shipped',
            awb_code: 'AWB_V4_999'
          }]
        };
      }
      return { rows: [] };
    }
  };

  try {
    await fulfillmentService.cancelFulfillmentPackage(
      401,
      { cancelledBy: 'vendor', vendorId: 4 },
      mockDbAlreadyShipped
    );
    assert.fail('Should NOT allow cancelling an already shipped package');
  } catch (collectedErr) {
    assert.strictEqual(collectedErr.statusCode, 400);
    assert.ok(collectedErr.message.includes('already been collected/shipped'));
    console.log('✅ Cancellation rejected when courier already collected package (400 Bad Request)');
  }

  // Test 5b: Shiprocket API rejects cancellation (courier picked up in real-time)
  let dbMarkedCancelled = false;
  let stockRestored = false;

  const mockDbCancelFailing = {
    connect: async () => ({
      query: async (sql, params) => {
        if (sql === 'BEGIN' || sql === 'ROLLBACK') return;
        if (sql.includes('UPDATE products SET stock')) {
          stockRestored = true;
        }
        if (sql.includes("UPDATE order_fulfillments SET status = 'cancelled'")) {
          dbMarkedCancelled = true;
        }
      },
      release: () => {}
    }),
    query: async (sql, params) => {
      if (sql.includes('FROM order_fulfillments f') && sql.includes('WHERE f.id = $1')) {
        return {
          rows: [{
            ...vendor4Package,
            status: 'ready_to_ship',
            awb_code: 'AWB_V4_999'
          }]
        };
      }
      return { rows: [] };
    }
  };

  const mockSrClientCancelFailing = {
    cancelShipment: async () => {
      throw new Error('AWB cannot be cancelled: Courier has already dispatched vehicle.');
    }
  };

  try {
    await fulfillmentService.cancelFulfillmentPackage(
      401,
      { cancelledBy: 'vendor', vendorId: 4 },
      mockDbCancelFailing,
      mockSrClientCancelFailing
    );
    assert.fail('Should fail when Shiprocket rejects cancellation');
  } catch (srCancelErr) {
    assert.strictEqual(srCancelErr.statusCode, 400);
    assert.strictEqual(dbMarkedCancelled, false, 'DB must NOT be marked cancelled if Shiprocket rejects');
    assert.strictEqual(stockRestored, false, 'Stock must NOT be restored if Shiprocket rejects');
    console.log('✅ DB and stock protected when Shiprocket rejects cancellation (atomic safety verified)');
  }

  // TEST 6: Admin Backup Controls
  console.log('\n[Test 6] Testing Admin backup dispatch and cancellation...');
  let adminCancelCalled = false;
  let adminStockRestored = false;

  const mockDbAdminCancel = {
    connect: async () => ({
      query: async (sql, params) => {
        if (sql === 'BEGIN' || sql === 'COMMIT' || sql === 'ROLLBACK') return;
        if (sql.includes('SELECT product_id, quantity FROM order_fulfillment_items')) {
          return { rows: [{ product_id: 10, quantity: 3 }] };
        }
        if (sql.includes('UPDATE products SET stock = stock + $1 WHERE id = $2')) {
          adminStockRestored = true;
          return { rows: [] };
        }
        if (sql.includes("UPDATE order_fulfillments SET status = 'cancelled'")) {
          return { rows: [{ ...vendor4Package, status: 'cancelled' }] };
        }
        if (sql.includes('SELECT status FROM order_fulfillments WHERE order_id = $1')) {
          return { rows: [{ status: 'cancelled' }] };
        }
        if (sql.includes('UPDATE orders SET status =')) {
          return { rows: [] };
        }
        return { rows: [] };
      },
      release: () => {}
    }),
    query: async (sql, params) => {
      if (sql.includes('FROM order_fulfillments f') && sql.includes('WHERE f.id = $1')) {
        return {
          rows: [{
            ...vendor4Package,
            status: 'ready_to_ship',
            awb_code: 'AWB_V4_999'
          }]
        };
      }
      return { rows: [] };
    }
  };

  const mockSrClientAdmin = {
    cancelShipment: async () => {
      adminCancelCalled = true;
      return { success: true };
    }
  };

  const adminCancelResult = await fulfillmentService.cancelFulfillmentPackage(
    401,
    { cancelledBy: 'admin', reason: 'Admin override' },
    mockDbAdminCancel,
    mockSrClientAdmin
  );

  assert.strictEqual(adminCancelResult.success, true);
  assert.strictEqual(adminCancelResult.status, 'cancelled');
  assert.strictEqual(adminCancelCalled, true);
  assert.strictEqual(adminStockRestored, true);
  console.log('✅ Admin backup cancellation successfully cancelled Shiprocket shipment and restored stock');

  console.log('\n🎉 ALL PHASE 2 TESTS PASSED PERFECTLY! 🎉');
  process.exit(0);
}

runPhase2Tests().catch(err => {
  console.error('\n❌ Phase 2 test failed:', err);
  process.exit(1);
});

