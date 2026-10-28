const pool = require('../db');
const shiprocket = require('../utils/shiprocket');
const {
  validatePickupAddress,
  generateShiprocketNickname,
  computeAddressHash,
  formatFullAddress,
} = require('../utils/pickupValidation');

/**
 * Synchronizes an approved vendor's pickup location with Shiprocket.
 * - Idempotent: checks hash and existing registered nicknames first.
 * - Only approved vendors can be registered.
 * - Records sync status, pickup ID, and any errors in the DB.
 */
async function syncVendorPickupWithShiprocket(vendorId, options = {}) {
  const client = options.shiprocketClient || shiprocket;
  const dbClient = options.dbClient || pool;

  // 1. Fetch vendor
  const vendorRes = await dbClient.query('SELECT * FROM vendors WHERE id = $1', [vendorId]);
  if (vendorRes.rows.length === 0) {
    throw new Error(`Vendor with ID ${vendorId} not found.`);
  }
  const vendor = vendorRes.rows[0];

  // 2. Only approved vendors can sync with Shiprocket
  if (vendor.status !== 'approved') {
    throw new Error(`Only approved vendors can be synced with Shiprocket. Current status: '${vendor.status}'.`);
  }

  // 3. Validate structured pickup fields
  const validation = validatePickupAddress(vendor);
  if (!validation.isValid) {
    const errorMsg = `Incomplete or invalid pickup address: ${validation.error}`;
    await dbClient.query(
      'UPDATE vendors SET is_pickup_synced = FALSE, pickup_sync_error = $1 WHERE id = $2',
      [errorMsg, vendorId]
    );
    throw new Error(errorMsg);
  }
  const sanitized = validation.sanitized;

  // 4. Idempotency check via address hash
  const currentHash = computeAddressHash(sanitized);
  if (vendor.is_pickup_synced === true && vendor.pickup_address_hash === currentHash && vendor.shiprocket_pickup_id) {
    return {
      success: true,
      alreadySynced: true,
      message: 'Vendor pickup location is already synchronized with Shiprocket.',
      shiprocket_pickup_nickname: vendor.shiprocket_pickup_nickname,
      shiprocket_pickup_id: vendor.shiprocket_pickup_id,
    };
  }

  const nickname = vendor.shiprocket_pickup_nickname || generateShiprocketNickname(vendorId, sanitized.pickup_pincode, vendor.pickup_version || 1);

  try {
    // 5. Pre-check: Verify if nickname already exists in Shiprocket account (prevents duplicate error)
    const existingList = await client.getPickupLocations();
    const existingMatch = existingList.find(
      loc => loc.pickup_location && loc.pickup_location.toLowerCase() === nickname.toLowerCase()
    );

    if (existingMatch) {
      const pickupId = String(existingMatch.id || existingMatch.pickup_id || '');
      await dbClient.query(
        `UPDATE vendors 
         SET is_pickup_synced = TRUE,
             shiprocket_pickup_id = $1,
             pickup_synced_at = NOW(),
             pickup_sync_error = NULL,
             pickup_address_hash = $2,
             shiprocket_pickup_nickname = $3
         WHERE id = $4`,
        [pickupId, currentHash, nickname, vendorId]
      );
      return {
        success: true,
        recovered: true,
        message: 'Existing Shiprocket pickup location detected and linked.',
        shiprocket_pickup_nickname: nickname,
        shiprocket_pickup_id: pickupId,
      };
    }

    // 6. Register with Shiprocket via POST /settings/company/addpickup
    const payload = {
      pickup_location: nickname,
      name: sanitized.pickup_contact_name,
      email: vendor.email,
      phone: sanitized.pickup_phone,
      address: sanitized.pickup_line1,
      address_2: sanitized.pickup_line2 || '',
      city: sanitized.pickup_city,
      state: sanitized.pickup_state,
      country: 'India',
      pin_code: sanitized.pickup_pincode,
    };

    const apiRes = await client.registerPickupLocation(payload);
    const pickupId = String(apiRes.pickup_id || apiRes.data?.pickup_id || apiRes.id || apiRes.data?.id || '');

    await dbClient.query(
      `UPDATE vendors 
       SET is_pickup_synced = TRUE,
           shiprocket_pickup_id = $1,
           pickup_synced_at = NOW(),
           pickup_sync_error = NULL,
           pickup_address_hash = $2,
           shiprocket_pickup_nickname = $3
       WHERE id = $4`,
      [pickupId || null, currentHash, nickname, vendorId]
    );

    return {
      success: true,
      message: 'Pickup location registered with Shiprocket successfully.',
      shiprocket_pickup_nickname: nickname,
      shiprocket_pickup_id: pickupId,
    };
  } catch (err) {
    const errorMsg = err.message || 'Shiprocket registration error';
    await dbClient.query(
      'UPDATE vendors SET is_pickup_synced = FALSE, pickup_sync_error = $1 WHERE id = $2',
      [errorMsg, vendorId]
    );
    throw new Error(`Shiprocket sync failed: ${errorMsg}`);
  }
}

