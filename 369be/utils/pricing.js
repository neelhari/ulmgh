const pool = require('../db');

// Configurable delivery charge rule (set via env, defaults to 0 / free delivery above threshold)
const DELIVERY_CHARGE = Number(process.env.DELIVERY_CHARGE || 0);
const FREE_DELIVERY_THRESHOLD = Number(process.env.FREE_DELIVERY_THRESHOLD || 500);

function getDeliveryCharge(subtotal) {
  if (subtotal <= 0) return 0;
  if (DELIVERY_CHARGE <= 0) return 0;
  if (FREE_DELIVERY_THRESHOLD > 0 && subtotal >= FREE_DELIVERY_THRESHOLD) return 0;
  return DELIVERY_CHARGE;
}

/**
 * Finds the highest-priority active automatic offer applicable to a product.
 * @param {Object} product
 * @param {Array} offers
 * @returns {Object|null}
 */
function findMatchingOffer(product, offers = []) {
  if (!product || !Array.isArray(offers) || offers.length === 0) return null;

  const now = new Date();

  const eligibleOffers = offers.filter((o) => {
    if (!o) return false;
    if (o.offer_type !== 'offer') return false;
    if (o.is_active === false) return false;
    if (o.expires_at && new Date(o.expires_at) <= now) return false;

    if (o.scope === 'all') return true;

    if (o.scope === 'category') {
      let cats = [];
      try {
        cats = typeof o.category_ids === 'string' ? JSON.parse(o.category_ids) : (o.category_ids || []);
      } catch (e) {
        cats = [];
      }
      return cats.map(String).includes(String(product.category));
    }

    if (o.scope === 'product') {
      let pids = [];
      try {
        pids = typeof o.product_ids === 'string' ? JSON.parse(o.product_ids) : (o.product_ids || []);
      } catch (e) {
        pids = [];
      }
      return pids.map(String).includes(String(product.id));
    }

    return false;
  });

  if (eligibleOffers.length === 0) return null;

  return eligibleOffers.reduce((best, curr) => {
    const currPct = parseFloat(curr.discount_percent) || 0;
    const bestPct = parseFloat(best.discount_percent) || 0;
    return currPct > bestPct ? curr : best;
  }, eligibleOffers[0]);
}

/**
 * Calculates order pricing directly from DB products, active automatic offers, and coupons.
 * @param {Array} items - List of cart items
 * @param {string} couponCode - Optional coupon code
 * @param {object} [dbClient=pool] - Optional pg client for transactions
 * @returns {Promise<{ verifiedItems: Array, subtotal: number, discount: number, deliveryCharge: number, total: number }>}
 */
