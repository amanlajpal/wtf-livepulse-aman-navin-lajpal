const express = require('express');
const router = express.Router();
const simulatorService = require('../services/simulatorService');

// POST /api/simulator/start
router.post('/start', (req, res) => {
  try {
    const { speed } = req.body || {};
    const result = simulatorService.start(speed || 1);
    res.json(result);
  } catch (err) {
    console.error('Error starting simulator:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// POST /api/simulator/stop
router.post('/stop', (req, res) => {
  try {
    const result = simulatorService.stop();
    res.json(result);
  } catch (err) {
    console.error('Error stopping simulator:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// POST /api/simulator/reset
router.post('/reset', async (req, res) => {
  try {
    const result = await simulatorService.reset();
    res.json(result);
  } catch (err) {
    console.error('Error resetting simulator:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;
