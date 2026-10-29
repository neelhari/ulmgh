const assert = require('assert');
const fulfillmentService = require('../services/fulfillmentService');

async function runPhase4Tests() {
  console.log('--- Starting Phase 4 End-to-End Workflow & Integration Test Suite ---');

  // SIMULATED MULTI-VENDOR CART & CHECKOUT
  console.log('\n[E2E Scenario 1] Simulating checkout splitting for Multi-Vendor Order...');
  
  const verifiedItems = [
    {
      product: { id: 101, name: 'Vendor 4 Herbal Tea', vendor_id: 4, weight: 200 },
      price: 450,
      qty: 2
    },
    {
      product: { id: 202, name: 'Platform Pure Honey', vendor_id: null, weight: 500 },
      price: 600,
      qty: 1
    }
  ];

  const mockOrder = {
    id: 999,
    order_number: 'ORD-999-E2E',
    payment_method: 'prepaid',
    created_at: new Date()
  };

  const createdPackages = [];
  const mockDbClient = {
    query: async (sql, params) => {
      if (sql.includes('SELECT * FROM vendors WHERE id = $1')) {
        return {
          rows: [{
            id: 4,
            name: 'Vendor 4 Hub',
            shiprocket_pickup_nickname: 'vnd_4_509209',
            shiprocket_pickup_id: '138079135'
          }]
        };
      }
      if (sql.includes('SELECT value FROM app_settings WHERE key =')) {
        return { rows: [{ value: 'suresh' }] };
      }
      if (sql.includes('INSERT INTO order_fulfillments')) {
        const pkg = {
          id: createdPackages.length + 1,
          order_id: params[0],
          vendor_id: params[1],
          fulfillment_number: params[2],
          status: params[3],
          subtotal: params[4],
          package_weight: params[6],
          pickup_location_nickname: params[7],
          shiprocket_pickup_id: params[8]
        };
        createdPackages.push(pkg);
        return { rows: [pkg] };
      }
      if (sql.includes('SELECT id FROM products WHERE id = $1')) {
        return { rows: [{ id: params[0] }] };
      }
      if (sql.includes('INSERT INTO order_fulfillment_items')) {
        return { rows: [] };
      }
      return { rows: [] };
    }
  };

  const fulfillments = await fulfillmentService.createFulfillmentsForOrder(mockOrder, verifiedItems, mockDbClient);

  assert.strictEqual(fulfillments.length, 2, 'Must create exactly 2 fulfillment packages');

  const vendorPkg = fulfillments.find(f => f.vendor_id === 4);
  const platformPkg = fulfillments.find(f => f.vendor_id === null);

  assert.ok(vendorPkg, 'Vendor package must exist');
  assert.ok(platformPkg, 'Platform package must exist');

  assert.strictEqual(vendorPkg.fulfillment_number, 'ORD-999-E2E-V4');
  assert.strictEqual(vendorPkg.pickup_location_nickname, 'vnd_4_509209', 'Vendor package must use vendor warehouse');

  assert.strictEqual(platformPkg.fulfillment_number, 'ORD-999-E2E-P');
  assert.strictEqual(platformPkg.pickup_location_nickname, 'suresh', 'Platform package must use admin warehouse suresh');

  console.log('✅ Multi-vendor order checkout successfully isolated packages:');
  console.log(`   - Package 1: ${vendorPkg.fulfillment_number} -> Warehouse: ${vendorPkg.pickup_location_nickname}`);
  console.log(`   - Package 2: ${platformPkg.fulfillment_number} -> Warehouse: ${platformPkg.pickup_location_nickname}`);

  // E2E SCENARIO 2: Vendor 4 Dispatches Package 1
  console.log('\n[E2E Scenario 2] Vendor 4 dispatches their package independently...');

  let vendorSrDispatched = false;
  let vendorSrWarehouse = null;

  const mockDbDispatchV4 = {
    query: async (sql, params) => {
      if (sql.includes('FROM order_fulfillments f') && sql.includes('WHERE f.id = $1')) {
        return {
          rows: [{
            ...vendorPkg,
            vendor_name: 'Vendor 4 Hub',
            vendor_status: 'approved',
            vendor_pickup_synced: true,
            order_address: JSON.stringify({ line1: 'Test St', city: 'Hyd', pincode: '500001', state: 'TG' })
          }]
        };
      }
      if (sql.includes('SELECT * FROM order_fulfillment_items')) {
        return { rows: [{ product_name: 'Vendor 4 Herbal Tea', unit_price: 450, quantity: 2 }] };
      }
      if (sql.includes('UPDATE order_fulfillments') && sql.includes('RETURNING *')) {
        return {
          rows: [{
            ...vendorPkg,
            status: 'ready_to_ship',
            awb_code: 'SH_V4_AWB_123',
            courier_name: 'India Post'
          }]
        };
      }
      if (sql.includes('SELECT status FROM order_fulfillments WHERE order_id = $1')) {
        // Vendor package is ready_to_ship, platform package is still paid
        return { rows: [{ status: 'ready_to_ship' }, { status: 'paid' }] };
      }
      if (sql.includes('UPDATE orders SET status =')) {
        assert.strictEqual(params[0], 'processing', 'Parent order is processing while one package ready');
        return { rows: [] };
      }
      return { rows: [] };
    }
  };

  const mockSrClientV4 = {
    createCustomOrder: async (payload) => {
      vendorSrDispatched = true;
      vendorSrWarehouse = payload.pickup_location;
      return { shipment_id: 'SH_V4_SR', order_id: 'ORD_V4_SR' };
    },
    assignAWB: async () => ({ awb_code: 'SH_V4_AWB_123', courier_name: 'India Post' }),
    generateLabel: async () => ({ label_url: 'https://label.pdf' }),
    requestPickup: async () => ({ pickup_token_number: 'TOK_12345' })
  };

  const dispatchRes = await fulfillmentService.shipFulfillment(
    vendorPkg.id,
    { vendorId: 4, dbClient: mockDbDispatchV4, shiprocketClient: mockSrClientV4 }
  );

  assert.strictEqual(dispatchRes.success, true);
  assert.strictEqual(vendorSrDispatched, true);
  assert.strictEqual(vendorSrWarehouse, 'vnd_4_509209', 'Vendor warehouse must be dispatched');
  assert.strictEqual(dispatchRes.status, 'ready_to_ship');
  console.log(`✅ Vendor 4 dispatched ${vendorPkg.fulfillment_number} with courier India Post (AWB: ${dispatchRes.awb})`);

  // E2E SCENARIO 3: Live Status Sync (India Post picks up parcel)
  console.log('\n[E2E Scenario 3] Syncing live courier tracking when parcel is in-transit...');

  let parentOrderStatus = null;
  const mockDbSync = {
    query: async (sql, params) => {
      if (sql.includes('FROM order_fulfillments f') && sql.includes('WHERE f.id = $1')) {
        return {
          rows: [{
            ...vendorPkg,
            status: 'ready_to_ship',
            awb_code: 'SH_V4_AWB_123'
          }]
        };
      }
      if (sql.includes('UPDATE order_fulfillments') && sql.includes('SET status = $1')) {
        return { rows: [{ ...vendorPkg, status: params[0] }] };
      }
      if (sql.includes('SELECT status FROM order_fulfillments WHERE order_id = $1')) {
        // Vendor package is shipped, platform package is still paid
        return { rows: [{ status: 'shipped' }, { status: 'paid' }] };
      }
      if (sql.includes('UPDATE orders SET status =')) {
        parentOrderStatus = params[0];
        return { rows: [] };
      }
      return { rows: [] };
    }
  };

  const mockSrClientTracking = {
    getTrackingByAwb: async (awb) => ({
      tracking_data: {
        track_status: 'IN TRANSIT',
        shipment_track_activities: [{ activity: 'Item Dispatched from Nagarkurnool Hub' }]
      }
    })
  };

  const syncRes = await fulfillmentService.syncFulfillmentStatus(vendorPkg.id, mockDbSync, mockSrClientTracking);
  assert.strictEqual(syncRes.synced, true);
  assert.strictEqual(syncRes.current_status, 'shipped');
  assert.strictEqual(parentOrderStatus, 'partially_shipped', 'Order must be partially_shipped when 1 of 2 is shipped');
  console.log(`✅ Live status synced to "shipped" | Parent order updated to "${parentOrderStatus}"`);

  // E2E SCENARIO 4: Cancellation Protection (Cannot cancel in-transit package)
  console.log('\n[E2E Scenario 4] Verifying cancellation restriction on in-transit package...');
  const mockDbInTransit = {
    query: async (sql, params) => {
      if (sql.includes('FROM order_fulfillments f') && sql.includes('WHERE f.id = $1')) {
        return {
          rows: [{
            ...vendorPkg,
            status: 'shipped',
            awb_code: 'SH_V4_AWB_123'
          }]
        };
      }
      return { rows: [] };
    }
  };

  try {
    await fulfillmentService.cancelFulfillmentPackage(vendorPkg.id, { cancelledBy: 'vendor', vendorId: 4 }, mockDbInTransit);
    assert.fail('Should NOT cancel in-transit package');
  } catch (err) {
    assert.strictEqual(err.statusCode, 400);
    assert.ok(err.message.includes('already been collected/shipped'));
    console.log('✅ In-transit package cancellation successfully rejected (400 Bad Request)');
  }

  // E2E SCENARIO 5: Admin cancels unshipped platform package safely
  console.log('\n[E2E Scenario 5] Admin cancels unshipped platform package and restores stock...');
  let platformStockRestored = false;

  const mockDbCancelPlatform = {
    connect: async () => ({
      query: async (sql, params) => {
        if (sql === 'BEGIN' || sql === 'COMMIT') return;
        if (sql.includes('SELECT product_id, quantity FROM order_fulfillment_items')) {
          return { rows: [{ product_id: 202, quantity: 1 }] };
        }
        if (sql.includes('UPDATE products SET stock = stock + $1 WHERE id = $2')) {
          assert.strictEqual(params[0], 1);
          assert.strictEqual(params[1], 202);
          platformStockRestored = true;
          return { rows: [] };
        }
        if (sql.includes("UPDATE order_fulfillments SET status = 'cancelled'")) {
          return { rows: [{ ...platformPkg, status: 'cancelled' }] };
        }
        if (sql.includes('SELECT status FROM order_fulfillments WHERE order_id = $1')) {
          return { rows: [{ status: 'shipped' }, { status: 'cancelled' }] };
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
            ...platformPkg,
            status: 'paid',
            awb_code: null
          }]
        };
      }
      return { rows: [] };
    }
  };

  const cancelPlatformRes = await fulfillmentService.cancelFulfillmentPackage(
    platformPkg.id,
    { cancelledBy: 'admin', reason: 'Customer requested cancellation of honey' },
    mockDbCancelPlatform
  );

  assert.strictEqual(cancelPlatformRes.success, true);
  assert.strictEqual(cancelPlatformRes.status, 'cancelled');
  assert.strictEqual(platformStockRestored, true, 'Stock for Product 202 must be restored');
  console.log('✅ Platform package cancelled and product stock restored successfully');

  console.log('\n🎉 ALL PHASE 4 END-TO-END INTEGRATION TESTS PASSED PERFECTLY! 🎉');
  process.exit(0);
}

runPhase4Tests().catch(err => {
  console.error('\n❌ Phase 4 E2E test failed:', err);
  process.exit(1);
});

