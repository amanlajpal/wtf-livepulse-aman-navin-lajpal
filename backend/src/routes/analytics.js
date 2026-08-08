const express = require('express');
const router = express.Router();
const statsService = require('../services/statsService');

// GET /api/analytics/cross-gym
router.get('/cross-gym', async (req, res) => {
  try {
    const crossGym = await statsService.getCrossGymRevenue();
    res.json(crossGym);
  } catch (err) {
    console.error('Error fetching cross gym analytics:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// GET /api/analytics/activity-feed
router.get('/activity-feed', async (req, res) => {
  try {
    const feed = await statsService.getRecentActivityFeed(20);
    res.json(feed);
  } catch (err) {
    console.error('Error fetching activity feed:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;
