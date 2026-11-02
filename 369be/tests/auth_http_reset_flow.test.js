/**
 * Full End-to-End HTTP Integration Test for Password Reset Flow
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

// Import app to start listening on PORT 5000
const app = require('../index');
const baseUrl = `http://127.0.0.1:${process.env.PORT || 5000}`;

async function run() {
  console.log('🚀 Running HTTP-level Password Reset Flow Tests...\n');
  console.log(`  ℹ️ Targeting server on ${baseUrl}`);

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

  const testEmail = `e2e_reset_${Date.now()}@teststore.com`;
  const originalPass = 'PassOriginal_123';
  const newPass = 'UpdatedSecure_789';
  let userId = null;

  try {
    // 1. Create registered user in database
    const origHash = await bcrypt.hash(originalPass, 10);
    const uRes = await testPool.query(
      'INSERT INTO users (name, email, phone, password_hash, is_verified, role) VALUES ($1, $2, $3, $4, true, $5) RETURNING id',
      ['E2E Customer', testEmail, '9876543210', origHash, 'customer']
    );
    userId = uRes.rows[0].id;

    // 2. Test POST /api/auth/forgot-password with unknown email -> 404
    await testAsync('POST /api/auth/forgot-password with unknown email returns 404', async () => {
      const res = await fetch(`${baseUrl}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'nonexistent_account_99999@teststore.com' }),
      });
      assert.strictEqual(res.status, 404);
      const data = await res.json();
      assert(data.error.includes('No account found'), 'Must return descriptive error');
    });

    // 3. Test POST /api/auth/forgot_password (with UNDERSCORE) -> 200
    await testAsync('POST /api/auth/forgot_password (with underscore) succeeds with 200', async () => {
      const res = await fetch(`${baseUrl}/api/auth/forgot_password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: testEmail }),
      });
      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.success, true);
      assert(data.message.includes('sent to your email'));
    });

    // Verify token was stored in DB
    let tokenRecord = null;
    await testAsync('Token hash exists in password_reset_tokens table', async () => {
      const q = await testPool.query('SELECT * FROM password_reset_tokens WHERE user_id = $1', [userId]);
      assert.strictEqual(q.rows.length, 1);
      tokenRecord = q.rows[0];
      assert.strictEqual(tokenRecord.email, testEmail);
      assert(tokenRecord.token_hash, 'Hash must be populated');
    });

    // 4. Test POST /api/auth/forgot-password (with HYPHEN) supersedes previous token
    await testAsync('POST /api/auth/forgot-password replaces previous token', async () => {
      const res = await fetch(`${baseUrl}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: testEmail }),
      });
      assert.strictEqual(res.status, 200);

      const q = await testPool.query('SELECT * FROM password_reset_tokens WHERE user_id = $1', [userId]);
      assert.strictEqual(q.rows.length, 1, 'Only one active token must exist');
      assert.notStrictEqual(q.rows[0].token_hash, tokenRecord.token_hash, 'New token must have different hash');
      tokenRecord = q.rows[0];
    });

    // 5. Test GET /api/auth/verify-reset-token with invalid token -> 400
    await testAsync('GET /api/auth/verify-reset-token with invalid token returns 400', async () => {
      const res = await fetch(`${baseUrl}/api/auth/verify-reset-token?token=invalid_token_1234567890`);
      assert.strictEqual(res.status, 400);
      const data = await res.json();
      assert.strictEqual(data.valid, false);
    });

    // Generate a unique token for this test run
    const testRawToken = crypto.randomBytes(32).toString('hex');
    const testHash = crypto.createHash('sha256').update(testRawToken).digest('hex');
    await testPool.query('DELETE FROM password_reset_tokens WHERE user_id = $1', [userId]);
    await testPool.query(
      'INSERT INTO password_reset_tokens (user_id, email, token_hash, expires_at) VALUES ($1, $2, $3, NOW() + INTERVAL \'1 hour\')',
      [userId, testEmail, testHash]
    );

    // 6. Test GET /api/auth/verify-reset-token with valid token -> 200
    await testAsync('GET /api/auth/verify-reset-token with valid token returns 200 & email', async () => {
      const res = await fetch(`${baseUrl}/api/auth/verify-reset-token?token=${testRawToken}`);
      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.valid, true);
      assert.strictEqual(data.email, testEmail);
    });

    // 7. Test POST /api/auth/reset-password with short password (< 6 chars) -> 400
    await testAsync('POST /api/auth/reset-password rejects short password with 400', async () => {
      const res = await fetch(`${baseUrl}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: testRawToken, newPassword: '123' }),
      });
      assert.strictEqual(res.status, 400);
      const data = await res.json();
      assert(data.error.includes('at least 6 characters'));
    });

    // 8. Test POST /api/auth/reset-password with valid token & new password -> 200
    await testAsync('POST /api/auth/reset-password successfully updates password', async () => {
      const res = await fetch(`${baseUrl}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: testRawToken, newPassword: newPass }),
      });
      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.success, true);
    });

    // 9. Test Single-Use: Reusing the same token -> 400
    await testAsync('Reusing the already-consumed reset token is rejected with 400', async () => {
      const res = await fetch(`${baseUrl}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: testRawToken, newPassword: 'AnotherPassword999!' }),
      });
      assert.strictEqual(res.status, 400);
      const data = await res.json();
      assert(data.error.includes('invalid or has expired'));
    });

    // 10. Test Login: Old password fails, new password succeeds!
    await testAsync('Login with old password fails (401)', async () => {
      const res = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: testEmail, password: originalPass }),
      });
      assert.strictEqual(res.status, 401);
    });

    await testAsync('Login with new password succeeds (200) and returns auth token', async () => {
      const res = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: testEmail, password: newPass }),
      });
      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert(data.token, 'Must return JWT auth token');
      assert.strictEqual(data.user.email, testEmail);
    });

  } finally {
    // Cleanup
    if (userId) {
      await testPool.query('DELETE FROM password_reset_tokens WHERE user_id = $1', [userId]);
      await testPool.query('DELETE FROM users WHERE id = $1', [userId]);
      console.log(`  ℹ️ Cleaned up test user #${userId}`);
    }
    await testPool.end();
  }

  console.log(`\n=================================================`);
  console.log(`HTTP INTEGRATION SUMMARY: ${passed} Passed, ${failed} Failed`);

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

run().catch(async (err) => {
  console.error('Test runner exception:', err);
  try { await testPool.end(); } catch (e) {}
  process.exit(1);
});
