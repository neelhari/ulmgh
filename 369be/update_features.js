require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
async function run() {
  try {
    await pool.query(`
      UPDATE vendor_subscriptions vs 
      SET features = sp.features 
      FROM subscription_plans sp 
      WHERE vs.plan_id = sp.id 
      AND (vs.features IS NULL OR vs.features::text = '{}'::text);
    `);
    console.log('Done');
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}
run();
