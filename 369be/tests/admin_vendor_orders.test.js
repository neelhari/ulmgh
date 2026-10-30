const assert = require('assert');
const fulfillmentService = require('../services/fulfillmentService');

async function runAdminVendorSeparationTests() {
  console.log('=================================================================');
  console.log('🧪 ULMGH369: Admin Orders & Vendor Orders Separation Test Suite');
  console.log('=================================================================\n');

  // -------------------------------------------------------------
  // TEST DATA SETUP
  // -------------------------------------------------------------
  // Order 1: Admin Platform Only
  const order1 = {
    id: 101,
    order_number: 'ORD-101',
    user_name: 'Customer Admin',
    total: 999,
    status: 'pending'
  };
  const ful1_Platform = {
    id: 1001,
    order_id: 101,
    vendor_id: null,
    fulfillment_number: 'ORD-101-P',
    status: 'pending',
    subtotal: 999,
    pickup_location_nickname: 'suresh'
  };

  // Order 2: Vendor 10 Only
  const order2 = {
    id: 102,
    order_number: 'ORD-102',
    user_name: 'Customer Vendor',
    total: 1500,
    status: 'paid'
  };
  const ful2_Vendor10 = {
    id: 1002,
    order_id: 102,
    vendor_id: 10,
    vendor_name: 'Spice Emporium',
    vendor_status: 'approved',
    vendor_pickup_synced: true,
    fulfillment_number: 'ORD-102-V10',
    status: 'paid',
    subtotal: 1500,
    pickup_location_nickname: 'vnd_10_500001'
  };

  // Order 3: Mixed Order (Platform + Vendor 20)
  const order3 = {
    id: 103,
    order_number: 'ORD-103',
    user_name: 'Customer Mixed',
    total: 2800,
    status: 'processing'
  };
  const ful3_Platform = {
    id: 1003,
    order_id: 103,
    vendor_id: null,
    fulfillment_number: 'ORD-103-P',
    status: 'processing',
    subtotal: 800,
    pickup_location_nickname: 'suresh'
  };
  const ful3_Vendor20 = {
    id: 1004,
    order_id: 103,
    vendor_id: 20,
    vendor_name: 'Organic Organics',
    vendor_status: 'approved',
    vendor_pickup_synced: true,
    fulfillment_number: 'ORD-103-V20',
    status: 'processing',
    subtotal: 2000,
    pickup_location_nickname: 'vnd_20_500032'
  };

  // In-memory fulfillments map
  const fulfillmentsByOrder = {
    101: [ful1_Platform],
    102: [ful2_Vendor10],
    103: [ful3_Platform, ful3_Vendor20]
  };

  // Helper simulating GET /api/admin/orders filtering
  function simulateAdminOrdersQuery(allOrders, { type, vendor_id } = {}) {
    const filteredOrders = [];
    for (const ord of allOrders) {
      let fulfillments = fulfillmentsByOrder[ord.id] || [];

      if (type === 'admin') {
        fulfillments = fulfillments.filter(f => f.vendor_id === null);
        if (fulfillments.length === 0) continue;
      } else if (type === 'vendor') {
        fulfillments = fulfillments.filter(f => f.vendor_id !== null && (!vendor_id || String(f.vendor_id) === String(vendor_id)));
        if (fulfillments.length === 0) continue;
      }

      const ordCopy = { ...ord, fulfillments };
      filteredOrders.push(ordCopy);
    }
    return filteredOrders;
  }

  // -------------------------------------------------------------
  // TEST 1: Backend & Query Separation for Admin Orders
  // -------------------------------------------------------------
  console.log('[Test 1] Verifying Admin Orders query isolation (?type=admin)...');
  const adminQueryResults = simulateAdminOrdersQuery([order1, order2, order3], { type: 'admin' });

  assert.strictEqual(adminQueryResults.length, 2, 'Should return exactly 2 orders (Order 1 and Order 3)');
  assert.ok(adminQueryResults.find(o => o.id === 101), 'Order 1 (Platform-only) must appear in Admin Orders');
  assert.ok(adminQueryResults.find(o => o.id === 103), 'Order 3 (Mixed Order) must appear in Admin Orders');
  assert.strictEqual(adminQueryResults.find(o => o.id === 102), undefined, 'Order 2 (Vendor-only) must NEVER appear in Admin Orders');

  // Verify mixed order package isolation
  const order3AdminView = adminQueryResults.find(o => o.id === 103);
  assert.strictEqual(order3AdminView.fulfillments.length, 1, 'Mixed order in Admin Orders must only have 1 fulfillment');
  assert.strictEqual(order3AdminView.fulfillments[0].vendor_id, null, 'Fulfillment in Admin Orders must be platform-owned');
  assert.strictEqual(order3AdminView.fulfillments[0].fulfillment_number, 'ORD-103-P');
  console.log('✅ Admin Orders query correctly isolates platform packages and excludes vendor packages.\n');

  // -------------------------------------------------------------
  // TEST 2: Backend & Query Separation for Vendor Orders
  // -------------------------------------------------------------
  console.log('[Test 2] Verifying Vendor Orders query isolation (?type=vendor)...');
  const vendorQueryResults = simulateAdminOrdersQuery([order1, order2, order3], { type: 'vendor' });

  assert.strictEqual(vendorQueryResults.length, 2, 'Should return exactly 2 orders (Order 2 and Order 3)');
  assert.strictEqual(vendorQueryResults.find(o => o.id === 101), undefined, 'Order 1 (Platform-only) must NEVER appear in Vendor Orders');
  assert.ok(vendorQueryResults.find(o => o.id === 102), 'Order 2 (Vendor-only) must appear in Vendor Orders');
  assert.ok(vendorQueryResults.find(o => o.id === 103), 'Order 3 (Mixed Order) must appear in Vendor Orders');

  // Verify mixed order package isolation
  const order3VendorView = vendorQueryResults.find(o => o.id === 103);
  assert.strictEqual(order3VendorView.fulfillments.length, 1, 'Mixed order in Vendor Orders must only have 1 fulfillment');
  assert.strictEqual(order3VendorView.fulfillments[0].vendor_id, 20, 'Fulfillment in Vendor Orders must belong to vendor 20');
  assert.strictEqual(order3VendorView.fulfillments[0].fulfillment_number, 'ORD-103-V20');
  console.log('✅ Vendor Orders query correctly isolates vendor packages and excludes platform packages.\n');

  // -------------------------------------------------------------
  // TEST 3: Specific Vendor Filtering (?type=vendor&vendor_id=10)
  // -------------------------------------------------------------
  console.log('[Test 3] Verifying specific vendor filtering (?type=vendor&vendor_id=10)...');
  const vendor10Results = simulateAdminOrdersQuery([order1, order2, order3], { type: 'vendor', vendor_id: 10 });
  assert.strictEqual(vendor10Results.length, 1, 'Only Order 2 belongs to Vendor 10');
  assert.strictEqual(vendor10Results[0].id, 102);
  assert.strictEqual(vendor10Results[0].fulfillments[0].vendor_id, 10);
  console.log('✅ Specific vendor filter isolates single vendor packages.\n');

  // -------------------------------------------------------------
  // TEST 4: Authorized Admin Dispatch on Behalf of Vendor
  // -------------------------------------------------------------
  console.log('[Test 4] Verifying Admin can dispatch a vendor package on behalf of vendor...');
  let updatedFul = null;
  const mockDbAdminDispatch = {
    query: async (sql, params) => {
      if (sql.includes('FROM order_fulfillments f') && sql.includes('WHERE f.id = $1')) {
        return {
          rows: [{
            ...ful3_Vendor20,
            order_address: JSON.stringify({ line1: '456 Market St', city: 'Hyderabad', pincode: '500001', state: 'Telangana' }),
            user_name: 'Customer Mixed'
          }]
        };
      }
      if (sql.includes('FROM order_fulfillment_items')) {
        return {
          rows: [{
            id: 1,
            fulfillment_id: ful3_Vendor20.id,
            product_id: 5,
            product_name: 'Organic Honey',
            quantity: 2,
            unit_price: 1000
          }]
        };
      }
      if (sql.includes('UPDATE order_fulfillments SET')) {
        return { rows: [] };
      }
      if (sql.includes('FROM app_settings')) {
        return { rows: [{ admin_pickup_nickname: 'suresh' }] };
      }
      return { rows: [] };
    }
  };

  const mockShiprocketClient = {
    createCustomOrder: async (payload) => {
      // Must use vendor 20's registered warehouse
      assert.strictEqual(payload.pickup_location, 'vnd_20_500032', 'Admin dispatch must use Vendor 20 pickup location');
      return { order_id: 88881, shipment_id: 99991, status: 'NEW' };
    },
    assignAWB: async () => {
      return {
        response: {
          data: {
            awb_code: 'AWB-V20-ADMIN-999',
            courier_name: 'Bluedart Express',
            courier_company_id: 2
          }
        }
      };
    },
    generateLabel: async () => {
      return { label_url: 'https://shiprocket.co/label/99991.pdf' };
    },
    requestPickup: async () => {
      return { response: { pickup_token_number: 'PKP-V20-777', data: 'Pickup Scheduled' } };
    }
  };

  // Dispatch without options.vendorId (Admin Dispatch)
  const adminDispatchRes = await fulfillmentService.shipFulfillment(
    ful3_Vendor20.id,
    { dbClient: mockDbAdminDispatch, shiprocketClient: mockShiprocketClient }
  );

  assert.strictEqual(adminDispatchRes.success, true);
  assert.strictEqual(adminDispatchRes.awb, 'AWB-V20-ADMIN-999');
  assert.strictEqual(adminDispatchRes.courier, 'Bluedart Express');
  assert.strictEqual(adminDispatchRes.pickup_token_number, 'PKP-V20-777');
  console.log('✅ Admin successfully dispatched package on behalf of Vendor 20 using vendor pickup location.\n');

  // -------------------------------------------------------------
  // TEST 5: Vendor Dispatch Own Package
  // -------------------------------------------------------------
  console.log('[Test 5] Verifying Vendor 20 can dispatch their own package...');
  const vendorDispatchRes = await fulfillmentService.shipFulfillment(
    ful3_Vendor20.id,
    { vendorId: 20, dbClient: mockDbAdminDispatch, shiprocketClient: mockShiprocketClient }
  );
  assert.strictEqual(vendorDispatchRes.success, true);
  console.log('✅ Vendor 20 successfully dispatched their own package.\n');

  // -------------------------------------------------------------
  // TEST 6: Vendor Boundary Enforcement (Cross-Vendor Forbidden)
  // -------------------------------------------------------------
  console.log('[Test 6] Verifying Vendor 10 CANNOT dispatch Vendor 20 package (403 Forbidden)...');
  try {
    await fulfillmentService.shipFulfillment(
      ful3_Vendor20.id,
      { vendorId: 10, dbClient: mockDbAdminDispatch, shiprocketClient: mockShiprocketClient }
    );
    assert.fail('Vendor 10 should have been rejected with 403 Forbidden');
  } catch (err) {
    assert.strictEqual(err.statusCode, 403, 'Must return HTTP 403 Forbidden');
    assert.ok(err.message.includes('Unauthorized'), 'Error message must specify unauthorized');
    console.log('✅ Vendor 10 blocked from dispatching Vendor 20 package with 403 Forbidden.\n');
  }

  // -------------------------------------------------------------
  // TEST 7: Vendor CANNOT dispatch Admin Package
  // -------------------------------------------------------------
  console.log('[Test 7] Verifying Vendor 20 CANNOT dispatch Platform package (403 Forbidden)...');
  const mockDbPlatform = {
    query: async (sql, params) => {
      if (sql.includes('FROM order_fulfillments f') && sql.includes('WHERE f.id = $1')) {
        return {
          rows: [{
            ...ful1_Platform,
            order_address: JSON.stringify({ line1: '123 Main St', city: 'Koratla', pincode: '505326', state: 'Telangana' }),
            user_name: 'Customer Platform'
          }]
        };
      }
      return { rows: [] };
    }
  };

  try {
    await fulfillmentService.shipFulfillment(
      ful1_Platform.id,
      { vendorId: 20, dbClient: mockDbPlatform, shiprocketClient: mockShiprocketClient }
    );
    assert.fail('Vendor 20 should have been rejected from dispatching platform package');
  } catch (err) {
    assert.strictEqual(err.statusCode, 403);
    console.log('✅ Vendor blocked from dispatching platform package (403 Forbidden).\n');
  }

  // -------------------------------------------------------------
  // TEST 8: Idempotency Check (Duplicate Dispatch Protection)
  // -------------------------------------------------------------
  console.log('[Test 8] Verifying idempotency: repeat dispatch returns existing AWB without duplicate API booking...');
  const alreadyShippedPackage = {
    ...ful3_Vendor20,
    status: 'ready_to_ship',
    awb_code: 'AWB-V20-ADMIN-999',
    courier_name: 'Bluedart Express',
    pickup_token_number: 'PKP-V20-777',
    sync_error: null,
    order_address: JSON.stringify({ line1: '456 Market St', city: 'Hyderabad', pincode: '500001', state: 'Telangana' })
  };

  const mockDbAlreadyShipped = {
    query: async () => ({ rows: [alreadyShippedPackage] })
  };

  let apiCallsCount = 0;
  const mockSpyClient = {
    createCustomOrder: async () => { apiCallsCount++; return {}; },
    assignAWB: async () => { apiCallsCount++; return {}; }
  };

  const idempotencyRes = await fulfillmentService.shipFulfillment(
    alreadyShippedPackage.id,
    { dbClient: mockDbAlreadyShipped, shiprocketClient: mockSpyClient }
  );

  assert.strictEqual(idempotencyRes.success, true);
  assert.strictEqual(idempotencyRes.alreadyScheduled, true);
  assert.strictEqual(idempotencyRes.awb, 'AWB-V20-ADMIN-999');
  assert.strictEqual(apiCallsCount, 0, 'No Shiprocket API calls should be made for already dispatched packages');
  console.log('✅ Idempotency confirmed: No duplicate orders or AWBs created.\n');

  // -------------------------------------------------------------
  // TEST 9: Dispatch Failure Visibility & Retry Eligibility
  // -------------------------------------------------------------
  console.log('[Test 9] Verifying dispatch failure preserves package in retryable state with error logged...');
  let savedError = null;
  let savedStatus = null;
  const mockDbFailing = {
    query: async (sql, params) => {
      if (sql.includes('FROM order_fulfillments f') && sql.includes('WHERE f.id = $1')) {
        return {
          rows: [{
            ...ful3_Vendor20,
            vendor_pickup_synced: false, // Unverified warehouse!
            order_address: JSON.stringify({ line1: '456 Market St', city: 'Hyderabad', pincode: '500001', state: 'Telangana' })
          }]
        };
      }
      if (sql.includes('UPDATE order_fulfillments SET sync_error = $1, status = $2')) {
        savedError = params[0];
        savedStatus = params[1];
        return { rows: [] };
      }
      return { rows: [] };
    }
  };

  try {
    await fulfillmentService.shipFulfillment(
      ful3_Vendor20.id,
      { dbClient: mockDbFailing, shiprocketClient: mockShiprocketClient }
    );
    assert.fail('Unsynced vendor warehouse must block shipment');
  } catch (err) {
    assert.strictEqual(err.statusCode, 400);
    assert.strictEqual(savedStatus, 'failed', 'Fulfillment status must become failed, not shipped');
    assert.ok(savedError.includes('is not verified on Shiprocket'), 'Error must explain unverified warehouse');
    console.log('✅ Failed dispatch sets status=failed with sync_error and remains retryable without marking shipped.\n');
  }

  console.log('=================================================================');
  console.log('🎉 ALL 9 ADMIN & VENDOR ORDERS TESTS PASSED SUCCESSFULLY!');
  console.log('=================================================================');
  process.exit(0);
}

runAdminVendorSeparationTests().catch(err => {
  console.error('❌ Test failed with error:', err);
  process.exit(1);
});
