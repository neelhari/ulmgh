const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const dotenv = require('dotenv');

dotenv.config();

const email = process.argv[2];
const newPassword = process.argv[3];

if (!email || !newPassword) {
  console.log('Usage: node reset_admin.js <email> <newPassword>');
  process.exit(1);
}

async function updateDb(connectionString, label) {
  if (!connectionString) return;
  const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    const hash = await bcrypt.hash(newPassword, 10);
    const res = await pool.query(
      "UPDATE users SET password_hash = $1, role = 'admin', is_verified = TRUE WHERE email = $2 RETURNING id, name, email, role",
      [hash, email]
    );

    if (res.rowCount > 0) {
      console.log(`✅ [${label}] Updated ${email} successfully! Role: admin`);
    } else {
      console.log(`⚠️ [${label}] No user found with email: ${email}`);
    }
  } catch (err) {
    console.error(`❌ [${label}] Error:`, err.message);
  } finally {
    await pool.end();
  }
}

async function main() {
  console.log(`Resetting admin password for: ${email}\n`);

  // 1. Update standard DATABASE_URL (.env)
  if (process.env.DATABASE_URL) {
    await updateDb(process.env.DATABASE_URL, '.env DATABASE_URL');
  }

  // 2. Update .env.newdb if present
  if (fs.existsSync('.env.newdb')) {
    const parsed = dotenv.parse(fs.readFileSync('.env.newdb', 'utf8'));
    if (parsed.NEW_DATABASE_URL) {
      await updateDb(parsed.NEW_DATABASE_URL, '.env.newdb NEW_DATABASE_URL');
    }
  }

  console.log('\n🎉 Password updated successfully!');
}

main().catch(console.error);
