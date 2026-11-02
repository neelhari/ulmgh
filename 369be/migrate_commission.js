const pool = require('./db');

async function migrateCommission() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    console.log('Applying vendor commission additive migrations...');

    // 1. Vendors: outstanding debt
    await client.query(`
      ALTER TABLE vendors 
      ADD COLUMN IF NOT EXISTS outstanding_debt NUMERIC(10,2) DEFAULT 0.00;
    `);

    // 2. Vendor transactions: commission breakdown & debt recovery
    await client.query(`
      ALTER TABLE vendor_transactions 
      ADD COLUMN IF NOT EXISTS gross_amount NUMERIC(10,2),
      ADD COLUMN IF NOT EXISTS commission_percent NUMERIC(5,2),
      ADD COLUMN IF NOT EXISTS commission_amount NUMERIC(10,2),
      ADD COLUMN IF NOT EXISTS net_amount NUMERIC(10,2),
      ADD COLUMN IF NOT EXISTS debt_recovered NUMERIC(10,2) DEFAULT 0.00;
    `);

    // 3. Order fulfillments: commission tracking
    await client.query(`
      ALTER TABLE order_fulfillments 
      ADD COLUMN IF NOT EXISTS commission_percent NUMERIC(5,2),
      ADD COLUMN IF NOT EXISTS commission_amount NUMERIC(10,2),
      ADD COLUMN IF NOT EXISTS vendor_net_amount NUMERIC(10,2);
    `);

    // 4. Idempotency unique partial indexes
    await client.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS uq_vendor_tx_order_credit 
      ON vendor_transactions (vendor_id, order_number, type) 
      WHERE type = 'credit' AND order_number IS NOT NULL;
    `);

    await client.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS uq_vendor_tx_order_reversal 
      ON vendor_transactions (vendor_id, order_number, type) 
      WHERE type = 'reversal' AND order_number IS NOT NULL;
    `);

    await client.query('COMMIT');
    console.log('✅ Vendor commission migrations applied successfully.');
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
  migrateCommission().catch(err => {
    console.error(err);
    process.exit(1);
  });
}

module.exports = migrateCommission;

