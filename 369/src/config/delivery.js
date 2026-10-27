// Centralized delivery configuration for frontend
// Can be customized via environment variables: VITE_DELIVERY_CHARGE and VITE_FREE_DELIVERY_THRESHOLD
export const DEFAULT_DELIVERY_CHARGE = Number(import.meta.env.VITE_DELIVERY_CHARGE || 0);
export const FREE_DELIVERY_THRESHOLD = Number(import.meta.env.VITE_FREE_DELIVERY_THRESHOLD || 500);

/**
 * Calculates delivery fee based on subtotal.
 * If base charge is 0, delivery is always FREE.
 * If subtotal meets or exceeds the free delivery threshold, delivery is FREE.
 */
export function calculateDeliveryCharge(subtotal, baseCharge = DEFAULT_DELIVERY_CHARGE, threshold = FREE_DELIVERY_THRESHOLD) {
  if (subtotal <= 0) return 0;
  if (baseCharge <= 0) return 0;
  if (threshold > 0 && subtotal >= threshold) return 0;
  return baseCharge;
}
