const express = require('express');
const router = express.Router();
const statsService = require('../services/statsService');

// GET /api/gyms
router.get('/', async (req, res) => {
  try {
    const gyms = await statsService.getAllGyms();
    res.json(gyms);
  } catch (err) {
    console.error('Error fetching gyms:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// GET /api/gyms/:id/live
router.get('/:id/live', async (req, res) => {
  try {
    const snapshot = await statsService.getGymLiveSnapshot(req.params.id);
    if (!snapshot) {
      return res.status(404).json({ error: 'Gym not found' });
    }
    res.json(snapshot);
  } catch (err) {
    console.error('Error fetching live snapshot:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// GET /api/gyms/:id/analytics
router.get('/:id/analytics', async (req, res) => {
  try {
    const dateRange = req.query.dateRange || '30d';
    const analytics = await statsService.getGymAnalytics(req.params.id, dateRange);
    res.json(analytics);
  } catch (err) {
    console.error('Error fetching gym analytics:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;
