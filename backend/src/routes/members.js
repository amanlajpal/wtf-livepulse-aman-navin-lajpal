const express = require('express');
const router = express.Router();
const pool = require('../db/pool');

// GET /api/members?gym_id=...&status=...
router.get('/', async (req, res) => {
  try {
    const { gym_id, status } = req.query;
    let sql = 'SELECT * FROM members WHERE 1=1';
    const params = [];

    if (gym_id) {
      params.push(gym_id);
      sql += ` AND gym_id = $${params.length}`;
    }

    if (status) {
      params.push(status);
      sql += ` AND status = $${params.length}`;
    }

    sql += ' ORDER BY created_at DESC LIMIT 100';

    const result = await pool.query(sql, params);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching members:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;
