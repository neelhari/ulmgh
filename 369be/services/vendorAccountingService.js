const pool = require('../db');

/**
 * Validates and retrieves the active subscription commission rate for a vendor.
 * Strict: Blocks checkout if subscription is expired, missing, or rate is invalid.
 *
 * @param {number|string} vendorId
 * @param {object} [client=pool]
 * @returns {Promise<{
 *   vendorId: number,
 *   storeName: string,
 *   commissionPercent: number,
 *   subscriptionId: number,
 *   planName: string,
 *   outstandingDebt: number,
 *   walletBalance: number
 * }>}
 */
async function getVendorActiveCommissionRate(vendorId, client = pool) {
  const query = `
    SELECT v.id AS vendor_id,
           v.name AS vendor_name,
           v.store_name,
           v.status AS vendor_status,
           COALESCE(v.wallet_balance, 0) AS wallet_balance,
           COALESCE(v.outstanding_debt, 0) AS outstanding_debt,
           vs.id AS subscription_id,
           vs.plan_name,
           vs.features,
           vs.starts_at,
           vs.expires_at,
           vs.status AS subscription_status
    FROM vendors v
    LEFT JOIN LATERAL (
      SELECT id, plan_name, features, starts_at, expires_at, status
      FROM vendor_subscriptions
      WHERE vendor_id = v.id
        AND (status = 'active' OR status IS NULL)
        AND starts_at <= NOW()
        AND expires_at >= NOW()
      ORDER BY created_at DESC
      LIMIT 1
    ) vs ON true
    WHERE v.id = $1
  `;

  const res = await client.query(query, [vendorId]);
  if (res.rows.length === 0) {
    const err = new Error(`Vendor with ID ${vendorId} not found`);
    err.statusCode = 404;
    throw err;
  }

  const row = res.rows[0];
  const storeName = row.store_name || `Vendor #${vendorId}`;

  // 1. Subscription must be active and not expired
  if (!row.subscription_id || !row.expires_at || new Date(row.expires_at) < new Date()) {
    const err = new Error(`Cannot complete order: Vendor "${storeName}" does not have an active subscription.`);
    err.statusCode = 400;
    throw err;
  }

  // 2. Commission percent must be configured in subscription features snapshot
  const rawRate = row.features?.commission_percent;
  if (rawRate === undefined || rawRate === null || rawRate === '' || isNaN(Number(rawRate))) {
    const err = new Error(`Cannot complete order: Vendor "${storeName}" does not have a valid commission rate configured in their subscription.`);
    err.statusCode = 400;
    throw err;
  }

  const commissionPercent = parseFloat(Number(rawRate).toFixed(2));
  if (commissionPercent < 0 || commissionPercent > 100) {
    const err = new Error(`Cannot complete order: Vendor "${storeName}" has an invalid commission rate (${commissionPercent}%).`);
    err.statusCode = 400;
    throw err;
  }

  return {
    vendorId: row.vendor_id,
    storeName,
    commissionPercent,
    subscriptionId: row.subscription_id,
    planName: row.plan_name,
    outstandingDebt: parseFloat(row.outstanding_debt || 0),
    walletBalance: parseFloat(row.wallet_balance || 0),
  };
}

/**
 * Calculates financial breakdown for verified items belonging to a vendor.
 *
 * Formula:
 *  Gross = verified selling price * qty
 *  Commission = round(Gross * (commissionPercent / 100), 2)
 *  Net = Gross - Commission
 *
 * @param {Array} items
 * @param {number} commissionPercent
 */
function calculateVendorEarnings(items, commissionPercent) {
  let grossAmount = 0;
  for (const item of items) {
    const price = parseFloat(item.price || item.product?.price || 0);
    const qty = parseInt(item.qty || item.quantity || 1, 10);
    grossAmount += price * qty;
  }

  grossAmount = Math.round(grossAmount * 100) / 100;
  const commissionAmount = Math.round((grossAmount * (commissionPercent / 100)) * 100) / 100;
  const netEarnings = Math.round((grossAmount - commissionAmount) * 100) / 100;

  return {
    grossAmount,
    commissionPercent,
    commissionAmount,
    netEarnings,
  };
}

