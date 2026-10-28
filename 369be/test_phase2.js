require('dotenv').config();
const pool = require('./db');
const {
  syncVendorPickupWithShiprocket,
  handleVendorAddressUpdate,
} = require('./services/vendorPickupService');
const { computeAddressHash } = require('./utils/pickupValidation');

async function runPhase2Tests() {
  console.log('🧪 ================= PHASE 2 SHIPROCKET SYNC TEST SUITE =================\n');
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

  // Create temporary test vendors for testing
  // Clean up any old test records first
  await pool.query("DELETE FROM vendors WHERE email LIKE '%phase2_test%'");

  const pendingVendorRes = await pool.query(`
    INSERT INTO vendors (name, store_name, email, phone, password_hash, status,
      pickup_contact_name, pickup_phone, pickup_line1, pickup_city, pickup_state, pickup_pincode,
      shiprocket_pickup_nickname)
    VALUES ('Pending Seller', 'Pending Store', 'pending_phase2_test@ulmgh.test', '9032675205', 'hash', 'pending',
      'Pending Seller', '9032675205', '1-1-10, Main Road', 'Hyderabad', 'Telangana', '500001',
      'vnd_pending_500001')
    RETURNING id
  `);
  const pendingVendorId = pendingVendorRes.rows[0].id;

  const approvedVendorRes = await pool.query(`
    INSERT INTO vendors (name, store_name, email, phone, password_hash, status,
      pickup_contact_name, pickup_phone, pickup_line1, pickup_city, pickup_state, pickup_pincode,
      shiprocket_pickup_nickname)
    VALUES ('Approved Seller', 'Approved Store', 'approved_phase2_test@ulmgh.test', '9032675205', 'hash', 'approved',
      'Ramesh Rao', '9032675205', 'Shop 4, Gandhi Chowk', 'Koratla', 'Telangana', '505325',
      'vnd_approved_505325')
    RETURNING id
  `);
  const approvedVendorId = approvedVendorRes.rows[0].id;

  // TEST 1: Pending vendor cannot sync
  console.log('1. Testing Pending Vendor Sync Restriction:');
  try {
    await syncVendorPickupWithShiprocket(pendingVendorId);
    assert(false, 'Should throw error when attempting to sync non-approved vendor');
  } catch (err) {
    assert(
      err.message.includes('Only approved vendors can be synced'),
      `Pending vendor correctly rejected: "${err.message}"`
    );
  }

  // TEST 2: Successful Pickup Registration (Mocked Shiprocket Client)
  console.log('\n2. Testing Successful Pickup Registration:');
  let registerCalled = false;
  let getPickupsCalled = false;
  const mockShiprocketSuccess = {
    getPickupLocations: async () => {
      getPickupsCalled = true;
      return []; // No existing match
    },
    registerPickupLocation: async (payload) => {
      registerCalled = true;
      assert(payload.pickup_location.length > 0, `Payload has pickup_location: ${payload.pickup_location}`);
      assert(payload.pin_code === '505325', 'Payload has correct pincode 505325');
      return { success: true, pickup_id: '998877' };
    }
  };

  const syncResult1 = await syncVendorPickupWithShiprocket(approvedVendorId, {
    shiprocketClient: mockShiprocketSuccess
  });
  assert(syncResult1.success === true, 'Sync returned success: true');
  assert(syncResult1.shiprocket_pickup_id === '998877', `Returned pickup_id is 998877`);
  assert(registerCalled === true, 'registerPickupLocation was called');

  // Verify database record
  const checkDb1 = await pool.query('SELECT * FROM vendors WHERE id = $1', [approvedVendorId]);
  const v1 = checkDb1.rows[0];
  assert(v1.is_pickup_synced === true, 'Database is_pickup_synced is TRUE');
  assert(v1.shiprocket_pickup_id === '998877', 'Database shiprocket_pickup_id is 998877');
  assert(v1.pickup_synced_at !== null, 'Database pickup_synced_at timestamp is set');
  assert(v1.pickup_sync_error === null, 'Database pickup_sync_error is NULL');
  assert(v1.pickup_address_hash !== null, 'Database pickup_address_hash is populated');

  // TEST 3: Idempotent Repeated Sync (Same Hash)
  console.log('\n3. Testing Idempotent Repeated Sync (No redundant API calls):');
  registerCalled = false;
  getPickupsCalled = false;
  const syncResult2 = await syncVendorPickupWithShiprocket(approvedVendorId, {
    shiprocketClient: mockShiprocketSuccess
  });
  assert(syncResult2.alreadySynced === true, 'Sync recognized already-synced state');
  assert(registerCalled === false, 'registerPickupLocation was NOT called redundantly');
  assert(getPickupsCalled === false, 'getPickupLocations was NOT called redundantly');

  // TEST 4: Existing Pickup Detection & Recovery
  console.log('\n4. Testing Existing Pickup Detection (Auto-recovery from Shiprocket list):');
  // Mark vendor as unsynced in DB to simulate state recovery
  await pool.query('UPDATE vendors SET is_pickup_synced = FALSE, shiprocket_pickup_id = NULL, pickup_address_hash = NULL WHERE id = $1', [approvedVendorId]);

  const mockShiprocketExisting = {
    getPickupLocations: async () => {
      return [
        { id: 445566, pickup_location: 'Primary' },
        { id: 778899, pickup_location: v1.shiprocket_pickup_nickname }, // Matches vendor's nickname
      ];
    },
    registerPickupLocation: async () => {
      throw new Error('Should not call addpickup if already exists in list');
    }
  };

  const syncResult3 = await syncVendorPickupWithShiprocket(approvedVendorId, {
    shiprocketClient: mockShiprocketExisting
  });
  assert(syncResult3.recovered === true, 'Successfully recovered existing pickup mapping');
  assert(syncResult3.shiprocket_pickup_id === '778899', 'Linked correct existing pickup_id 778899');

  const checkDb3 = await pool.query('SELECT is_pickup_synced, shiprocket_pickup_id FROM vendors WHERE id = $1', [approvedVendorId]);
  assert(checkDb3.rows[0].is_pickup_synced === true, 'DB marked is_pickup_synced = TRUE after recovery');
  assert(checkDb3.rows[0].shiprocket_pickup_id === '778899', 'DB shiprocket_pickup_id updated');

  // TEST 5: Shiprocket API Failure & Error Tracking
  console.log('\n5. Testing Shiprocket API Failure Handling & Error Logging:');
  await pool.query('UPDATE vendors SET is_pickup_synced = FALSE, pickup_address_hash = NULL WHERE id = $1', [approvedVendorId]);

  const mockShiprocketFailure = {
    getPickupLocations: async () => [],
    registerPickupLocation: async () => {
      throw new Error('Network timeout connecting to Shiprocket');
    }
  };

  try {
    await syncVendorPickupWithShiprocket(approvedVendorId, {
      shiprocketClient: mockShiprocketFailure
    });
    assert(false, 'Should throw on API failure');
  } catch (err) {
    assert(err.message.includes('Network timeout'), `Caught expected error: "${err.message}"`);
  }

  const checkDb5 = await pool.query('SELECT is_pickup_synced, pickup_sync_error FROM vendors WHERE id = $1', [approvedVendorId]);
  assert(checkDb5.rows[0].is_pickup_synced === false, 'is_pickup_synced remains FALSE after failure');
  assert(checkDb5.rows[0].pickup_sync_error.includes('Network timeout'), `pickup_sync_error recorded in DB: "${checkDb5.rows[0].pickup_sync_error}"`);

  // TEST 6: Unserviceable Pincode Error from Shiprocket
  console.log('\n6. Testing Unserviceable Pincode Rejection from Shiprocket:');
  const mockShiprocketUnserviceable = {
    getPickupLocations: async () => [],
    registerPickupLocation: async () => {
      const err = new Error('Pin code is not serviceable for pickup by courier partners.');
      throw err;
    }
  };

  try {
    await syncVendorPickupWithShiprocket(approvedVendorId, {
      shiprocketClient: mockShiprocketUnserviceable
    });
    assert(false, 'Should throw on unserviceable pincode');
  } catch (err) {
    assert(err.message.includes('not serviceable'), 'Caught unserviceable pincode error');
  }

  const checkDb6 = await pool.query('SELECT is_pickup_synced, pickup_sync_error FROM vendors WHERE id = $1', [approvedVendorId]);
  assert(checkDb6.rows[0].is_pickup_synced === false, 'is_pickup_synced is FALSE');
  assert(checkDb6.rows[0].pickup_sync_error.includes('not serviceable'), `Error recorded accurately in DB: "${checkDb6.rows[0].pickup_sync_error}"`);

  // TEST 7: Address Change & Nickname Versioning
  console.log('\n7. Testing Address Change, Versioning & Historical Archival:');
  // Re-establish successful sync first
  await pool.query(`
    UPDATE vendors
    SET is_pickup_synced = TRUE,
        shiprocket_pickup_id = '112233',
        pickup_address_hash = 'old_hash',
        shiprocket_pickup_nickname = 'vnd_${approvedVendorId}_505325',
        pickup_version = 1
    WHERE id = $1
  `, [approvedVendorId]);

  let mockNewPickupId = '990011';
  const mockShiprocketNewVersion = {
    getPickupLocations: async () => [],
    registerPickupLocation: async (payload) => {
      assert(payload.pickup_location.includes('_v2'), `New versioned nickname used: ${payload.pickup_location}`);
      return { success: true, pickup_id: mockNewPickupId };
    }
  };

  const updateResult = await handleVendorAddressUpdate(approvedVendorId, {
    pickup_contact_name: 'Ramesh Rao',
    pickup_phone: '9032675205',
    pickup_line1: 'New Warehouse, Plot 99', // Street changed
    pickup_city: 'Koratla',
    pickup_state: 'Telangana',
    pickup_pincode: '505325'
  }, {
    shiprocketClient: mockShiprocketNewVersion
  });

  assert(updateResult.changed === true, 'Address change was detected');
  assert(updateResult.vendor.pickup_version === 2, `pickup_version incremented to 2 (actual: ${updateResult.vendor.pickup_version})`);
  assert(updateResult.vendor.shiprocket_pickup_nickname.includes('_v2'), `Nickname updated with version: ${updateResult.vendor.shiprocket_pickup_nickname}`);
  assert(updateResult.vendor.is_pickup_synced === true, 'New location version auto-synced with Shiprocket');
  assert(updateResult.vendor.shiprocket_pickup_id === '990011', 'New shiprocket_pickup_id saved');

  const checkDb7 = await pool.query('SELECT historical_shiprocket_pickups FROM vendors WHERE id = $1', [approvedVendorId]);
  const history = checkDb7.rows[0].historical_shiprocket_pickups;
  assert(Array.isArray(history) && history.length === 1, 'Previous pickup location archived into historical_shiprocket_pickups');
  assert(history[0].pickup_id === '112233', 'Historical record preserved previous pickup_id 112233');

  // TEST 8: Approved Vendor Auto-sync on Admin Status Change
  console.log('\n8. Testing Approved Vendor Sync Capability:');
  // Verify that an approved vendor can trigger sync successfully
  const canSyncApproved = await syncVendorPickupWithShiprocket(approvedVendorId, {
    shiprocketClient: {
      getPickupLocations: async () => [],
      registerPickupLocation: async () => ({ pickup_id: '990011' })
    }
  });
  assert(canSyncApproved.success === true, 'Approved vendor sync succeeds');

  // Cleanup test vendors
  await pool.query("DELETE FROM vendors WHERE email LIKE '%phase2_test%'");
  console.log('\n  🧹 Cleaned up temporary test vendors');

  console.log(`\n=================================================`);
  console.log(`RESULTS: ${passed} Passed, ${failed} Failed`);
  if (failed === 0) {
    console.log('🎉 ALL PHASE 2 TESTS PASSED PERFECTLY!');
  } else {
    console.error('⚠️ SOME TESTS FAILED');
  }

  await pool.end();
}

runPhase2Tests().catch(err => {
  console.error('Fatal Phase 2 test error:', err);
  process.exit(1);
});
