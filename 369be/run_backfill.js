const pool = require('./db');
const { backfillHistoricalOrders } = require('./services/fulfillmentService');

async function run() {
  console.log('🔄 Backfilling historical orders with fulfillment records...');
  try {
    const count = await backfillHistoricalOrders(pool);
    console.log(`🎉 Backfill completed. ${count} orders processed.`);
  } catch (err) {
    console.error('❌ Backfill error:', err);
  } finally {
    await pool.end();
  }
}

run();
