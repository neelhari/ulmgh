const pool = require('./db');
async function run() {
  try {
    const res = await pool.query(`SELECT * FROM advertisements LIMIT 1`);
    console.log("Success:", res.rows);
  } catch (err) {
    console.error("Error:", err.message);
  } finally {
    pool.end();
  }
}
run();
