/**
 * Canonical pricing utilities for ULMGH369.
 * Ensures consistent price, MRP, discount percentage, and offer calculation
 * across all cards, sliders, detail pages, cart, and checkout.
 */

/**
 * Finds the highest-priority active automatic offer applicable to a product.
 * Automatic offers have `offer_type === 'offer'` (coupons with offer_type === 'coupon'
 * require explicit code entry).
 *
 * @param {Object} product
 * @param {Array} offers
 * @returns {Object|null} The best matching offer or null
 */
export function findMatchingOffer(product, offers = []) {
  if (!product || !Array.isArray(offers) || offers.length === 0) return null;

  const now = new Date();
  const isVendorProduct = product.vendor_id !== null && product.vendor_id !== undefined && product.vendor_id !== '';

  const eligibleOffers = offers.filter((o) => {
    if (!o) return false;
    // Only auto-applied offers
    if (o.offer_type !== 'offer') return false;
    if (o.is_active === false) return false;

    // Expiry check
    if (o.expires_at && new Date(o.expires_at) <= now) return false;

    const isOfferFromVendor = o.created_by === 'vendor' || (o.vendor_id !== null && o.vendor_id !== undefined && o.vendor_id !== '');

    // 1. Vendor offer ownership isolation:
    // Vendor-created offers apply ONLY to eligible products belonging to that specific vendor.
    if (isOfferFromVendor) {
      if (!isVendorProduct) return false;
      if (String(product.vendor_id) !== String(o.vendor_id)) return false;
    }

    // 2. Admin storewide automatic offers:
    // Prevent admin storewide offers from applying to third-party vendor products.
    if (o.scope === 'all') {
      if (isOfferFromVendor) {
        return isVendorProduct && String(product.vendor_id) === String(o.vendor_id);
      }
      return !isVendorProduct;
    }

    // 3. Category-scoped offers:
    if (o.scope === 'category') {
      if (!isOfferFromVendor && isVendorProduct) return false;
      let cats = [];
      try {
        cats = typeof o.category_ids === 'string' ? JSON.parse(o.category_ids) : (o.category_ids || []);
      } catch (e) {
        cats = [];
      }
      return cats.map(String).includes(String(product.category));
    }

    // 4. Product-scoped offers:
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

  // Best offer is the one with highest discount_percent
  return eligibleOffers.reduce((best, curr) => {
    const currPct = parseFloat(curr.discount_percent) || 0;
    const bestPct = parseFloat(best.discount_percent) || 0;
    return currPct > bestPct ? curr : best;
  }, eligibleOffers[0]);
}

/**
 * Calculates canonical pricing details for a product.
 *
 * Rules:
 * 1. Base price is from selectedVariant or product.
 * 2. If an active automatic offer matches, effectivePrice = round(basePrice * (1 - discount% / 100)).
 * 3. MRP is genuine product.mrp (or selectedVariant.mrp). If missing or <= basePrice, mrp is null.
 * 4. Strikethrough price:
 *    - If real MRP exists and > effectivePrice: strikePrice = mrp
 *    - Else if offerDiscount > 0: strikePrice = basePrice
 *    - Else: strikePrice = null
 * 5. Discount percent:
 *    - If real MRP exists: round(((mrp - effectivePrice) / mrp) * 100)
 *    - Else if offerDiscount > 0: round(offerDiscount)
 *    - Else: 0
 *
 * @param {Object} product
 * @param {Object|null} selectedVariant
 * @param {Array} offers
 * @returns {{
 *   basePrice: number,
 *   effectivePrice: number,
 *   mrp: number|null,
 *   strikePrice: number|null,
 *   discountPercent: number,
 *   offerDiscount: number,
 *   matchingOffer: Object|null
 * }}
 */
export function calculateProductPricing(product, selectedVariant = null, offers = []) {
  if (!product) {
    return {
      basePrice: 0,
      effectivePrice: 0,
      mrp: null,
      strikePrice: null,
      discountPercent: 0,
      offerDiscount: 0,
      matchingOffer: null,
    };
  }

  const basePrice = Math.max(0, Number(selectedVariant?.price ?? product?.price ?? 0));
  const matchingOffer = findMatchingOffer(product, offers);
  const offerDiscount = matchingOffer ? (parseFloat(matchingOffer.discount_percent) || 0) : 0;

  const effectivePrice = offerDiscount > 0
    ? Math.round(basePrice * (1 - offerDiscount / 100))
    : basePrice;

  const rawMrp = Number(selectedVariant?.mrp || product?.mrp || 0);
  const hasRealMrp = rawMrp > basePrice;

  let mrp = null;
  let strikePrice = null;
  let discountPercent = 0;

  if (hasRealMrp) {
    mrp = rawMrp;
    strikePrice = rawMrp;
    discountPercent = Math.round(((rawMrp - effectivePrice) / rawMrp) * 100);
  } else if (offerDiscount > 0) {
    mrp = null;
    strikePrice = basePrice;
    discountPercent = Math.round(offerDiscount);
  }

  return {
    basePrice,
    effectivePrice,
    mrp,
    strikePrice,
    discountPercent,
    offerDiscount,
    matchingOffer,
  };
}

