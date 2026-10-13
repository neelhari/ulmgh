const fs = require('fs');
const path = './routes/subscriptions.js';
let content = fs.readFileSync(path, 'utf8');

const postEndpoint = `
// ADMIN — POST /api/subscriptions/admin/plans
router.post('/admin/plans', authMiddleware, adminOnly, async (req, res) => {
  const { name, price, months, is_active, features } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO subscription_plans (name, price, months, is_active, features) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [name, price, months, is_active, features || {}]
    );
    res.json({ plan: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
`;

if (!content.includes("router.post('/admin/plans'")) {
  content = content.replace(
    "// ADMIN — PUT /api/subscriptions/admin/plans/:id",
    postEndpoint + "\n// ADMIN — PUT /api/subscriptions/admin/plans/:id"
  );
  fs.writeFileSync(path, content);
  console.log("Added POST /admin/plans endpoint");
} else {
  console.log("Endpoint already exists");
}
