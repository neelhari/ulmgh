const { Pool } = require('pg');
const fs = require('fs');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');

const envOld = dotenv.parse(fs.readFileSync('.env'));
const poolOld = new Pool({ connectionString: envOld.DATABASE_URL, ssl: { rejectUnauthorized: true } });

async function testUlmgh() {
  // Test if user from OLD DB exists in ulmgh.vercel.app
  const testEmail = 'TEST_ulmgh_' + Date.now() + '@example.com';
  const testPass = 'UlmghPass123!';
  const hash = await bcrypt.hash(testPass, 10);

  await poolOld.query(
    'INSERT INTO users (name, email, phone, password_hash, role, is_verified) VALUES ($1, $2, $3, $4, $5, $6)',
    ['TEST_Ulmgh', testEmail, '9999999999', hash, 'user', true]
  );

  const res = await fetch('https://ulmgh.vercel.app/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: testEmail, password: testPass })
  });

  console.log('Login on ulmgh.vercel.app with OLD DB user:', res.status);
  const data = await res.json();
  console.log('Response data:', data);

  await poolOld.query('DELETE FROM users WHERE email = $1', [testEmail]);
  await poolOld.end();
}

testUlmgh().catch(console.error);