/**
 * Handles vendor address update:
 * - Detects if address changed via hash.
 * - If changed, increments version, archives old mapping to historical list, and triggers re-sync if vendor is approved.
 */
async function handleVendorAddressUpdate(vendorId, newFields = {}, options = {}) {
  const dbClient = options.dbClient || pool;

  const vendorRes = await dbClient.query('SELECT * FROM vendors WHERE id = $1', [vendorId]);
  if (vendorRes.rows.length === 0) {
    throw new Error(`Vendor with ID ${vendorId} not found.`);
  }
  const vendor = vendorRes.rows[0];

  const validation = validatePickupAddress(newFields);
  if (!validation.isValid) {
    throw new Error(validation.error);
  }
  const sanitized = validation.sanitized;
  const newHash = computeAddressHash(sanitized);

  // If address hash is identical, only update store_name if provided
  if (vendor.pickup_address_hash === newHash && vendor.pickup_line1) {
    const updateRes = await dbClient.query(
      `UPDATE vendors
       SET store_name = COALESCE($1, store_name)
       WHERE id = $2
       RETURNING *`,
      [newFields.store_name?.trim() || null, vendorId]
    );
    return {
      vendor: updateRes.rows[0],
      changed: false,
      message: 'Address unchanged.',
    };
  }

  // Address changed: Increment version & archive current mapping
  const currentVersion = parseInt(vendor.pickup_version || 1, 10);
  const nextVersion = vendor.pickup_line1 ? currentVersion + 1 : currentVersion;
  const nextNickname = generateShiprocketNickname(vendorId, sanitized.pickup_pincode, nextVersion);
  const legacyAddress = formatFullAddress(sanitized);

  const historical = Array.isArray(vendor.historical_shiprocket_pickups)
    ? [...vendor.historical_shiprocket_pickups]
    : [];

  if (vendor.shiprocket_pickup_nickname && vendor.pickup_line1) {
    historical.push({
      nickname: vendor.shiprocket_pickup_nickname,
      pickup_id: vendor.shiprocket_pickup_id,
      pincode: vendor.pickup_pincode,
      address: vendor.address,
      synced_at: vendor.pickup_synced_at,
      archived_at: new Date().toISOString(),
    });
  }

  const updateRes = await dbClient.query(
    `UPDATE vendors
     SET store_name = COALESCE($1, store_name),
         pickup_contact_name = $2,
         pickup_phone = $3,
         pickup_line1 = $4,
         pickup_line2 = $5,
         pickup_city = $6,
         pickup_state = $7,
         pickup_pincode = $8,
         shiprocket_pickup_nickname = $9,
         pickup_version = $10,
         historical_shiprocket_pickups = $11,
         address = $12,
         is_pickup_synced = FALSE,
         shiprocket_pickup_id = NULL,
         pickup_synced_at = NULL,
         pickup_sync_error = NULL,
         pickup_address_hash = $13
     WHERE id = $14
     RETURNING *`,
    [
      newFields.store_name?.trim() || null,
      sanitized.pickup_contact_name,
      sanitized.pickup_phone,
      sanitized.pickup_line1,
      sanitized.pickup_line2,
      sanitized.pickup_city,
      sanitized.pickup_state,
      sanitized.pickup_pincode,
      nextNickname,
      nextVersion,
      JSON.stringify(historical),
      legacyAddress,
      newHash,
      vendorId,
    ]
  );

  let updatedVendor = updateRes.rows[0];

  // If vendor is approved, automatically trigger Shiprocket sync for the new location version
  let syncResult = null;
  if (updatedVendor.status === 'approved') {
    try {
      syncResult = await syncVendorPickupWithShiprocket(vendorId, options);
      const reFetch = await dbClient.query('SELECT * FROM vendors WHERE id = $1', [vendorId]);
      updatedVendor = reFetch.rows[0];
    } catch (syncErr) {
      console.warn(`Vendor ${vendorId} address updated, but automatic Shiprocket sync failed:`, syncErr.message);
    }
  }

  return {
    vendor: updatedVendor,
    changed: true,
    syncResult,
    message: 'Pickup location updated successfully.',
  };
}

module.exports = {
  syncVendorPickupWithShiprocket,
  handleVendorAddressUpdate,
};
