const assert = require('assert');
const fulfillmentService = require('../services/fulfillmentService');
const shiprocket = require('../utils/shiprocket');

async function runTests() {
  console.log('--- Starting Phase 1 Fulfillment Service & Shiprocket Tests ---');

  // Test 1: Verify shiprocket export methods
  console.log('\n[Test 1] Verifying shiprocket client export methods...');
  assert.strictEqual(typeof shiprocket.authenticate, 'function');
  assert.strictEqual(typeof shiprocket.createCustomOrder, 'function');
  assert.strictEqual(typeof shiprocket.assignAWB, 'function');
  assert.strictEqual(typeof shiprocket.requestPickup, 'function');
  assert.strictEqual(typeof shiprocket.generateLabel, 'function');
  assert.strictEqual(typeof shiprocket.getPickupLocations, 'function');
  assert.strictEqual(typeof shiprocket.registerPickupLocation, 'function');
  assert.strictEqual(typeof shiprocket.cancelShipment, 'function');
  assert.strictEqual(typeof shiprocket.cancelOrder, 'function');
  assert.strictEqual(typeof shiprocket.getTrackingByAwb, 'function');
  assert.strictEqual(typeof shiprocket.getOrderDetails, 'function');
  console.log('✅ Shiprocket export methods verified.');

  // Test 2: Admin pickup location helper returns 'suresh' as default
  console.log('\n[Test 2] Verifying getAdminPickupLocation fallback...');
  const mockDbClientNoSettings = {
    query: async (text) => {
      if (text.includes('app_settings')) {
        throw new Error('relation "app_settings" does not exist');
      }
      return { rows: [] };
    }
  };
  const location = await fulfillmentService.getAdminPickupLocation(mockDbClientNoSettings);
  assert.strictEqual(location, 'suresh', 'Default location should be suresh, not Primary');
  console.log('✅ Admin pickup location correctly defaults to "suresh"');

  // Test 3: Idempotent dispatch handling "Already in Pickup Queue"
  console.log('\n[Test 3] Verifying "Already in Pickup Queue" handled gracefully as scheduled...');
  let updatedStatus = null;
  let updatedSyncError = null;

  const mockDb = {
    query: async (sql, params) => {
      if (sql.includes('FROM order_fulfillments f') && sql.includes('WHERE f.id = $1')) {
        return {
          rows: [{
            id: 101,
            order_id: 50,
            vendor_id: 4,
            vendor_status: 'approved',
            vendor_name: 'Test Vendor',
            vendor_pickup_synced: true,
            pickup_location_nickname: 'vnd_4_509209',
            fulfillment_number: 'ORD-TEST-V4',
            status: 'processing',
            shiprocket_shipment_id: '99999',
            shiprocket_order_id: '88888',
            awb_code: 'TEST_AWB_123',
            courier_name: 'India Post',
            courier_company_id: 15,
            subtotal: 500,
            package_weight: 0.5,
            order_address: JSON.stringify({ line1: 'Test Address', city: 'Hyd', pincode: '500001', state: 'Telangana' }),
            user_name: 'Test User'
          }]
        };
      }
      if (sql.includes('SELECT * FROM order_fulfillment_items')) {
        return {
          rows: [{
            id: 1,
            fulfillment_id: 101,
            product_id: 10,
            product_name: 'Test Item',
            quantity: 1,
            unit_price: 500
          }]
        };
      }
      if (sql.includes('UPDATE order_fulfillments') && sql.includes('RETURNING *')) {
        updatedStatus = params[0];
        updatedSyncError = params[8];
        return {
          rows: [{
            id: 101,
            status: updatedStatus,
            awb_code: 'TEST_AWB_123',
            sync_error: null
          }]
        };
      }
      if (sql.includes('SELECT f.id, f.status, f.vendor_id FROM order_fulfillments f')) {
        return {
          rows: [{ id: 101, status: 'ready_to_ship', vendor_id: 4 }]
        };
      }
      if (sql.includes('UPDATE orders SET status =')) {
        return { rows: [] };
      }
      return { rows: [] };
    }
  };

  const mockSrClientWithQueued = {
    createCustomOrder: async () => ({ shipment_id: '99999', order_id: '88888' }),
    assignAWB: async () => ({ awb_code: 'TEST_AWB_123', courier_name: 'India Post' }),
    generateLabel: async () => ({ label_url: 'https://label.pdf' }),
    requestPickup: async () => {
      // Simulating Shiprocket's exact response when already in queue
      throw new Error('Already in Pickup Queue.');
    }
  };

  const dispatchResult = await fulfillmentService.shipFulfillment(101, mockDb, mockSrClientWithQueued);
  assert.strictEqual(dispatchResult.success, true);
  assert.strictEqual(dispatchResult.status, 'ready_to_ship', 'Status should be ready_to_ship when queued in Shiprocket');
  assert.strictEqual(updatedStatus, 'ready_to_ship');
  console.log('✅ "Already in Pickup Queue" treated as successfully scheduled (ready_to_ship)');

  // Test 4: Live Status Synchronization
  console.log('\n[Test 4] Verifying syncFulfillmentStatus pulls live tracking...');
  let syncedStatus = null;
  const mockDbForSync = {
    query: async (sql, params) => {
      if (sql.includes('FROM order_fulfillments f') && sql.includes('WHERE f.id = $1')) {
        return {
          rows: [{
            id: 101,
            order_id: 50,
            awb_code: 'TEST_AWB_123',
            status: 'failed',
            sync_error: 'Stale error'
          }]
        };
      }
      if (sql.includes('UPDATE order_fulfillments') && sql.includes('SET status = $1')) {
        syncedStatus = params[0];
        return {
          rows: [{
            id: 101,
            status: syncedStatus,
            sync_error: null
          }]
        };
      }
      if (sql.includes('SELECT f.id, f.status, f.vendor_id FROM order_fulfillments f')) {
        return { rows: [{ id: 101, status: syncedStatus }] };
      }
      if (sql.includes('UPDATE orders SET status =')) {
        return { rows: [] };
      }
      return { rows: [] };
    }
  };

  const mockSrClientTracking = {
    getTrackingByAwb: async (awb) => ({
      tracking_data: {
        track_status: 'OUT FOR PICKUP',
        shipment_track_activities: [{ activity: 'Pickup Request Raised at Nagarkurnool' }]
      }
    })
  };

  const syncResult = await fulfillmentService.syncFulfillmentStatus(101, mockDbForSync, mockSrClientTracking);
  assert.strictEqual(syncResult.synced, true);
  assert.strictEqual(syncResult.current_status, 'ready_to_ship');
  assert.strictEqual(syncedStatus, 'ready_to_ship');
  console.log('✅ syncFulfillmentStatus accurately reconciled failed state to ready_to_ship based on live tracking');

  // Test 5: Package Cancellation with Authorization & Inventory Restoration
  console.log('\n[Test 5] Verifying cancelFulfillmentPackage authorization & inventory restoration...');
  let stockRestored = false;
  let shiprocketCancelCalled = false;

  const mockDbForCancel = {
    connect: async () => ({
      query: async (sql, params) => {
        if (sql === 'BEGIN' || sql === 'COMMIT' || sql === 'ROLLBACK') return;
        if (sql.includes('SELECT product_id, quantity FROM order_fulfillment_items')) {
          return { rows: [{ product_id: 10, quantity: 2 }] };
        }
        if (sql.includes('UPDATE products SET stock = stock + $1 WHERE id = $2')) {
          assert.strictEqual(params[0], 2);
          assert.strictEqual(params[1], 10);
          stockRestored = true;
          return { rows: [] };
        }
        if (sql.includes("UPDATE order_fulfillments SET status = 'cancelled'")) {
          return {
            rows: [{
              id: 101,
              fulfillment_number: 'ORD-TEST-V4',
              status: 'cancelled'
            }]
          };
        }
        if (sql.includes('SELECT status FROM order_fulfillments')) {
          return { rows: [{ status: 'cancelled' }] };
        }
        if (sql.includes('SELECT f.id, f.status, f.vendor_id FROM order_fulfillments f')) {
          return { rows: [{ id: 101, status: 'cancelled' }] };
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
            id: 101,
            order_id: 50,
            vendor_id: 4,
            fulfillment_number: 'ORD-TEST-V4',
            status: 'ready_to_ship',
            awb_code: 'TEST_AWB_123',
            shiprocket_order_id: '88888'
          }]
        };
      }
      return { rows: [] };
    }
  };

  const mockSrCancelClient = {
    cancelShipment: async (awb) => {
      assert.strictEqual(awb, 'TEST_AWB_123');
      shiprocketCancelCalled = true;
      return { status: 200, message: 'Shipment cancelled' };
    }
  };

  // Test 5a: Vendor authorization failure (Vendor 2 trying to cancel Vendor 4's package)
  try {
    await fulfillmentService.cancelFulfillmentPackage(101, { cancelledBy: 'vendor', vendorId: 2 }, mockDbForCancel, mockSrCancelClient);
    assert.fail('Should have thrown authorization error');
  } catch (authErr) {
    assert.strictEqual(authErr.statusCode, 403);
    console.log('✅ Vendor authorization restriction verified (Vendor 2 blocked from cancelling Vendor 4 package)');
  }

  // Test 5b: Authorized cancellation (by Vendor 4 or Admin)
  const cancelResult = await fulfillmentService.cancelFulfillmentPackage(101, { cancelledBy: 'vendor', vendorId: 4 }, mockDbForCancel, mockSrCancelClient);
  assert.strictEqual(cancelResult.success, true);
  assert.strictEqual(cancelResult.status, 'cancelled');
  assert.strictEqual(shiprocketCancelCalled, true, 'Shiprocket cancellation API must be called');
  assert.strictEqual(stockRestored, true, 'Product stock must be restored');
  console.log('✅ Authorized package cancellation called Shiprocket, marked package cancelled, and restored stock');

  console.log('\n🎉 ALL PHASE 1 TESTS PASSED SUCCESSFULLY! 🎉');
  process.exit(0);
}

runTests().catch(err => {
  console.error('\n❌ Test failed:', err);
  process.exit(1);
});