/**
 * Processes vendor credits and records accounting breakdowns inside an existing DB transaction.
 * Handles multi-vendor breakdown, debt recovery, and idempotent credit ledger insertion.
 *
 * @param {object} params
 * @param {string} params.orderNumber
 * @param {Array} params.verifiedItems
 * @param {object} params.client - pg client with active transaction
 * @returns {Promise<object>} Map of vendorId -> financial breakdown
 */
async function processOrderVendorAccounting({ orderNumber, verifiedItems, client }) {
  if (!orderNumber) throw new Error('orderNumber is required for vendor accounting');
  if (!client) throw new Error('Database transaction client is required');

  // 1. Group verified items by vendor
  const vendorGroups = {};
  for (const item of verifiedItems) {
    if (item.product && item.product.vendor_id) {
      const vid = item.product.vendor_id;
      if (!vendorGroups[vid]) {
        vendorGroups[vid] = { vendorId: vid, items: [] };
      }
      vendorGroups[vid].items.push(item);
    }
  }

  const breakdownByVendor = {};

  // 2. Validate subscription & commission rate for all involved vendors first
  for (const [vid, group] of Object.entries(vendorGroups)) {
    const vendorRateInfo = await getVendorActiveCommissionRate(vid, client);
    const financials = calculateVendorEarnings(group.items, vendorRateInfo.commissionPercent);

    breakdownByVendor[vid] = {
      ...vendorRateInfo,
      ...financials,
      items: group.items,
    };
  }

  // 3. Apply credits, debt recoveries, and ledger transactions atomically
  for (const [vid, data] of Object.entries(breakdownByVendor)) {
    const {
      grossAmount,
      commissionPercent,
      commissionAmount,
      netEarnings,
      outstandingDebt,
      items
    } = data;

    // Check if debt needs to be recovered from net earnings
    let debtRecovered = 0;
    let netCreditToWallet = netEarnings;
    let remainingDebt = outstandingDebt;

    if (outstandingDebt > 0) {
      debtRecovered = Math.min(netEarnings, outstandingDebt);
      debtRecovered = Math.round(debtRecovered * 100) / 100;
      netCreditToWallet = Math.round((netEarnings - debtRecovered) * 100) / 100;
      remainingDebt = Math.round((outstandingDebt - debtRecovered) * 100) / 100;
    }

    // Update vendor wallet and outstanding debt atomically
    await client.query(`
      UPDATE vendors 
      SET wallet_balance = COALESCE(wallet_balance, 0) + $1,
          outstanding_debt = $2
      WHERE id = $3
    `, [netCreditToWallet, remainingDebt, vid]);

    // Build human-readable description
    let description = `Order ${orderNumber} - ${items.length} item(s) (₹${grossAmount} gross, ${commissionPercent}% comm)`;
    if (debtRecovered > 0) {
      description += ` [₹${debtRecovered} debt recovered]`;
    }

    // Insert transaction into ledger (guarded by uq_vendor_tx_order_credit index)
    await client.query(`
      INSERT INTO vendor_transactions 
        (vendor_id, type, amount, order_number, description, gross_amount, commission_percent, commission_amount, net_amount, debt_recovered)
      VALUES 
        ($1, 'credit', $2, $3, $4, $5, $6, $7, $8, $9)
    `, [
      vid,
      netCreditToWallet,
      orderNumber,
      description,
      grossAmount,
      commissionPercent,
      commissionAmount,
      netEarnings,
      debtRecovered
    ]);

    breakdownByVendor[vid].netCreditToWallet = netCreditToWallet;
    breakdownByVendor[vid].debtRecovered = debtRecovered;
    breakdownByVendor[vid].remainingDebt = remainingDebt;
  }

  return breakdownByVendor;
}

/**
 * Reverses vendor wallet credit for a cancelled order.
 * If wallet balance < net amount to reverse, unrecovered amount is recorded as vendor debt.
 * Idempotent: safe to call multiple times.
 *
 * @param {object} params
 * @param {number|string} params.vendorId
 * @param {string} params.orderNumber
 * @param {string} [params.reason]
 * @param {object} params.client - pg client with active transaction
 * @returns {Promise<object>}
 */
