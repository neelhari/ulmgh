const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authMiddleware } = require('./auth');

function adminOnly(req, res, next) {
  if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Admin access only' });
  next();
}

// Public: Get all active FAQs
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, question_en, question_te, answer_en, answer_te, sort_order 
       FROM faqs 
       WHERE status = 'active' 
       ORDER BY sort_order ASC, id ASC`
    );
    res.json({ faqs: result.rows });
  } catch (error) {
    console.error('Error fetching faqs:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Admin: Get all FAQs
router.get('/all', authMiddleware, adminOnly, async (req, res) => {
  try {
    const result = await pool.query(`SELECT * FROM faqs ORDER BY sort_order ASC, id ASC`);
    res.json({ faqs: result.rows });
  } catch (error) {
    console.error('Error fetching all faqs:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Admin: Create FAQ
router.post('/', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { question_en, question_te, answer_en, answer_te, status, sort_order } = req.body;
    const result = await pool.query(
      `INSERT INTO faqs (question_en, question_te, answer_en, answer_te, status, sort_order) 
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [question_en, question_te, answer_en, answer_te, status || 'active', sort_order || 0]
    );
    res.json({ faq: result.rows[0] });
  } catch (error) {
    console.error('Error creating faq:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Admin: Update FAQ
router.put('/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { id } = req.params;
    const { question_en, question_te, answer_en, answer_te, status, sort_order } = req.body;
    const result = await pool.query(
      `UPDATE faqs 
       SET question_en = $1, question_te = $2, answer_en = $3, answer_te = $4, status = $5, sort_order = $6, updated_at = CURRENT_TIMESTAMP
       WHERE id = $7 RETURNING *`,
      [question_en, question_te, answer_en, answer_te, status, sort_order, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'FAQ not found' });
    res.json({ faq: result.rows[0] });
  } catch (error) {
    console.error('Error updating faq:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Admin: Delete FAQ
router.delete('/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`DELETE FROM faqs WHERE id = $1 RETURNING id`, [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'FAQ not found' });
    res.json({ message: 'FAQ deleted successfully' });
  } catch (error) {
    console.error('Error deleting faq:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
