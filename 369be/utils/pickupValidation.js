// Indian States and Union Territories
const INDIAN_STATES = [
  'Andaman and Nicobar Islands',
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chandigarh',
  'Chhattisgarh',
  'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jammu and Kashmir',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Ladakh',
  'Lakshadweep',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Puducherry',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal'
];

/**
 * Validates a 6-digit Indian Postal Pincode (cannot start with 0).
 */
function isValidPincode(pincode) {
  if (!pincode) return false;
  return /^[1-9][0-9]{5}$/.test(String(pincode).trim());
}

/**
 * Validates a 10-digit Indian Mobile Number (starts with 6, 7, 8, or 9).
 */
function normalizeIndianPhone(phone) {
  if (!phone) return '';
  const digits = String(phone).replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) {
    return digits.slice(2);
  }
  if (digits.length === 11 && digits.startsWith('0')) {
    return digits.slice(1);
  }
  if (digits.length === 10) {
    return digits;
  }
  return '';
}

function isValidIndianPhone(phone) {
  const norm = normalizeIndianPhone(phone);
  return /^[6-9]\d{9}$/.test(norm);
}

/**
 * Matches and standardizes Indian state names case-insensitively.
 */
function normalizeState(state) {
  if (!state) return '';
  const clean = state.trim().toLowerCase();
  const found = INDIAN_STATES.find(s => s.toLowerCase() === clean);
  return found || state.trim();
}

/**
 * Validates structured pickup address inputs.
 * Returns { isValid: boolean, error?: string, sanitized?: object }
 */
function validatePickupAddress(input = {}) {
  const contactName = (input.pickup_contact_name || input.name || '').trim();
  const phone = normalizeIndianPhone(input.pickup_phone || input.phone || '');
  const line1 = (input.pickup_line1 || input.line1 || '').trim();
  const line2 = (input.pickup_line2 || input.line2 || '').trim();
  const city = (input.pickup_city || input.city || '').trim();
  const state = normalizeState(input.pickup_state || input.state || '');
  const pincode = String(input.pickup_pincode || input.pincode || '').trim();

  if (!contactName || contactName.length < 2) {
    return { isValid: false, error: 'Pickup contact name is required (minimum 2 characters).' };
  }

  if (!phone || !/^[6-9]\d{9}$/.test(phone)) {
    return { isValid: false, error: 'Valid 10-digit Indian pickup phone number is required (starts with 6-9).' };
  }

  if (!line1 || line1.length < 5) {
    return { isValid: false, error: 'Address Line 1 is required (minimum 5 characters, building/street).' };
  }

  if (!city || city.length < 2) {
    return { isValid: false, error: 'City is required.' };
  }

  if (!state) {
    return { isValid: false, error: 'State is required.' };
  }

  if (!isValidPincode(pincode)) {
    return { isValid: false, error: 'Invalid Pincode. Must be a 6-digit Indian postal code.' };
  }

  return {
    isValid: true,
    sanitized: {
      pickup_contact_name: contactName,
      pickup_phone: phone,
      pickup_line1: line1,
      pickup_line2: line2 || null,
      pickup_city: city,
      pickup_state: state,
      pickup_pincode: pincode,
    }
  };
}

const crypto = require('crypto');

/**
 * Computes a SHA-256 hash of address fields for change-detection and idempotency.
 */
function computeAddressHash(fields = {}) {
  const str = [
    fields.pickup_contact_name || '',
    fields.pickup_phone || '',
    fields.pickup_line1 || '',
    fields.pickup_line2 || '',
    fields.pickup_city || '',
    fields.pickup_state || '',
    fields.pickup_pincode || '',
  ].map(s => String(s).trim().toLowerCase()).join('|');

  return crypto.createHash('sha256').update(str).digest('hex');
}

/**
 * Generates a Shiprocket-compliant pickup location nickname.
 * Max 36 alphanumeric characters + underscores.
 */
function generateShiprocketNickname(vendorId, pincode, version = 1) {
  const cleanPin = String(pincode || '').replace(/\D/g, '').slice(0, 6) || 'pickup';
  const vSuffix = Number(version) > 1 ? `_v${version}` : '';
  const raw = `vnd_${vendorId}_${cleanPin}${vSuffix}`;
  // Ensure alphanumeric + underscore and max 36 chars
  return raw.replace(/[^a-zA-Z0-9_]/g, '_').slice(0, 36);
}

/**
 * Creates formatted legacy address string for backward compatibility.
 */
function formatFullAddress(fields = {}) {
  const l1 = fields.pickup_line1 || fields.line1 || '';
  const l2 = fields.pickup_line2 || fields.line2 || '';
  const c = fields.pickup_city || fields.city || '';
  const s = fields.pickup_state || fields.state || '';
  const p = fields.pickup_pincode || fields.pincode || '';

  const parts = [];
  if (l1) parts.push(l1);
  if (l2) parts.push(l2);
  if (c) parts.push(c);
  if (s && p) parts.push(`${s} - ${p}`);
  else if (s) parts.push(s);
  else if (p) parts.push(p);

  return parts.join(', ');
}

module.exports = {
  INDIAN_STATES,
  isValidPincode,
  isValidIndianPhone,
  normalizeIndianPhone,
  normalizeState,
  validatePickupAddress,
  generateShiprocketNickname,
  computeAddressHash,
  formatFullAddress,
};
