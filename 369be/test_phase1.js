require('dotenv').config();
const pool = require('./db');
const {
  isValidPincode,
  isValidIndianPhone,
  validatePickupAddress,
  generateShiprocketNickname,
  formatFullAddress,
  INDIAN_STATES
} = require('./utils/pickupValidation');
const { calculateOrder } = require('./utils/pricing');

async function runTests() {
  console.log('🧪 ================= PHASE 1 TEST SUITE =================\n');
  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  }

  // 1. UNIT TESTS: Pincode & Validation
  console.log('1. Testing Pincode & Phone Validation:');
  assert(isValidPincode('505325') === true, 'Valid Telangana pincode 505325');
  assert(isValidPincode('110001') === true, 'Valid Delhi pincode 110001');
  assert(isValidPincode('012345') === false, 'Invalid pincode starting with 0');
  assert(isValidPincode('12345') === false, 'Invalid 5-digit pincode');
  assert(isValidPincode('1234567') === false, 'Invalid 7-digit pincode');
  assert(isValidPincode('ABCDEF') === false, 'Invalid alphanumeric pincode');

  assert(isValidIndianPhone('9032675205') === true, 'Valid 10-digit Indian phone starting with 9');
  assert(isValidIndianPhone('+919032675205') === true, 'Valid phone with +91 prefix');
  assert(isValidIndianPhone('5032675205') === false, 'Invalid phone starting with 5');
  assert(isValidIndianPhone('12345') === false, 'Invalid short phone');

  // 2. UNIT TESTS: Address Validation & Nickname Generation
  console.log('\n2. Testing Structured Address Validation & Nickname Generation:');
  const validRes = validatePickupAddress({
    pickup_contact_name: 'Ramesh Kumar',
    pickup_phone: '9032675205',
    pickup_line1: '1-1-738, Vinayaka Temple Road',
    pickup_line2: 'Opposite SBI',
    pickup_city: 'Koratla',
    pickup_state: 'telangana',
    pickup_pincode: '505325'
  });
  assert(validRes.isValid === true, 'Valid pickup address accepted');
  assert(validRes.sanitized.pickup_state === 'Telangana', 'State normalized to Title Case');

  const invalidPinRes = validatePickupAddress({
    pickup_contact_name: 'Ramesh Kumar',
    pickup_phone: '9032675205',
    pickup_line1: '1-1-738, Vinayaka Temple Road',
    pickup_city: 'Koratla',
    pickup_state: 'Telangana',
    pickup_pincode: '005325'
  });
  assert(invalidPinRes.isValid === false, 'Rejects invalid pincode in validatePickupAddress');

  const nickname = generateShiprocketNickname(42, '505325');
  assert(nickname === 'vnd_42_505325', `Generated Shiprocket nickname matches expected: ${nickname}`);
  assert(nickname.length <= 36, 'Nickname length <= 36 characters');

  const formattedAddr = formatFullAddress(validRes.sanitized);
  assert(formattedAddr === '1-1-738, Vinayaka Temple Road, Opposite SBI, Koratla, Telangana - 505325', `Formatted legacy address matches: ${formattedAddr}`);

  // 3. DATABASE SCHEMA CHECKS
  console.log('\n3. Verifying Database Schema for Vendors Table:');
  const schemaRes = await pool.query(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'vendors'
  `);
  const columns = schemaRes.rows.map(r => r.column_name);
  const requiredColumns = [
    'pickup_contact_name',
    'pickup_phone',
    'pickup_line1',
    'pickup_line2',
    'pickup_city',
    'pickup_state',
    'pickup_pincode',
    'shiprocket_pickup_nickname',
    'is_pickup_synced',
    'address' // Legacy address still exists
  ];
  for (const col of requiredColumns) {
    assert(columns.includes(col), `vendors table has column '${col}'`);
  }

  // 4. TEST EXISTING VENDOR PROFILE LOADING (Backward Compatibility)
  console.log('\n4. Testing Existing Vendor Profile Query:');
  const vendorRes = await pool.query('SELECT * FROM vendors LIMIT 1');
  if (vendorRes.rows.length > 0) {
    const v = vendorRes.rows[0];
    assert(v.hasOwnProperty('address'), 'Existing vendor has legacy address field');
    assert(v.hasOwnProperty('pickup_pincode'), 'Existing vendor has pickup_pincode field (can be null)');
    assert(v.hasOwnProperty('shiprocket_pickup_nickname'), 'Existing vendor has shiprocket_pickup_nickname field');
  } else {
    console.log('  ⚠️ No vendors in DB to inspect, skipping row inspection');
  }

  // 5. TEST UPDATING VENDOR PICKUP ADDRESS
  console.log('\n5. Testing Vendor Pickup Update Flow:');
  // Create or pick test vendor
  let testVendorId;
  const existingTestVendor = await pool.query("SELECT id FROM vendors WHERE email = 'test_phase1_vendor@ulmgh.test'");
  if (existingTestVendor.rows.length > 0) {
    testVendorId = existingTestVendor.rows[0].id;
  } else {
    const insertVendor = await pool.query(`
      INSERT INTO vendors (name, store_name, email, phone, password_hash, address, status)
      VALUES ('Phase 1 Test Vendor', 'Test Store Phase 1', 'test_phase1_vendor@ulmgh.test', '9032675205', 'hashed', 'Old Freeform Address', 'approved')
      RETURNING id
    `);
    testVendorId = insertVendor.rows[0].id;
  }

  const generatedNickname = generateShiprocketNickname(testVendorId, '505325');
  const updateRes = await pool.query(`
    UPDATE vendors
    SET pickup_contact_name = $1,
        pickup_phone = $2,
        pickup_line1 = $3,
        pickup_line2 = $4,
        pickup_city = $5,
        pickup_state = $6,
        pickup_pincode = $7,
        shiprocket_pickup_nickname = $8,
        address = $9,
        is_pickup_synced = FALSE
    WHERE id = $10
    RETURNING *
  `, [
    'Suresh Kumar',
    '9032675205',
    'Plot 45, Industrial Estate',
    'Near Power Substation',
    'Koratla',
    'Telangana',
    '505325',
    generatedNickname,
    'Plot 45, Industrial Estate, Near Power Substation, Koratla, Telangana - 505325',
    testVendorId
  ]);

  const updatedVendor = updateRes.rows[0];
  assert(updatedVendor.pickup_pincode === '505325', 'Updated pickup_pincode is 505325');
  assert(updatedVendor.pickup_contact_name === 'Suresh Kumar', 'Updated pickup_contact_name is Suresh Kumar');
  assert(updatedVendor.shiprocket_pickup_nickname === generatedNickname, `Updated Shiprocket nickname is ${generatedNickname}`);
  assert(updatedVendor.is_pickup_synced === false, 'is_pickup_synced is false (awaiting Phase 2 Shiprocket registration)');

  // 6. TEST ADMIN VENDOR QUERY
  console.log('\n6. Testing Admin Vendors Query:');
  const adminVendorRes = await pool.query(`
    SELECT id, name, store_name, email, phone, address, status, wallet_balance, created_at,
           pickup_contact_name, pickup_phone, pickup_line1, pickup_line2,
           pickup_city, pickup_state, pickup_pincode, shiprocket_pickup_nickname, is_pickup_synced
    FROM vendors 
    WHERE id = $1
  `, [testVendorId]);
  assert(adminVendorRes.rows.length === 1, 'Admin query successfully returns vendor');
  assert(adminVendorRes.rows[0].pickup_pincode === '505325', 'Admin query includes structured pickup_pincode');
  assert(adminVendorRes.rows[0].shiprocket_pickup_nickname === generatedNickname, 'Admin query includes shiprocket_pickup_nickname');

  // 7. CONFIRM EXISTING CUSTOMER FUNCTIONALITY (Pricing & Products)
  console.log('\n7. Confirming Existing Customer Functionality is Unaffected:');
  const prodRes = await pool.query('SELECT id, name, price, stock FROM products WHERE is_active=true LIMIT 1');
  if (prodRes.rows.length > 0) {
    const prod = prodRes.rows[0];
    const calc = await calculateOrder([{ id: prod.id, qty: 1 }]);
    assert(calc.verifiedItems.length === 1, 'Customer calculateOrder works as before');
    assert(calc.subtotal > 0, `Customer subtotal calculated correctly: ₹${calc.subtotal}`);
  } else {
    console.log('  ⚠️ No active products to test calculateOrder, query executed fine');
  }

  // Cleanup test vendor
  await pool.query("DELETE FROM vendors WHERE email = 'test_phase1_vendor@ulmgh.test'");
  console.log('  🧹 Cleaned up temporary test vendor record');

  console.log(`\n=================================================`);
  console.log(`RESULTS: ${passed} Passed, ${failed} Failed`);
  if (failed === 0) {
    console.log('🎉 ALL PHASE 1 INTEGRATION TESTS PASSED!');
  } else {
    console.error('⚠️ SOME TESTS FAILED');
  }

  await pool.end();
}

runTests().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