async function reverseVendorOrderCredit({ vendorId, orderNumber, reason = 'Order cancelled', client }) {
  if (!vendorId || !orderNumber) {
    throw new Error('vendorId and orderNumber are required to reverse vendor credit');
  }
  if (!client) throw new Error('Database transaction client is required');

  // 1. Check if credit transaction exists
  const creditRes = await client.query(`
    SELECT * 
    FROM vendor_transactions 
    WHERE vendor_id = $1 AND order_number = $2 AND type = 'credit'
  `, [vendorId, orderNumber]);

  if (creditRes.rows.length === 0) {
    return {
      success: true,
      reversed: false,
      message: 'No vendor credit record found for this order (legacy or non-vendor order)'
    };
  }

  const creditTx = creditRes.rows[0];

  // 2. Check if already reversed (Idempotency)
  const existingRev = await client.query(`
    SELECT * 
    FROM vendor_transactions 
    WHERE vendor_id = $1 AND order_number = $2 AND type = 'reversal'
  `, [vendorId, orderNumber]);

  if (existingRev.rows.length > 0) {
    return {
      success: true,
      reversed: false,
      alreadyReversed: true,
      message: 'Order credit was already reversed'
    };
  }

  // 3. Amount to reverse is the net earnings that were credited
  const netToReverse = parseFloat(creditTx.net_amount || creditTx.amount || 0);
  if (netToReverse <= 0) {
    return { success: true, reversed: false, message: 'Net amount to reverse is 0' };
  }

  // 4. Lock vendor row for update
  const vRes = await client.query(`
    SELECT wallet_balance, outstanding_debt 
    FROM vendors 
    WHERE id = $1 
    FOR UPDATE
  `, [vendorId]);

  if (vRes.rows.length === 0) throw new Error(`Vendor ${vendorId} not found`);

  const currentBalance = parseFloat(vRes.rows[0].wallet_balance || 0);
  const currentDebt = parseFloat(vRes.rows[0].outstanding_debt || 0);

  let recoveredFromWallet = 0;
  let addedToDebt = 0;
  let newBalance = 0;

  if (currentBalance >= netToReverse) {
    // Full recovery from existing wallet balance
    recoveredFromWallet = netToReverse;
    newBalance = Math.round((currentBalance - netToReverse) * 100) / 100;
    addedToDebt = 0;
  } else {
    // Partial recovery: take whatever is available, record remainder as debt
    recoveredFromWallet = Math.max(0, currentBalance);
    addedToDebt = Math.round((netToReverse - recoveredFromWallet) * 100) / 100;
    newBalance = 0;
  }

  const newDebt = Math.round((currentDebt + addedToDebt) * 100) / 100;

  // 5. Update vendor wallet and outstanding debt
  await client.query(`
    UPDATE vendors 
    SET wallet_balance = $1,
        outstanding_debt = $2 
    WHERE id = $3
  `, [newBalance, newDebt, vendorId]);

  // 6. Record reversal transaction in ledger
  let revDescription = `Order reversal - ${orderNumber} (${reason})`;
  if (addedToDebt > 0) {
    revDescription += ` [₹${recoveredFromWallet} deducted, ₹${addedToDebt} recorded as debt]`;
  }

  await client.query(`
    INSERT INTO vendor_transactions 
      (vendor_id, type, amount, order_number, description, gross_amount, commission_percent, commission_amount, net_amount, debt_recovered)
    VALUES 
      ($1, 'reversal', $2, $3, $4, $5, $6, $7, $8, $9)
  `, [
    vendorId,
    netToReverse,
    orderNumber,
    revDescription,
    creditTx.gross_amount || null,
    creditTx.commission_percent || null,
    creditTx.commission_amount || null,
    netToReverse,
    0
  ]);

  return {
    success: true,
    reversed: true,
    netToReverse,
    recoveredFromWallet,
    addedToDebt,
    newBalance,
    newDebt
  };
}

module.exports = {
  getVendorActiveCommissionRate,
  calculateVendorEarnings,
  processOrderVendorAccounting,
  reverseVendorOrderCredit,
};