async function calculateOrder(items, couponCode = '', dbClient = pool) {
  if (!items || !Array.isArray(items) || items.length === 0) {
    const err = new Error('Cart is empty');
    err.statusCode = 400;
    throw err;
  }

  // 1. Fetch active automatic offers
  let activeOffers = [];
  try {
    const offersRes = await dbClient.query(
      "SELECT * FROM offers WHERE offer_type = 'offer' AND is_active = true AND (expires_at IS NULL OR expires_at > NOW()) ORDER BY created_at DESC"
    );
    activeOffers = offersRes.rows || [];
  } catch (offerErr) {
    console.warn("Could not fetch active offers for pricing calculation:", offerErr.message);
  }

  let subtotal = 0;
  let totalQty = 0;
  const verifiedItems = [];

  for (const item of items) {
    const productId = item.product?.id || item.id;
    if (!productId) {
      const err = new Error('Invalid product in order');
      err.statusCode = 400;
      throw err;
    }

    const prodRes = await dbClient.query('SELECT * FROM products WHERE id = $1', [productId]);
    if (prodRes.rows.length === 0) {
      const err = new Error(`Product not found (ID: ${productId})`);
      err.statusCode = 400;
      throw err;
    }

    const dbProduct = prodRes.rows[0];
    const qty = Math.max(1, parseInt(item.qty || item.quantity || 1, 10));

    // Stock check
    if (dbProduct.stock < qty || dbProduct.stock_status === 'Out of Stock') {
      const err = new Error(`Product "${dbProduct.name}" is out of stock`);
      err.statusCode = 400;
      throw err;
    }

    // Check variant price in sizes JSON if applicable
    let sizesList = [];
    try {
      sizesList = typeof dbProduct.sizes === 'string' ? JSON.parse(dbProduct.sizes) : (dbProduct.sizes || []);
    } catch (e) {
      sizesList = [];
    }

    const variantSizeName = typeof item.variant === 'string' ? item.variant : (item.variant?.size || item.size || null);
    let unitPrice = parseFloat(dbProduct.price) || 0;

    if (variantSizeName && Array.isArray(sizesList)) {
      const matchedSize = sizesList.find(
        s => s && s.size && s.size.toString().toLowerCase() === variantSizeName.toString().toLowerCase()
      );
      if (matchedSize && matchedSize.price) {
        unitPrice = parseFloat(matchedSize.price);
      }
    }

    // Apply active automatic offer to determine unit price
    const baseUnitPrice = unitPrice;
    const matchingOffer = findMatchingOffer(dbProduct, activeOffers);
    const offerDiscount = matchingOffer ? (parseFloat(matchingOffer.discount_percent) || 0) : 0;
    const effectiveUnitPrice = offerDiscount > 0
      ? Math.round(baseUnitPrice * (1 - offerDiscount / 100))
      : baseUnitPrice;

    subtotal += effectiveUnitPrice * qty;
    totalQty += qty;

    verifiedItems.push({
      ...item,
      qty,
      price: effectiveUnitPrice,
      base_price: baseUnitPrice,
      offer_discount: offerDiscount,
      product: {
        ...item.product,
        id: dbProduct.id,
        name: dbProduct.name,
        category: dbProduct.category,
        vendor_id: dbProduct.vendor_id,
        price: effectiveUnitPrice,
        base_price: baseUnitPrice,
        mrp: dbProduct.mrp,
        image_url: dbProduct.image_url,
      },
      variant: typeof item.variant === 'object' && item.variant !== null
        ? { ...item.variant, price: effectiveUnitPrice }
        : item.variant,
    });
  }

  // 2. Coupon discount calculation
  const cleanCode = (couponCode || '').trim();
  let discount = 0;

  if (cleanCode) {
    const adminResult = await dbClient.query(
      'SELECT *, \'admin\' as source FROM coupons WHERE UPPER(code) = UPPER($1) AND is_active = true',
      [cleanCode]
    );

    const vendorResult = await dbClient.query(
      "SELECT *, 'vendor' as source FROM offers WHERE UPPER(code) = UPPER($1) AND is_active = true AND offer_type = 'coupon'",
      [cleanCode]
    );

    const row = adminResult.rows[0] || vendorResult.rows[0];
    if (!row) {
      const err = new Error('Invalid or expired coupon');
      err.statusCode = 400;
      throw err;
    }

    if (row.expires_at && new Date(row.expires_at) < new Date()) {
      const err = new Error('This coupon has expired');
      err.statusCode = 400;
      throw err;
    }

    let applicableSubtotal = 0;
    let applicableQty = 0;

    if (row.source === 'vendor' && row.vendor_id) {
      verifiedItems.forEach(item => {
        if (item.product?.vendor_id === row.vendor_id) {
          applicableSubtotal += item.price * item.qty;
          applicableQty += item.qty;
        }
      });
      if (applicableQty === 0) {
        const err = new Error('This coupon is not applicable to any items in your cart.');
        err.statusCode = 400;
        throw err;
      }
    } else {
      applicableSubtotal = subtotal;
      applicableQty = totalQty;
    }

    const restrictionType = row.restriction_type || row.min_type || 'min_amount';
    const restrictionValue = parseFloat(row.restriction_value || row.min_value || row.min_order_value || 0);

    if ((restrictionType === 'min_qty' || restrictionType === 'qty') && applicableQty < restrictionValue) {
      const err = new Error(`Minimum ${restrictionValue} applicable items required`);
      err.statusCode = 400;
      throw err;
    }
    if (restrictionType !== 'min_qty' && restrictionType !== 'qty' && applicableSubtotal < restrictionValue) {
      const err = new Error(`Minimum applicable order amount ₹${restrictionValue} required`);
      err.statusCode = 400;
      throw err;
    }

    const discountType = row.discount_type || 'percent';
    const val = parseFloat(row.discount_value || row.discount_percent || 0);

    if (discountType === 'percentage' || discountType === 'percent') {
      discount = Math.round((applicableSubtotal * val) / 100);
    } else {
      discount = Math.min(val, applicableSubtotal);
    }
  }

  // 3. Delivery charge and final total
  const deliveryCharge = getDeliveryCharge(subtotal);
  const total = Math.max(0, subtotal - discount) + deliveryCharge;

  return {
    verifiedItems,
    subtotal,
    discount,
    deliveryCharge,
    total
  };
}

module.exports = {
  DELIVERY_CHARGE,
  FREE_DELIVERY_THRESHOLD,
  getDeliveryCharge,
  findMatchingOffer,
  calculateOrder
};
