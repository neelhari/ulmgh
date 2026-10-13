const crypto = require('crypto');
const pool = require('../db');

/**
 * Generates a cryptographically secure 6-digit numeric OTP.
 * @returns {string} 6-digit OTP string
 */
function generateOTP() {
  return crypto.randomInt(100000, 1000000).toString();
}

/**
 * Creates and stores an OTP for the given email, expiring in 10 minutes.
 * Overwrites any previous active OTPs for the same email and resets attempts to 0.
 * @param {string} email
 * @param {string} otp
 */
async function createOTP(email, otp) {
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry
  await pool.query('DELETE FROM otps WHERE email = $1', [email]);
  try {
    await pool.query(
      'INSERT INTO otps (email, otp, expires_at, attempts) VALUES ($1, $2, $3, 0)',
      [email, otp, expiresAt]
    );
  } catch (err) {
    if (err.code === '42703') { // attempts column not created yet prior to running MIGRATION.sql
      await pool.query(
        'INSERT INTO otps (email, otp, expires_at) VALUES ($1, $2, $3)',
        [email, otp, expiresAt]
      );
    } else {
      throw err;
    }
  }
}

/**
 * Verifies an OTP with security checks:
 * - Checks 10-minute expiration
 * - Increments attempts counter on wrong attempt; deletes/invalidates after 5 wrong attempts
 * - Deletes OTP on successful consumption (unless consumeOnSuccess is false)
 * @param {string} email
 * @param {string} otp
 * @param {boolean} [consumeOnSuccess=true]
 * @returns {Promise<{ valid: boolean, error?: string }>}
 */
async function verifyOTP(email, otp, consumeOnSuccess = true) {
  if (!email || !otp) {
    return { valid: false, error: 'Email and OTP are required' };
  }

  const result = await pool.query(
    'SELECT * FROM otps WHERE email = $1 ORDER BY created_at DESC LIMIT 1',
    [email]
  );

  if (!result.rows.length) {
    return { valid: false, error: 'No OTP found for this email. Please request a new OTP.' };
  }

  const record = result.rows[0];

  // 1. Check 10-minute expiry
  if (new Date(record.expires_at) < new Date()) {
    await pool.query('DELETE FROM otps WHERE id = $1', [record.id]);
    return { valid: false, error: 'OTP has expired. Please request a new one.' };
  }

  const currentAttempts = (record.attempts || 0) + 1;

  // 2. Check if OTP matches
  if (record.otp !== otp.toString().trim()) {
    if (currentAttempts >= 5) {
      // Invalidate and delete after 5 failed attempts
      await pool.query('DELETE FROM otps WHERE id = $1', [record.id]);
      return {
        valid: false,
        error: 'Maximum attempts exceeded (5). This OTP has been invalidated. Please request a new one.'
      };
    }

    try {
      await pool.query('UPDATE otps SET attempts = $1 WHERE id = $2', [currentAttempts, record.id]);
    } catch (e) {
      // Column may not exist before migration
    }

    const remaining = 5 - currentAttempts;
    return {
      valid: false,
      error: `Invalid OTP. ${remaining} attempt(s) remaining.`
    };
  }

  // 3. Valid OTP: consume and delete after use if requested
  if (consumeOnSuccess) {
    await pool.query('DELETE FROM otps WHERE id = $1', [record.id]);
  }

  return { valid: true };
}

module.exports = {
  generateOTP,
  createOTP,
  verifyOTP
};
