const fs = require('fs');
const path = require('path');
const p = path.join(__dirname, 'routes', 'general.js');

let content = fs.readFileSync(p, 'utf8');

if (!content.includes("router.get('/vendors'")) {
  const newRoute = `
// GET /api/general/vendors
router.get('/vendors', async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, business_name, store_image FROM vendors WHERE is_active = true AND status = 'approved' ORDER BY created_at DESC"
    );
    res.json({ vendors: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});
`;
  
  // Insert before module.exports = router;
  content = content.replace("module.exports = router;", newRoute + "\nmodule.exports = router;");
  fs.writeFileSync(p, content, 'utf8');
  console.log("Added /vendors route");
} else {
  console.log("/vendors route already exists");
}
