const pool = require('./db');

async function migrateBankDetails() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    console.log('Applying vendor bank details additive migrations...');

    // 1. Vendors: bank account and verification status
    await client.query(`
      ALTER TABLE vendors 
      ADD COLUMN IF NOT EXISTS bank_account_holder_name VARCHAR(150),
      ADD COLUMN IF NOT EXISTS bank_account_number VARCHAR(50),
      ADD COLUMN IF NOT EXISTS bank_ifsc_code VARCHAR(20),
      ADD COLUMN IF NOT EXISTS bank_name VARCHAR(100),
      ADD COLUMN IF NOT EXISTS bank_verification_status VARCHAR(50) DEFAULT 'not_provided';
    `);

    // 2. Vendor transactions: bank transfer reference / UTR
    await client.query(`
      ALTER TABLE vendor_transactions 
      ADD COLUMN IF NOT EXISTS bank_reference VARCHAR(100);
    `);

    await client.query('COMMIT');
    console.log('✅ Vendor bank details migrations applied successfully.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Migration failed:', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

if (require.main === module) {
  migrateBankDetails().catch(err => {
    console.error(err);
    process.exit(1);
  });
}

module.exports = migrateBankDetails;

