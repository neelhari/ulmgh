const pool = require('../db');
const shiprocket = require('../utils/shiprocket');

/**
 * Creates fulfillment records for an order atomically inside an existing DB transaction.
 * @param {object} order - Newly inserted order row from DB
 * @param {Array} verifiedItems - Verified items from pricing calculation
 * @param {object} client - pg client with active transaction
 */
async function createFulfillmentsForOrder(order, verifiedItems, client) {
  if (!order || !order.id) throw new Error('Order is required to create fulfillments');
  if (!Array.isArray(verifiedItems) || verifiedItems.length === 0) {
    throw new Error('Order items required to create fulfillments');
  }

  // 1. Group items by vendor_id (null for platform/in-house)
  const vendorGroups = {};
  for (const item of verifiedItems) {
    const vid = (item.product && item.product.vendor_id) ? item.product.vendor_id : null;
    const groupKey = vid === null ? 'platform' : `vendor_${vid}`;
    if (!vendorGroups[groupKey]) {
      vendorGroups[groupKey] = {
        vendor_id: vid,
        items: [],
        subtotal: 0,
        totalWeight: 0,
      };
    }
    const unitPrice = parseFloat(item.price || item.variant?.price || item.product?.price || 0);
    const qty = parseInt(item.qty || item.quantity || 1, 10);
    const weight = parseFloat(item.product?.weight || item.product?.custom_attributes?.weight || item.weight || 0);

    vendorGroups[groupKey].items.push({
      ...item,
      unitPrice,
      qty,
      totalPrice: unitPrice * qty,
      weight,
    });
    vendorGroups[groupKey].subtotal += unitPrice * qty;
    vendorGroups[groupKey].totalWeight += (weight * qty);
  }

  const createdFulfillments = [];

  try {
    if (client && client.query) {
      await client.query('SAVEPOINT fulfillments_savepoint');
    }

    // 2. Insert fulfillment and line items for each vendor group
    for (const [groupKey, group] of Object.entries(vendorGroups)) {
      const { vendor_id, items, subtotal, totalWeight } = group;

      let pickupNickname = null;
      let pickupId = null;

      if (vendor_id) {
        // Query vendor for live pickup location snapshots
        const vendorRes = await client.query(
          'SELECT * FROM vendors WHERE id = $1',
          [vendor_id]
        );
        const v = vendorRes.rows[0];
        if (v) {
          pickupNickname = v.shiprocket_pickup_nickname || null;
          pickupId = v.shiprocket_pickup_id ? String(v.shiprocket_pickup_id) : null;
        }
      } else {
        // Platform / in-house items use platform primary pickup location
        pickupNickname = process.env.SHIPROCKET_PICKUP_LOCATION || 'Primary';
        pickupId = null;
      }

      // Convert total weight grams to kg if > 50g, default to 0.5kg
      let pkgWeight = totalWeight;
      if (pkgWeight > 50) {
        pkgWeight = pkgWeight / 1000;
      }
      pkgWeight = pkgWeight > 0 ? parseFloat(pkgWeight.toFixed(2)) : 0.5;

      const fulfillmentNumber = vendor_id
        ? `${order.order_number || order.id}-V${vendor_id}`
        : `${order.order_number || order.id}-P`;

      const status = (order.payment_method === 'cod') ? 'pending' : 'paid';

      // Insert order_fulfillments (idempotent ON CONFLICT)
      const fulRes = await client.query(
        `INSERT INTO order_fulfillments 
         (order_id, vendor_id, fulfillment_number, status, subtotal, total_amount, package_weight, pickup_location_nickname, shiprocket_pickup_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         ON CONFLICT (fulfillment_number) DO UPDATE SET updated_at = NOW()
         RETURNING *`,
        [
          order.id,
          vendor_id,
          fulfillmentNumber,
          status,
          subtotal,
          subtotal, // total_amount
          pkgWeight,
          pickupNickname,
          pickupId
        ]
      );

      const fulfillment = fulRes.rows[0];

      // Insert order_fulfillment_items
      for (const it of items) {
        let prodId = it.product?.id || it.id || null;
        if (prodId) {
          try {
            const pCheck = await client.query('SELECT id FROM products WHERE id = $1', [prodId]);
            if (pCheck.rows.length === 0) {
              prodId = null;
            }
          } catch (pErr) {
            prodId = null;
          }
        }
        const prodName = it.product?.name || it.name || 'Product';
        const sku = it.variant?.size || it.product?.sku || 'Default';
        const variantDetails = {
          size: it.variant?.size || null,
          color: it.variant?.color || null,
          ...(typeof it.variant === 'object' ? it.variant : {})
        };

        await client.query(
          `INSERT INTO order_fulfillment_items
           (fulfillment_id, order_id, product_id, product_name, sku, variant_details, quantity, unit_price, total_price, weight)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
          [
            fulfillment.id,
            order.id,
            prodId,
            prodName,
            sku,
            JSON.stringify(variantDetails),
            it.qty,
            it.unitPrice,
            it.totalPrice,
            it.weight
          ]
        );
      }

      createdFulfillments.push({ ...fulfillment, items });
    }

    if (client && client.query) {
      await client.query('RELEASE SAVEPOINT fulfillments_savepoint');
    }
  } catch (fulErr) {
    console.warn('Fulfillment creation non-fatal warning (rolling back to savepoint):', fulErr.message);
    if (client && client.query) {
      try {
        await client.query('ROLLBACK TO SAVEPOINT fulfillments_savepoint');
      } catch (rbErr) {}
    }
  }

  return createdFulfillments;
}

/**
 * Recalculates and updates the parent order's status based on child fulfillments.
 * @param {number} orderId 
 * @param {object} [dbClient=pool]
 */
async function updateParentOrderStatus(orderId, dbClient = pool) {
  const res = await dbClient.query(
    'SELECT status FROM order_fulfillments WHERE order_id = $1',
    [orderId]
  );
  if (res.rows.length === 0) return null;

  const statuses = res.rows.map(r => (r.status || '').toLowerCase());

  let newStatus = 'processing';
  const allCancelled = statuses.every(s => s === 'cancelled');
  const allDelivered = statuses.every(s => s === 'delivered');
  const allShippedOrDelivered = statuses.every(s => s === 'shipped' || s === 'delivered');
  const someShipped = statuses.some(s => s === 'shipped' || s === 'delivered');
  const allPending = statuses.every(s => s === 'pending');

  if (allCancelled) {
    newStatus = 'cancelled';
  } else if (allDelivered) {
    newStatus = 'delivered';
  } else if (allShippedOrDelivered) {
    newStatus = 'shipped';
  } else if (someShipped) {
    newStatus = 'partially_shipped';
  } else if (allPending) {
    newStatus = 'pending';
  } else {
    newStatus = 'processing';
  }

  await dbClient.query('UPDATE orders SET status = $1 WHERE id = $2', [newStatus, orderId]);
  return newStatus;
}

/**
 * Creates a Shiprocket shipment and assigns AWB for a specific vendor fulfillment.
 * @param {number} fulfillmentId 
 * @param {object} [options={}] - Options for testing/mocking
 */
async function shipFulfillment(fulfillmentId, options = {}) {
  const dbClient = options.dbClient || pool;
  const client = options.shiprocketClient || shiprocket;

  // 1. Fetch fulfillment, parent order, and vendor information
  const query = `
    SELECT f.*, 
           o.order_number, o.created_at as order_created_at, o.payment_method, o.address as order_address,
           o.user_id, o.total as order_total, o.advance_paid as order_advance_paid,
           u.name as user_name, u.email as user_email, u.phone as user_phone,
           v.name as vendor_name, v.status as vendor_status, v.is_pickup_synced as vendor_pickup_synced,
           v.shiprocket_pickup_nickname as current_vendor_nickname, v.shiprocket_pickup_id as current_vendor_pickup_id,
           v.pickup_sync_error as vendor_pickup_sync_error
    FROM order_fulfillments f
    JOIN orders o ON f.order_id = o.id
    LEFT JOIN users u ON o.user_id = u.id
    LEFT JOIN vendors v ON f.vendor_id = v.id
    WHERE f.id = $1
  `;
  const fulRes = await dbClient.query(query, [fulfillmentId]);
  const f = fulRes.rows[0];
  if (!f) throw new Error(`Fulfillment #${fulfillmentId} not found`);

  // 2. IDEMPOTENCY CHECK 1: Already shipped with AWB
  if (f.status === 'shipped' && f.awb_code) {
    return {
      success: true,
      alreadyShipped: true,
      awb: f.awb_code,
      courier: f.courier_name,
      tracking_link: f.tracking_url,
      fulfillment: f
    };
  }

  // 3. PRE-FLIGHT VENDOR PICKUP SAFETY
  let pickupLocation = f.pickup_location_nickname;

  if (f.vendor_id) {
    if (f.vendor_status !== 'approved') {
      const err = new Error(`Cannot ship fulfillment #${f.id}: Vendor "${f.vendor_name}" is not approved.`);
      err.statusCode = 400;
      throw err;
    }
    if (!f.vendor_pickup_synced || !pickupLocation) {
      const errMsg = `Cannot ship fulfillment #${f.id}: Vendor "${f.vendor_name}" dispatch warehouse (${pickupLocation || 'unassigned'}) is not verified on Shiprocket. ${f.vendor_pickup_sync_error ? 'Error: ' + f.vendor_pickup_sync_error : 'Please sync vendor warehouse in Admin > Vendor Profiles first.'}`;
      const err = new Error(errMsg);
      err.statusCode = 400;
      // Record sync error in fulfillment
      await dbClient.query('UPDATE order_fulfillments SET sync_error = $1, status = $2 WHERE id = $3', [errMsg, 'failed', f.id]);
      throw err;
    }
  } else {
    // Platform / in-house product
    pickupLocation = process.env.SHIPROCKET_PICKUP_LOCATION || 'Primary';
  }

  // 4. Fetch line items for this fulfillment
  const itemsRes = await dbClient.query(
    'SELECT * FROM order_fulfillment_items WHERE fulfillment_id = $1',
    [f.id]
  );
  const items = itemsRes.rows;
  if (items.length === 0) {
    throw new Error(`Fulfillment #${f.id} has no line items to ship`);
  }

  // Parse address
  let address = {};
  try {
    address = typeof f.order_address === 'string' ? JSON.parse(f.order_address) : (f.order_address || {});
  } catch (e) {
    address = {};
  }

  const srItems = items.map(it => ({
    name: it.product_name || 'Product',
    sku: it.sku || 'Default',
    units: it.quantity || 1,
    selling_price: parseFloat(it.unit_price) || 0
  }));

  try {
    let shipmentId = f.shiprocket_shipment_id;
    let srOrderId = f.shiprocket_order_id;

    // 5. STEP 1: Create Adhoc Order in Shiprocket (if not already created)
    if (!shipmentId) {
      const shiprocketPayload = {
        order_id: f.fulfillment_number,
        order_date: new Date(f.order_created_at || Date.now()).toISOString().split('T')[0],
        pickup_location: pickupLocation,
        billing_customer_name: address.name || f.user_name || 'Customer',
        billing_last_name: '',
        billing_address: address.line1 || 'No Address',
        billing_city: address.city || 'City',
        billing_pincode: address.pincode || '110001',
        billing_state: address.state || 'State',
        billing_country: 'India',
        billing_email: f.user_email || 'orders@ulmgh369.com',
        billing_phone: address.mobile || f.user_phone || '9999999999',
        shipping_is_billing: true,
        order_items: srItems,
        payment_method: f.payment_method === 'cod' ? 'COD' : 'Prepaid',
        sub_total: parseFloat(f.subtotal),
        length: parseFloat(f.package_length) || 10,
        breadth: parseFloat(f.package_breadth) || 10,
        height: parseFloat(f.package_height) || 10,
        weight: parseFloat(f.package_weight) || 0.5
      };

      const srOrder = await client.createCustomOrder(shiprocketPayload);
      shipmentId = srOrder.shipment_id || srOrder.payload?.shipment_id;
      srOrderId = srOrder.order_id || srOrder.payload?.order_id;

      if (!shipmentId) {
        throw new Error('Shiprocket did not return a shipment_id');
      }

      // Persist shipmentId immediately
      await dbClient.query(
        'UPDATE order_fulfillments SET shiprocket_order_id = $1, shiprocket_shipment_id = $2 WHERE id = $3',
        [srOrderId, shipmentId, f.id]
      );
    }

    // 6. STEP 2: Assign AWB
    let awbCode = f.awb_code;
    let courierName = f.courier_name;
    let courierCompanyId = f.courier_company_id;

    if (!awbCode) {
      const awbRes = await client.assignAWB(shipmentId);
      awbCode = awbRes.response?.data?.awb_code || awbRes.awb_code;
      courierName = awbRes.response?.data?.courier_name || awbRes.courier_name || 'Courier';
      courierCompanyId = awbRes.response?.data?.courier_company_id || null;

      if (!awbCode) {
        throw new Error(awbRes.response?.data?.message || 'Shiprocket did not return an AWB code');
      }

      await dbClient.query(
        'UPDATE order_fulfillments SET awb_code = $1, courier_name = $2, courier_company_id = $3 WHERE id = $4',
        [awbCode, courierName, courierCompanyId, f.id]
      );
    }

    const trackingUrl = `https://shiprocket.co/tracking/${awbCode}`;

    // 7. STEP 3: Generate Shipping Label (if available)
    let labelUrl = f.label_url;
    if (!labelUrl && client.generateLabel) {
      try {
        const labelRes = await client.generateLabel(shipmentId);
        labelUrl = labelRes.label_url || labelRes.response?.label_url || null;
      } catch (labelErr) {
        console.warn(`Label generation warning for fulfillment #${f.id}:`, labelErr.message);
      }
    }

    // 8. STEP 4: Request Courier Pickup from Vendor's Registered Warehouse
    let pickupTokenNumber = f.pickup_token_number;
    let pickupScheduledDate = f.pickup_scheduled_date;

    if (!pickupTokenNumber && client.requestPickup) {
      try {
        const pickupRes = await client.requestPickup(shipmentId);
        pickupTokenNumber = pickupRes.response?.pickup_token_number || 
                            pickupRes.pickup_token_number || 
                            pickupRes.response?.data?.pickup_token_number ||
                            pickupRes.pickup_id ||
                            'PICKUP_SCHEDULED';

        const rawScheduledDate = pickupRes.response?.pickup_scheduled_date || 
                                 pickupRes.pickup_scheduled_date || 
                                 pickupRes.response?.data?.pickup_scheduled_date;
        pickupScheduledDate = rawScheduledDate ? new Date(rawScheduledDate) : new Date();
      } catch (pickupErr) {
        console.error(`Pickup scheduling failed for fulfillment #${f.id}:`, pickupErr.message);
        const errMsg = `AWB assigned (${awbCode}), but courier pickup booking failed: ${pickupErr.message}`;
        // Persist AWB & label with 'processing' status (NOT 'ready_to_ship' or 'shipped')
        // Retrying Dispatch will resume directly at pickup request without duplicate order or AWB
        await dbClient.query(
          `UPDATE order_fulfillments 
           SET awb_code = $1, courier_name = $2, courier_company_id = $3, tracking_url = $4,
               label_url = COALESCE($5, label_url), sync_error = $6, status = 'processing', updated_at = NOW()
           WHERE id = $7`,
          [awbCode, courierName, courierCompanyId, trackingUrl, labelUrl, errMsg, f.id]
        );
        const err = new Error(errMsg);
        err.statusCode = 502;
        throw err;
      }
    }

    // 9. STEP 5: Persist successful dispatch & pickup details
    // The fulfillment status is 'ready_to_ship' (Pickup Scheduled) only when pickup booking succeeded
    const newStatus = 'ready_to_ship';

    const updatedFulRes = await dbClient.query(
      `UPDATE order_fulfillments 
       SET status = $1,
           awb_code = $2,
           courier_name = $3,
           courier_company_id = $4,
           tracking_url = $5,
           label_url = COALESCE($6, label_url),
           pickup_token_number = $7,
           pickup_scheduled_date = $8,
           shipped_at = COALESCE(shipped_at, NOW()),
           sync_error = NULL,
           updated_at = NOW()
       WHERE id = $9
       RETURNING *`,
      [
        newStatus,
        awbCode,
        courierName,
        courierCompanyId,
        trackingUrl,
        labelUrl,
        pickupTokenNumber,
        pickupScheduledDate,
        f.id
      ]
    );

    // 10. Update parent order status dynamically
    await updateParentOrderStatus(f.order_id, dbClient);

    return {
      success: true,
      status: newStatus,
      awb: awbCode,
      courier: courierName,
      tracking_link: trackingUrl,
      label_url: labelUrl,
      pickup_token_number: pickupTokenNumber,
      pickup_scheduled_date: pickupScheduledDate,
      fulfillment: updatedFulRes.rows[0]
    };
  } catch (err) {
    console.error(`Shiprocket shipping failed for fulfillment #${f.id}:`, err.message);
    // Record error in database so Admin and Vendor UI can inspect
    await dbClient.query(
      'UPDATE order_fulfillments SET sync_error = $1, status = $2, updated_at = NOW() WHERE id = $3',
      [err.message, 'failed', f.id]
    );
    throw err;
  }
}

/**
 * Returns all fulfillments for a parent order with their line items.
 * @param {number} orderId 
 * @param {object} [dbClient=pool] 
 */
async function getFulfillmentsForOrder(orderId, dbClient = pool) {
  const fulRes = await dbClient.query(
    `SELECT f.*, v.name as vendor_name, v.is_pickup_synced as vendor_pickup_synced
     FROM order_fulfillments f
     LEFT JOIN vendors v ON f.vendor_id = v.id
     WHERE f.order_id = $1
     ORDER BY f.id ASC`,
    [orderId]
  );
  const fulfillments = fulRes.rows;

  for (const ful of fulfillments) {
    const itemsRes = await dbClient.query(
      'SELECT * FROM order_fulfillment_items WHERE fulfillment_id = $1 ORDER BY id ASC',
      [ful.id]
    );
    ful.items = itemsRes.rows;
  }

  return fulfillments;
}

/**
 * Backfills existing historical orders that do not have order_fulfillments rows yet.
 * @param {object} [dbClient=pool]
 */
async function backfillHistoricalOrders(dbClient = pool) {
  const missingOrdersRes = await dbClient.query(`
    SELECT o.* 
    FROM orders o
    WHERE o.id NOT IN (SELECT DISTINCT order_id FROM order_fulfillments)
    ORDER BY o.id ASC
  `);

  console.log(`📦 Found ${missingOrdersRes.rows.length} historical orders needing fulfillment backfill.`);
  let backfilledCount = 0;

  for (const ord of missingOrdersRes.rows) {
    let items = [];
    try {
      items = typeof ord.items === 'string' ? JSON.parse(ord.items) : (ord.items || []);
    } catch (e) {
      items = [];
    }
    if (items.length === 0) continue;

    // Normalizing item structure for createFulfillmentsForOrder
    const normalizedItems = items.map(it => ({
      ...it,
      id: it.product?.id || it.id,
      price: it.variant?.price || it.product?.price || it.price || 0,
      qty: it.qty || it.quantity || 1,
      product: {
        id: it.product?.id || it.id,
        name: it.product?.name || it.name || 'Product',
        vendor_id: it.product?.vendor_id || null,
        weight: it.product?.weight || 0,
      }
    }));

    const client = await dbClient.connect();
    try {
      await client.query('BEGIN');
      const fulfillments = await createFulfillmentsForOrder(ord, normalizedItems, client);

      // If the historical order was already shipped/delivered or had tracking_id, preserve it on fulfillments
      if (ord.tracking_id || ord.status === 'shipped' || ord.status === 'delivered') {
        for (const ful of fulfillments) {
          await client.query(
            `UPDATE order_fulfillments 
             SET status = $1, awb_code = $2, tracking_url = $3, shipped_at = $4
             WHERE id = $5`,
            [
              ord.status || 'shipped',
              ord.tracking_id || null,
              ord.tracking_link || (ord.tracking_id ? `https://shiprocket.co/tracking/${ord.tracking_id}` : null),
              ord.created_at,
              ful.id
            ]
          );
        }
      }

      await client.query('COMMIT');
      backfilledCount++;
    } catch (err) {
      await client.query('ROLLBACK');
      console.error(`Backfill failed for order #${ord.id}:`, err.message);
    } finally {
      client.release();
    }
  }

  console.log(`✅ Backfilled ${backfilledCount} historical orders.`);
  return backfilledCount;
}

module.exports = {
  createFulfillmentsForOrder,
  updateParentOrderStatus,
  shipFulfillment,
  getFulfillmentsForOrder,
  backfillHistoricalOrders
};
