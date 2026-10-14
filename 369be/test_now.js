const { Pool } = require('pg');
const fs = require('fs');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');

const envNew = dotenv.parse(fs.readFileSync('.env.newdb'));
const poolNew = new Pool({ connectionString: envNew.NEW_DATABASE_URL, ssl: { rejectUnauthorized: true } });

async function testNow() {
  const testEmail = 'TEST_live_now_' + Date.now() + '@example.com';
  const testPass = 'LivePass123!';
  const hash = await bcrypt.hash(testPass, 10);

  // Insert into NEW DB
  await poolNew.query(
    'INSERT INTO users (name, email, phone, password_hash, role, is_verified) VALUES ($1, $2, $3, $4, $5, $6)',
    ['TEST_Live', testEmail, '9999999999', hash, 'user', true]
  );
  console.log('Inserted into NEW DB:', testEmail);

  // Call login on live Vercel
  const res = await fetch('https://ulmgh.vercel.app/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: testEmail, password: testPass })
  });

  console.log('Login status:', res.status);
  const data = await res.json();
  console.log('Login response:', data);

  // Clean up
  await poolNew.query('DELETE FROM users WHERE email = $1', [testEmail]);
  await poolNew.end();
}

testNow().catch(console.error);
