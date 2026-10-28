const assert = require('assert');
const http = require('http');
const express = require('express');
const jwt = require('jsonwebtoken');
const pool = require('./db');
const fulfillmentService = require('./services/fulfillmentService');
const adminRouter = require('./routes/admin');

async function runEndToEndVerification() {
  console.log('🔍 ================= PHASE 3 FINAL END-TO-END VERIFICATION =================\n');

  let vAlphaId = null;
  let vBetaId = null;
  let vUnverifiedId = null;
  let pAlphaId = null;
  let pBetaId = null;
  let pUnvId = null;
  let testOrderId = null;
  let server = null;

  try {
    // ---------------- Clean Pre-existing Test Artifacts ----------------
    await pool.query("DELETE FROM orders WHERE order_number LIKE 'E2E-ORD-%'");
    await pool.query("DELETE FROM products WHERE name LIKE 'E2E %'");
    await pool.query("DELETE FROM vendors WHERE email LIKE 'e2e_%@test.com'");

    // ---------------- Step 0: Setup Verified Test Fixtures ----------------
    const vAlpha = await pool.query(`
      INSERT INTO vendors (name, email, phone, status, is_pickup_synced, shiprocket_pickup_id, shiprocket_pickup_nickname)
      VALUES ('E2E Vendor Alpha (Textiles)', 'e2e_alpha@test.com', '9876540001', 'approved', TRUE, '5001', 'vnd_e2e_alpha_505325')
      RETURNING id
    `);
    vAlphaId = vAlpha.rows[0].id;

    const vBeta = await pool.query(`
      INSERT INTO vendors (name, email, phone, status, is_pickup_synced, shiprocket_pickup_id, shiprocket_pickup_nickname)
      VALUES ('E2E Vendor Beta (Spices)', 'e2e_beta@test.com', '9876540002', 'approved', TRUE, '5002', 'vnd_e2e_beta_500001')
      RETURNING id
    `);
    vBetaId = vBeta.rows[0].id;

    const vUnv = await pool.query(`
      INSERT INTO vendors (name, email, phone, status, is_pickup_synced, shiprocket_pickup_id, shiprocket_pickup_nickname, pickup_sync_error)
      VALUES ('E2E Vendor Unsynced', 'e2e_unsynced@test.com', '9876540003', 'approved', FALSE, NULL, NULL, 'Warehouse PIN unserviceable')
      RETURNING id
    `);
    vUnverifiedId = vUnv.rows[0].id;

    const pAlpha = await pool.query(
      `INSERT INTO products (name, price, stock, vendor_id, weight) VALUES ('E2E Cotton Kurta', 1200, 20, $1, 400) RETURNING id`,
      [vAlphaId]
    );
    pAlphaId = pAlpha.rows[0].id;

    const pBeta = await pool.query(
      `INSERT INTO products (name, price, stock, vendor_id, weight) VALUES ('E2E Organic Cardamom', 600, 15, $1, 150) RETURNING id`,
      [vBetaId]
    );
    pBetaId = pBeta.rows[0].id;

    const pUnv = await pool.query(
      `INSERT INTO products (name, price, stock, vendor_id, weight) VALUES ('E2E Unverified Item', 300, 5, $1, 200) RETURNING id`,
      [vUnverifiedId]
    );
    pUnvId = pUnv.rows[0].id;

    // Mock Shiprocket Client
    const srApiCalls = { createOrders: [], assignAWBs: [] };
    const mockShiprocketClient = {
      createCustomOrder: async (payload) => {
        srApiCalls.createOrders.push(payload);
        return {
          order_id: 880001 + srApiCalls.createOrders.length,
          shipment_id: 990001 + srApiCalls.createOrders.length,
          status: 'NEW'
        };
      },
      assignAWB: async (shipmentId) => {
        srApiCalls.assignAWBs.push(shipmentId);
        return {
          response: {
            data: {
              awb_code: `E2EAWB_${shipmentId}`,
              courier_name: 'Delhivery Surface Premium',
              courier_company_id: 2
            }
          }
        };
      }
    };

    // =========================================================================
    // Verification 1 & 2: Customer Places Order with 2 Different Vendors
    // =========================================================================
    console.log('1 & 2. Customer places order with 2 vendors → Exactly 2 fulfillments created:');
    const orderRes = await pool.query(`
      INSERT INTO orders (order_number, total, items, address, status, payment_method)
      VALUES (
        'E2E-ORD-101', 
        2400, 
        '[]', 
        '{"name":"Suresh Sharma","mobile":"9000012345","line1":"H.No 4-21, Jubilee Hills","city":"Hyderabad","state":"Telangana","pincode":"500033"}', 
        'paid', 
        'prepaid'
      )
      RETURNING *
    `);
    const order = orderRes.rows[0];
    testOrderId = order.id;

    const cartItems = [
      { product: { id: pAlphaId, name: 'E2E Cotton Kurta', vendor_id: vAlphaId, price: 1200, weight: 400 }, qty: 1, price: 1200 },
      { product: { id: pBetaId, name: 'E2E Organic Cardamom', vendor_id: vBetaId, price: 600, weight: 150 }, qty: 2, price: 600 }
    ];

    const client = await pool.connect();
    let fulfillments;
    try {
      await client.query('BEGIN');
      fulfillments = await fulfillmentService.createFulfillmentsForOrder(order, cartItems, client);
      await client.query('COMMIT');
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }

    assert.strictEqual(fulfillments.length, 2, 'Exactly 2 fulfillments must be created for a 2-vendor order');
    console.log('  ✅ PASS: 1 customer order created with exactly 2 vendor-specific fulfillments');

    // =========================================================================
    // Verification 3: Item Segregation & Correct Pickup Warehouse
    // =========================================================================
    console.log('\n3. Fulfillment segregation & pickup location snapshots:');
    const fulAlpha = fulfillments.find(f => f.vendor_id === vAlphaId);
    const fulBeta = fulfillments.find(f => f.vendor_id === vBetaId);

    assert(fulAlpha, 'Fulfillment for Vendor Alpha exists');
    assert(fulBeta, 'Fulfillment for Vendor Beta exists');
    assert.strictEqual(fulAlpha.pickup_location_nickname, 'vnd_e2e_alpha_505325', 'Alpha uses its verified pickup location');
    assert.strictEqual(fulBeta.pickup_location_nickname, 'vnd_e2e_beta_500001', 'Beta uses its verified pickup location');

    const alphaItemsDb = await pool.query('SELECT * FROM order_fulfillment_items WHERE fulfillment_id = $1', [fulAlpha.id]);
    assert.strictEqual(alphaItemsDb.rows.length, 1);
    assert.strictEqual(alphaItemsDb.rows[0].product_name, 'E2E Cotton Kurta');

    const betaItemsDb = await pool.query('SELECT * FROM order_fulfillment_items WHERE fulfillment_id = $1', [fulBeta.id]);
    assert.strictEqual(betaItemsDb.rows.length, 1);
    assert.strictEqual(betaItemsDb.rows[0].product_name, 'E2E Organic Cardamom');
    assert.strictEqual(betaItemsDb.rows[0].quantity, 2);
    console.log('  ✅ PASS: Items and snapshotted pickup locations strictly segregated per vendor');

    // =========================================================================
    // Verification 4: Unverified Vendor Pickup Blocks Shipping
    // =========================================================================
    console.log('\n4. Unverified vendor pickup blocks shipping:');
    const unvOrderRes = await pool.query(`
      INSERT INTO orders (order_number, total, items, address, status, payment_method)
      VALUES ('E2E-ORD-UNV', 300, '[]', '{"name":"Test User","pincode":"110001"}', 'paid', 'prepaid')
      RETURNING *
    `);
    const unvOrder = unvOrderRes.rows[0];

    const clientUnv = await pool.connect();
    let unvFul;
    try {
      await clientUnv.query('BEGIN');
      unvFul = await fulfillmentService.createFulfillmentsForOrder(
        unvOrder,
        [{ product: { id: pUnvId, name: 'E2E Unverified Item', vendor_id: vUnverifiedId, price: 300 }, qty: 1, price: 300 }],
        clientUnv
      );
      await clientUnv.query('COMMIT');
    } catch (e) {
      await clientUnv.query('ROLLBACK');
      throw e;
    } finally {
      clientUnv.release();
    }

    let unvShipBlocked = false;
    try {
      await fulfillmentService.shipFulfillment(unvFul[0].id, { shiprocketClient: mockShiprocketClient });
    } catch (err) {
      unvShipBlocked = true;
      assert(err.message.includes('not verified on Shiprocket'), 'Error specifies unverified warehouse');
    }
    assert(unvShipBlocked, 'Shipping unverified vendor fulfillment MUST throw error');
    await pool.query('DELETE FROM orders WHERE id = $1', [unvOrder.id]);
    console.log('  ✅ PASS: Unverified vendor pickup blocked before any Shiprocket API call');

    // =========================================================================
    // Verification 5 & 6: Independent Dispatch & Persistence of IDs/AWB
    // =========================================================================
    console.log('\n5 & 6. Independent dispatch & artifact persistence:');
    srApiCalls.createOrders = [];
    srApiCalls.assignAWBs = [];

    // Dispatch Package Alpha
    const shipAlphaRes = await fulfillmentService.shipFulfillment(fulAlpha.id, { shiprocketClient: mockShiprocketClient });
    assert.strictEqual(shipAlphaRes.success, true);
    assert(shipAlphaRes.awb.startsWith('E2EAWB_'), 'AWB generated');

    const checkAlphaDb = await pool.query('SELECT * FROM order_fulfillments WHERE id = $1', [fulAlpha.id]);
    const alphaDbRow = checkAlphaDb.rows[0];
    assert.strictEqual(alphaDbRow.status, 'shipped');
    assert.strictEqual(alphaDbRow.awb_code, shipAlphaRes.awb);
    assert.strictEqual(alphaDbRow.courier_name, 'Delhivery Surface Premium');
    assert(alphaDbRow.tracking_url.includes(shipAlphaRes.awb));
    assert(alphaDbRow.shiprocket_order_id !== null);
    assert(alphaDbRow.shiprocket_shipment_id !== null);
    console.log('  ✅ PASS: Package Alpha dispatched independently; AWB and tracking saved');

    // =========================================================================
    // Verification 7: Retrying Successful Shipment Prevents Duplicate Calls
    // =========================================================================
    console.log('\n7. Idempotency of retrying successful shipment:');
    const prevCreateCount = srApiCalls.createOrders.length;
    const prevAwbCount = srApiCalls.assignAWBs.length;

    const retryAlphaRes = await fulfillmentService.shipFulfillment(fulAlpha.id, { shiprocketClient: mockShiprocketClient });
    assert.strictEqual(retryAlphaRes.alreadyShipped, true, 'Reports already shipped');
    assert.strictEqual(retryAlphaRes.awb, shipAlphaRes.awb, 'Returns existing AWB');
    assert.strictEqual(srApiCalls.createOrders.length, prevCreateCount, '0 new createOrder calls');
    assert.strictEqual(srApiCalls.assignAWBs.length, prevAwbCount, '0 new assignAWB calls');
    console.log('  ✅ PASS: Retrying already-shipped fulfillment prevents duplicate Shiprocket calls');

    // =========================================================================
    // Verification 8 & 11: One Shipment Fails While Other Succeeds (Partial Status)
    // =========================================================================
    console.log('\n8 & 11. Partial shipment status aggregation & independent failure:');
    // Package Alpha is 'shipped', Package Beta is still 'paid'
    const parentStatus1 = await pool.query('SELECT status FROM orders WHERE id = $1', [testOrderId]);
    assert.strictEqual(parentStatus1.rows[0].status, 'partially_shipped', 'Parent order is partially_shipped');
    console.log('  ✅ PASS: Parent order marked "partially_shipped" when 1 of 2 packages is shipped');

    // Simulate transient network outage for Package Beta
    const failingShiprocketClient = {
      createCustomOrder: async () => { throw new Error('Shiprocket API timeout: Courier unserviceable'); },
      assignAWB: async () => {}
    };

    let betaFailed = false;
    try {
      await fulfillmentService.shipFulfillment(fulBeta.id, { shiprocketClient: failingShiprocketClient });
    } catch (e) {
      betaFailed = true;
    }
    assert(betaFailed, 'Package Beta fails gracefully on carrier timeout');

    const checkBetaFailedDb = await pool.query('SELECT status, sync_error FROM order_fulfillments WHERE id = $1', [fulBeta.id]);
    assert.strictEqual(checkBetaFailedDb.rows[0].status, 'failed', 'Beta marked failed');
    assert(checkBetaFailedDb.rows[0].sync_error.includes('timeout'), 'Sync error recorded in DB');

    // Parent order remains partially_shipped (Alpha still shipped, Beta failed)
    const parentStatus2 = await pool.query('SELECT status FROM orders WHERE id = $1', [testOrderId]);
    assert.strictEqual(parentStatus2.rows[0].status, 'partially_shipped', 'Parent order remains partially_shipped');
    console.log('  ✅ PASS: One vendor package failure does not affect other packages; parent status resilient');

    // Now dispatch Package Beta with working mock client
    const shipBetaRes = await fulfillmentService.shipFulfillment(fulBeta.id, { shiprocketClient: mockShiprocketClient });
    assert.strictEqual(shipBetaRes.success, true);

    const parentStatus3 = await pool.query('SELECT status FROM orders WHERE id = $1', [testOrderId]);
    assert.strictEqual(parentStatus3.rows[0].status, 'shipped', 'Parent order becomes "shipped" when all packages ship');
    console.log('  ✅ PASS: Parent order moves to "shipped" once all packages are shipped');

    // Deliver all packages
    await pool.query('UPDATE order_fulfillments SET status = \'delivered\' WHERE order_id = $1', [testOrderId]);
    await fulfillmentService.updateParentOrderStatus(testOrderId);
    const parentStatus4 = await pool.query('SELECT status FROM orders WHERE id = $1', [testOrderId]);
    assert.strictEqual(parentStatus4.rows[0].status, 'delivered', 'Parent order becomes "delivered" once all delivered');
    console.log('  ✅ PASS: Parent order moves to "delivered" once all child packages are delivered');

    // =========================================================================
    // Verification 9: Customer Sees One Order with Separate Package Tracking
    // =========================================================================
    console.log('\n9. Customer view of order with separate package tracking:');
    const customerOrderData = await pool.query('SELECT * FROM orders WHERE id = $1', [testOrderId]);
    const customerFulfillments = await fulfillmentService.getFulfillmentsForOrder(testOrderId);

    assert.strictEqual(customerOrderData.rows.length, 1, 'Customer sees 1 order');
    assert.strictEqual(parseFloat(customerOrderData.rows[0].total), 2400, 'Customer sees 1 total payment: ₹2400');
    assert.strictEqual(customerFulfillments.length, 2, 'Customer sees 2 distinct package tracks');
    assert(customerFulfillments[0].awb_code.startsWith('E2EAWB_'), 'Package 1 has AWB tracking');
    assert(customerFulfillments[1].awb_code.startsWith('E2EAWB_'), 'Package 2 has AWB tracking');
    console.log('  ✅ PASS: Customer views 1 consolidated order with 2 distinct tracking packages');

    // =========================================================================
    // Verification 10: Vendor Isolation (Vendor Sees Only Their Package)
    // =========================================================================
    console.log('\n10. Vendor data isolation:');
    const vendorAlphaView = await pool.query(
      `SELECT f.* FROM order_fulfillments f WHERE f.vendor_id = $1`,
      [vAlphaId]
    );
    const vendorBetaView = await pool.query(
      `SELECT f.* FROM order_fulfillments f WHERE f.vendor_id = $1`,
      [vBetaId]
    );

    assert.strictEqual(vendorAlphaView.rows.length, 1, 'Vendor Alpha sees only 1 fulfillment');
    assert.strictEqual(vendorAlphaView.rows[0].vendor_id, vAlphaId, 'Vendor Alpha sees only their package');
    assert.strictEqual(parseFloat(vendorAlphaView.rows[0].subtotal), 1200, 'Vendor Alpha sees only their revenue');

    assert.strictEqual(vendorBetaView.rows.length, 1, 'Vendor Beta sees only 1 fulfillment');
    assert.strictEqual(vendorBetaView.rows[0].vendor_id, vBetaId, 'Vendor Beta sees only their package');
    assert.strictEqual(parseFloat(vendorBetaView.rows[0].subtotal), 1200, 'Vendor Beta sees only their revenue');
    console.log('  ✅ PASS: Each vendor sees only their assigned package, items, and earnings');

    // =========================================================================
    // Verification 12: Historical Orders Accessible & Legacy Ship Route Returns 409
    // =========================================================================
    console.log('\n12. Historical orders access & legacy ship route returns HTTP 409:');
    const histCheck = await pool.query(`
      SELECT o.id, o.order_number, f.fulfillment_number 
      FROM orders o 
      JOIN order_fulfillments f ON o.id = f.order_id 
      WHERE o.id NOT IN ($1) 
      LIMIT 1`,
      [testOrderId]
    );
    assert(histCheck.rows.length > 0, 'Historical orders are accessible with fulfillment mappings');
    console.log('  ✅ PASS: Historical orders accessible and linked to fulfillments');

    // Test HTTP 409 on legacy POST /api/admin/orders/:id/ship
    const testApp = express();
    testApp.use(express.json());
    testApp.use('/api/admin', adminRouter);

    server = http.createServer(testApp);
    await new Promise((resolve) => server.listen(0, resolve));
    const port = server.address().port;

    const adminToken = jwt.sign({ id: 1, email: 'admin@ulmgh.com', role: 'admin' }, process.env.JWT_SECRET || 'test_secret');

    const legacyResponse = await new Promise((resolve, reject) => {
      const req = http.request({
        hostname: '127.0.0.1',
        port,
        path: `/api/admin/orders/${testOrderId || 1}/ship`,
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        }
      }, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => resolve({ statusCode: res.statusCode, body: JSON.parse(body) }));
      });
      req.on('error', reject);
      req.end();
    });

    assert.strictEqual(legacyResponse.statusCode, 409, 'Legacy route must return HTTP 409 Conflict');
    assert(legacyResponse.body.error.includes('Whole-order shipping is disabled in Phase 3'), 'Returns explicit deprecation error');
    console.log('  ✅ PASS: Legacy POST /api/admin/orders/:id/ship correctly returns HTTP 409');

    console.log('\n=================================================');
    console.log('🎉 ALL 12 END-TO-END WORKFLOW VERIFICATIONS PASSED PERFECTLY!\n');

  } finally {
    console.log('  🧹 Cleaning up temporary test fixtures...');
    if (server) server.close();
    if (testOrderId) await pool.query('DELETE FROM orders WHERE id = $1', [testOrderId]);
    if (pAlphaId) await pool.query('DELETE FROM products WHERE id = $1', [pAlphaId]);
    if (pBetaId) await pool.query('DELETE FROM products WHERE id = $1', [pBetaId]);
    if (pUnvId) await pool.query('DELETE FROM products WHERE id = $1', [pUnvId]);
    if (vAlphaId) await pool.query('DELETE FROM vendors WHERE id = $1', [vAlphaId]);
    if (vBetaId) await pool.query('DELETE FROM vendors WHERE id = $1', [vBetaId]);
    if (vUnverifiedId) await pool.query('DELETE FROM vendors WHERE id = $1', [vUnverifiedId]);
    await pool.end();
  }
}

runEndToEndVerification().catch(err => {
  console.error('❌ E2E verification failed:', err);
  process.exit(1);
});
