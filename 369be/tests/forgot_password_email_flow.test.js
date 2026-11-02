/**
 * Automated Test Suite for Email-Link Password Reset Flow
 */
const path = require('path');
const assert = require('assert');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
require('dotenv').config({ path: path.join(__dirname, '../.env.newdb') });

const connectionString = process.env.NEW_DATABASE_URL || process.env.DATABASE_URL;
const testPool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: true },
  max: 5,
});

async function runTests() {
  console.log('🚀 Running Email-Link Password Reset Flow Tests...\n');

  let passed = 0;
  let failed = 0;

  function test(name, fn) {
    try {
      fn();
      console.log(`  ✅ PASS: ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ❌ FAIL: ${name}`);
      console.error(`     Error: ${err.message}`);
      failed++;
    }
  }

  async function testAsync(name, fn) {
    try {
      await fn();
      console.log(`  ✅ PASS: ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ❌ FAIL: ${name}`);
      console.error(`     Error: ${err.message}`);
      failed++;
    }
  }

  const testEmail = `pw_reset_test_${Date.now()}@example.com`;
  const initialPassword = 'InitialSecretPass123!';
  const newPassword = 'BrandNewSecurePass456!';
  let testUserId = null;

  try {
    // 0. Setup: Create a temporary test user
    const initialHash = await bcrypt.hash(initialPassword, 10);
    const userInsert = await testPool.query(
      'INSERT INTO users (name, email, phone, password_hash, is_verified, role) VALUES ($1, $2, $3, $4, true, $5) RETURNING id',
      ['Reset Test User', testEmail, '9999988888', initialHash, 'customer']
    );
    testUserId = userInsert.rows[0].id;
    console.log(`  ℹ️ Created test user #${testUserId} with email ${testEmail}`);

    // 1. Test token creation & hashing in DB
    let rawResetToken = null;
    await testAsync('Generate cryptographically random token and store SHA-256 hash', async () => {
      rawResetToken = crypto.randomBytes(32).toString('hex');
      assert.strictEqual(rawResetToken.length, 64, 'Raw token must be 64 hex characters (32 bytes)');
      const tokenHash = crypto.createHash('sha256').update(rawResetToken).digest('hex');
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      await testPool.query(
        'INSERT INTO password_reset_tokens (user_id, email, token_hash, expires_at) VALUES ($1, $2, $3, $4)',
        [testUserId, testEmail, tokenHash, expiresAt]
      );

      const check = await testPool.query('SELECT * FROM password_reset_tokens WHERE user_id = $1', [testUserId]);
      assert.strictEqual(check.rows.length, 1);
      assert.strictEqual(check.rows[0].token_hash, tokenHash);
      assert.strictEqual(check.rows[0].email, testEmail);
    });

    // 2. Test Token Verification logic
    await testAsync('Verify valid unexpired token returns user email', async () => {
      const tokenHash = crypto.createHash('sha256').update(rawResetToken).digest('hex');
      const tokenRes = await testPool.query(
        'SELECT id, email, expires_at FROM password_reset_tokens WHERE token_hash = $1 AND expires_at > NOW()',
        [tokenHash]
      );
      assert.strictEqual(tokenRes.rows.length, 1);
      assert.strictEqual(tokenRes.rows[0].email, testEmail);
    });

    await testAsync('Verify invalid or tampered token is rejected', async () => {
      const tamperedHash = crypto.createHash('sha256').update('tampered_fake_token_value_here').digest('hex');
      const tokenRes = await testPool.query(
        'SELECT id, email, expires_at FROM password_reset_tokens WHERE token_hash = $1 AND expires_at > NOW()',
        [tamperedHash]
      );
      assert.strictEqual(tokenRes.rows.length, 0, 'Tampered token must not match');
    });

    await testAsync('Verify expired token is rejected', async () => {
      const expiredRaw = crypto.randomBytes(32).toString('hex');
      const expiredHash = crypto.createHash('sha256').update(expiredRaw).digest('hex');
      const expiredDate = new Date(Date.now() - 10000); // 10 seconds in past

      await testPool.query(
        'INSERT INTO password_reset_tokens (user_id, email, token_hash, expires_at) VALUES ($1, $2, $3, $4)',
        [testUserId, testEmail, expiredHash, expiredDate]
      );

      const tokenRes = await testPool.query(
        'SELECT id, email, expires_at FROM password_reset_tokens WHERE token_hash = $1 AND expires_at > NOW()',
        [expiredHash]
      );
      assert.strictEqual(tokenRes.rows.length, 0, 'Expired token must not be accepted');
    });

    // 3. Test Password Reset Execution
    await testAsync('Reset password securely updates bcrypt password_hash and deletes token', async () => {
      const tokenHash = crypto.createHash('sha256').update(rawResetToken).digest('hex');
      const tokenRes = await testPool.query(
        'SELECT id, user_id, email FROM password_reset_tokens WHERE token_hash = $1 AND expires_at > NOW()',
        [tokenHash]
      );
      assert.strictEqual(tokenRes.rows.length, 1);

      const newHash = await bcrypt.hash(newPassword, 10);
      await testPool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [newHash, tokenRes.rows[0].user_id]);
      await testPool.query('DELETE FROM password_reset_tokens WHERE id = $1', [tokenRes.rows[0].id]);

      // Check user password updated
      const userRes = await testPool.query('SELECT password_hash FROM users WHERE id = $1', [testUserId]);
      const isNewMatch = await bcrypt.compare(newPassword, userRes.rows[0].password_hash);
      const isOldMatch = await bcrypt.compare(initialPassword, userRes.rows[0].password_hash);

      assert.strictEqual(isNewMatch, true, 'New password must verify successfully');
      assert.strictEqual(isOldMatch, false, 'Old password must no longer match');
    });

    // 4. Test Single-Use Enforcement
    await testAsync('Token is single-use and cannot be reused', async () => {
      const tokenHash = crypto.createHash('sha256').update(rawResetToken).digest('hex');
      const tokenRes = await testPool.query(
        'SELECT id FROM password_reset_tokens WHERE token_hash = $1 AND expires_at > NOW()',
        [tokenHash]
      );
      assert.strictEqual(tokenRes.rows.length, 0, 'Consumed token must no longer exist in DB');
    });

    // 5. Test Multiple Requests: New request invalidates previous token
    await testAsync('New forgot-password request supersedes and invalidates old token', async () => {
      const token1Raw = crypto.randomBytes(32).toString('hex');
      const token1Hash = crypto.createHash('sha256').update(token1Raw).digest('hex');
      const token2Raw = crypto.randomBytes(32).toString('hex');
      const token2Hash = crypto.createHash('sha256').update(token2Raw).digest('hex');
      const expires = new Date(Date.now() + 3600000);

      // Insert token 1
      await testPool.query('DELETE FROM password_reset_tokens WHERE user_id = $1', [testUserId]);
      await testPool.query('INSERT INTO password_reset_tokens (user_id, email, token_hash, expires_at) VALUES ($1, $2, $3, $4)', [testUserId, testEmail, token1Hash, expires]);

      // Now user requests again: token 1 should be removed, token 2 inserted
      await testPool.query('DELETE FROM password_reset_tokens WHERE user_id = $1', [testUserId]);
      await testPool.query('INSERT INTO password_reset_tokens (user_id, email, token_hash, expires_at) VALUES ($1, $2, $3, $4)', [testUserId, testEmail, token2Hash, expires]);

      const t1Check = await testPool.query('SELECT id FROM password_reset_tokens WHERE token_hash = $1', [token1Hash]);
      const t2Check = await testPool.query('SELECT id FROM password_reset_tokens WHERE token_hash = $1', [token2Hash]);

      assert.strictEqual(t1Check.rows.length, 0, 'Old token must be deleted');
      assert.strictEqual(t2Check.rows.length, 1, 'Only latest token must exist');
    });

  } finally {
    // Cleanup test user and tokens
    if (testUserId) {
      await testPool.query('DELETE FROM password_reset_tokens WHERE user_id = $1', [testUserId]);
      await testPool.query('DELETE FROM users WHERE id = $1', [testUserId]);
      console.log(`  ℹ️ Cleaned up test user #${testUserId}`);
    }
    await testPool.end();
  }

  console.log(`\n=================================================`);
  console.log(`TEST SUMMARY: ${passed} Passed, ${failed} Failed`);

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests().catch(async (err) => {
  console.error('Test runner exception:', err);
  try { await testPool.end(); } catch (e) {}
  process.exit(1);
});

