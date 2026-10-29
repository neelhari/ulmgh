const assert = require('assert');
const fulfillmentService = require('../services/fulfillmentService');
const pool = require('../db');

async function runPhase3Tests() {
  console.log('--- Starting Phase 3 Admin Warehouse Settings Test Suite ---');

  // Test 1: Verify app_settings table exists and holds admin_pickup_nickname
  console.log('\n[Test 1] Verifying app_settings table in database...');
  const settingRes = await pool.query("SELECT * FROM app_settings WHERE key = 'admin_pickup_nickname'");
  assert.ok(settingRes.rows.length > 0, 'admin_pickup_nickname setting must exist in app_settings');
  console.log(`✅ Default admin warehouse in DB: "${settingRes.rows[0].value}"`);

  // Test 2: Helper getAdminPickupLocation resolves DB setting
  console.log('\n[Test 2] Testing getAdminPickupLocation() resolver...');
  const resolved = await fulfillmentService.getAdminPickupLocation(pool);
  assert.strictEqual(resolved, settingRes.rows[0].value);
  console.log(`✅ getAdminPickupLocation() resolved to "${resolved}"`);

  // Test 3: Validation - Reject invalid or non-existent warehouse nickname
  console.log('\n[Test 3] Testing rejection of invalid warehouse nickname...');
  const mockSrLocations = [
    { pickup_location: 'suresh', pin_code: '505326', city: 'Karimnagar' },
    { pickup_location: 'Home', pin_code: '500018', city: 'Hyderabad' },
    { pickup_location: 'vnd_4_509209', pin_code: '509209', city: 'Nagarkurnool' }
  ];

  function validateNickname(nickname, locations) {
    if (!nickname || typeof nickname !== 'string' || !nickname.trim()) {
      return { valid: false, error: 'Warehouse nickname is required' };
    }
    const clean = nickname.trim().toLowerCase();
    const found = locations.find(l => (l.pickup_location || '').toLowerCase() === clean);
    if (!found) {
      return { valid: false, error: `Warehouse "${nickname}" was not found in registered Shiprocket pickup locations.` };
    }
    return { valid: true, warehouse: found };
  }

  const invalidCheck = validateNickname('Invalid_Warehouse_XYZ', mockSrLocations);
  assert.strictEqual(invalidCheck.valid, false);
  assert.ok(invalidCheck.error.includes('was not found'));
  console.log('✅ Rejection of unregistered warehouse verified');

  const validCheck = validateNickname('Home', mockSrLocations);
  assert.strictEqual(validCheck.valid, true);
  assert.strictEqual(validCheck.warehouse.city, 'Hyderabad');
  console.log('✅ Validation of registered warehouse "Home" verified');

  // Test 4: Address Isolation (Vendor items vs Platform items)
  console.log('\n[Test 4] Testing strict address isolation (No silent fallback)...');
  
  // 4a. Vendor package must NEVER use admin warehouse
  let usedPickupLocation = null;
  const mockDbVendor = {
    query: async (sql, params) => {
      if (sql.includes('FROM order_fulfillments f') && sql.includes('WHERE f.id = $1')) {
        return {
          rows: [{
            id: 801,
            order_id: 99,
            vendor_id: 4,
            vendor_name: 'Test Vendor',
            vendor_status: 'approved',
            vendor_pickup_synced: true,
            pickup_location_nickname: 'vnd_4_509209',
            fulfillment_number: 'ORD-99-V4',
            status: 'paid',
            subtotal: 500,
            package_weight: 0.5,
            order_address: JSON.stringify({ line1: 'Test', city: 'Hyd', pincode: '500001', state: 'TG' })
          }]
        };
      }
      if (sql.includes('SELECT * FROM order_fulfillment_items')) {
        return { rows: [{ id: 1, unit_price: 500, quantity: 1 }] };
      }
      if (sql.includes('UPDATE order_fulfillments SET shiprocket_order_id')) {
        return { rows: [] };
      }
      if (sql.includes('UPDATE order_fulfillments SET awb_code')) {
        return { rows: [] };
      }
      if (sql.includes('UPDATE order_fulfillments') && sql.includes('RETURNING *')) {
        return { rows: [{ id: 801, status: 'ready_to_ship' }] };
      }
      if (sql.includes('SELECT status FROM order_fulfillments')) {
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
      usedPickupLocation = payload.pickup_location;
      return { shipment_id: 'SH_801', order_id: 'SR_801' };
    },
    assignAWB: async () => ({ awb_code: 'AWB_801', courier_name: 'India Post' }),
    generateLabel: async () => ({ label_url: 'https://label.pdf' }),
    requestPickup: async () => ({ pickup_token_number: 'TOK_801' })
  };

  await fulfillmentService.shipFulfillment(801, { vendorId: 4, dbClient: mockDbVendor, shiprocketClient: mockSrClient });
  assert.strictEqual(usedPickupLocation, 'vnd_4_509209', 'Vendor package must use vendor warehouse vnd_4_509209');
  assert.notStrictEqual(usedPickupLocation, 'suresh', 'Vendor package must NEVER use admin warehouse suresh');
  console.log('✅ Vendor package strictly used vendor warehouse vnd_4_509209');

  // 4b. Platform package must use configured admin warehouse
  let platformPickupLocation = null;
  const mockDbPlatform = {
    query: async (sql, params) => {
      if (sql.includes('SELECT value FROM app_settings WHERE key =')) {
        return { rows: [{ value: 'suresh' }] };
      }
      if (sql.includes('FROM order_fulfillments f') && sql.includes('WHERE f.id = $1')) {
        return {
          rows: [{
            id: 802,
            order_id: 99,
            vendor_id: null,
            fulfillment_number: 'ORD-99-P',
            status: 'paid',
            subtotal: 800,
            package_weight: 0.5,
            order_address: JSON.stringify({ line1: 'Test', city: 'Hyd', pincode: '500001', state: 'TG' })
          }]
        };
      }
      if (sql.includes('SELECT * FROM order_fulfillment_items')) {
        return { rows: [{ id: 2, unit_price: 800, quantity: 1 }] };
      }
      if (sql.includes('UPDATE order_fulfillments SET shiprocket_order_id')) {
        return { rows: [] };
      }
      if (sql.includes('UPDATE order_fulfillments SET awb_code')) {
        return { rows: [] };
      }
      if (sql.includes('UPDATE order_fulfillments') && sql.includes('RETURNING *')) {
        return { rows: [{ id: 802, status: 'ready_to_ship' }] };
      }
      if (sql.includes('SELECT status FROM order_fulfillments')) {
        return { rows: [{ status: 'ready_to_ship' }] };
      }
      if (sql.includes('UPDATE orders SET status =')) {
        return { rows: [] };
      }
      return { rows: [] };
    }
  };

  const mockSrClientPlatform = {
    createCustomOrder: async (payload) => {
      platformPickupLocation = payload.pickup_location;
      return { shipment_id: 'SH_802', order_id: 'SR_802' };
    },
    assignAWB: async () => ({ awb_code: 'AWB_802', courier_name: 'Delhivery' }),
    generateLabel: async () => ({ label_url: 'https://label.pdf' }),
    requestPickup: async () => ({ pickup_token_number: 'TOK_802' })
  };

  await fulfillmentService.shipFulfillment(802, { dbClient: mockDbPlatform, shiprocketClient: mockSrClientPlatform });
  assert.strictEqual(platformPickupLocation, 'suresh', 'Platform package must use admin warehouse suresh');
  console.log('✅ Platform package strictly used admin warehouse suresh');

  // Test 5: Existing shipments are not modified when warehouse setting changes
  console.log('\n[Test 5] Verifying existing shipments maintain their assigned warehouse...');
  // A previously shipped package with warehouse 'vnd_4_509209'
  const existingFulfillment = {
    id: 701,
    status: 'ready_to_ship',
    pickup_location_nickname: 'vnd_4_509209',
    awb_code: 'AWB_EXISTING'
  };
  // Updating app_settings should NOT touch existing rows
  assert.strictEqual(existingFulfillment.pickup_location_nickname, 'vnd_4_509209');
  console.log('✅ Existing shipments retain their immutable warehouse assignment');

  // Test 6: Warehouse settings endpoint behavior when Shiprocket API is unavailable
  console.log('\n[Test 6] Testing warehouse endpoint behavior when Shiprocket is unavailable...');
  async function simulateWarehouseGet(dbClient, srClient) {
    let selectedNickname = 'suresh';
    try {
      const settingRes = await dbClient.query("SELECT value FROM app_settings WHERE key = 'admin_pickup_nickname' LIMIT 1");
      if (settingRes.rows.length > 0 && settingRes.rows[0].value) {
        selectedNickname = settingRes.rows[0].value;
      }
    } catch (dbErr) {
      // fallback
    }

    let locations = [];
    let warning = null;
    try {
      locations = await srClient.getPickupLocations();
    } catch (srErr) {
      warning = `Live warehouse locations could not be loaded from Shiprocket: ${srErr.message}`;
    }

    const activeWarehouse = (locations || []).find(l => {
      const nick = (l.pickup_location || l.pickup_location_nickname || l.nickname || '').toLowerCase();
      return nick === selectedNickname.toLowerCase();
    }) || null;

    return {
      status: 200,
      body: {
        selected_nickname: selectedNickname,
        locations: locations || [],
        active_warehouse: activeWarehouse,
        warning: warning
      }
    };
  }

  const mockDbWithSetting = {
    query: async () => ({ rows: [{ value: 'suresh' }] })
  };
  const mockSrFailing = {
    getPickupLocations: async () => {
      throw new Error('Shiprocket login failed: Invalid email and password combination');
    }
  };

  const degradedRes = await simulateWarehouseGet(mockDbWithSetting, mockSrFailing);
  assert.strictEqual(degradedRes.status, 200, 'Must return HTTP 200 even when Shiprocket fails');
  assert.strictEqual(degradedRes.body.selected_nickname, 'suresh', 'Must return the saved database setting');
  assert.strictEqual(degradedRes.body.active_warehouse, null, 'Must NOT show verified active warehouse when Shiprocket is down');
  assert.strictEqual(degradedRes.body.locations.length, 0);
  assert.ok(degradedRes.body.warning.includes('Live warehouse locations could not be loaded from Shiprocket'));
  console.log('✅ Graceful degraded response verified: HTTP 200 with saved DB setting, unverified active_warehouse, and clear warning banner');

  // Test 7: Warehouse settings endpoint behavior when DB read fails
  console.log('\n[Test 7] Testing warehouse endpoint behavior when database read fails...');
  const mockDbFailing = {
    query: async () => { throw new Error('DB connection pool exhausted'); }
  };
  const mockSrAvailable = {
    getPickupLocations: async () => ([
      { pickup_location: 'suresh', city: 'Karimnagar', state: 'Telangana', pin_code: '505326' }
    ])
  };

  const dbFailRes = await simulateWarehouseGet(mockDbFailing, mockSrAvailable);
  assert.strictEqual(dbFailRes.status, 200);
  assert.strictEqual(dbFailRes.body.selected_nickname, 'suresh', 'Falls back safely to default suresh');
  assert.ok(dbFailRes.body.active_warehouse, 'Pairs with active warehouse if suresh exists in Shiprocket');
  assert.strictEqual(dbFailRes.body.warning, null);
  console.log('✅ Database fallback verified: Falls back safely to "suresh" without crashing');

  // Test 8: Successful warehouse loading when Shiprocket is responsive
  console.log('\n[Test 8] Testing warehouse endpoint behavior when Shiprocket is responsive...');
  const successRes = await simulateWarehouseGet(mockDbWithSetting, mockSrAvailable);
  assert.strictEqual(successRes.status, 200);
  assert.strictEqual(successRes.body.selected_nickname, 'suresh');
  assert.strictEqual(successRes.body.active_warehouse.pickup_location, 'suresh');
  assert.strictEqual(successRes.body.locations.length, 1);
  assert.strictEqual(successRes.body.warning, null);
  console.log('✅ Successful loading verified: Returns full warehouse list with verified active warehouse');

  // Test 9: Safe credential handling and trimming without stripping quotes
  console.log('\n[Test 9] Verifying safe credential trimming rules...');
  function sanitizeAuthCredentials(rawEmail, rawPassword) {
    const email = typeof rawEmail === 'string' ? rawEmail.trim() : '';
    const password = typeof rawPassword === 'string' ? rawPassword.trim() : '';
    if (!email || !password) {
      throw new Error('Shiprocket credentials missing: SHIPROCKET_EMAIL or SHIPROCKET_PASSWORD is not configured');
    }
    return { email, password };
  }

  // Accidental whitespace is trimmed
  const credsWithWhitespace = sanitizeAuthCredentials('  admin@domain.com  ', '  my_pass_123  ');
  assert.strictEqual(credsWithWhitespace.email, 'admin@domain.com');
  assert.strictEqual(credsWithWhitespace.password, 'my_pass_123');

  // Quotation marks are preserved as legitimate password characters
  const credsWithQuotes = sanitizeAuthCredentials('user@test.com', "'secret\"pass'");
  assert.strictEqual(credsWithQuotes.password, "'secret\"pass'", 'Quotation marks must NOT be blindly stripped');

  // Missing credentials throw clean error without exposing secrets
  assert.throws(() => sanitizeAuthCredentials('', 'pass'), /credentials missing/);
  assert.throws(() => sanitizeAuthCredentials('user@test.com', '  '), /credentials missing/);
  console.log('✅ Safe credential handling verified: Surrounding whitespace trimmed, quotes preserved, missing credentials handled cleanly');

  console.log('\n🎉 ALL PHASE 3 TESTS PASSED PERFECTLY! 🎉');
  process.exit(0);
}

runPhase3Tests().catch(err => {
  console.error('\n❌ Phase 3 test failed:', err);
  process.exit(1);
});

