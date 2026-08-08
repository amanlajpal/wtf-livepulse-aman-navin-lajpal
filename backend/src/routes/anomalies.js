const express = require('express');
const router = express.Router();
const anomalyService = require('../services/anomalyService');

// GET /api/anomalies
router.get('/', async (req, res) => {
  try {
    const { gym_id, severity } = req.query;
    const anomalies = await anomalyService.getActiveAnomalies(gym_id, severity);
    res.json(anomalies);
  } catch (err) {
    console.error('Error fetching anomalies:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// PATCH /api/anomalies/:id/dismiss
router.patch('/:id/dismiss', async (req, res) => {
  try {
    const result = await anomalyService.dismissAnomaly(req.params.id);
    if (result.error) {
      return res.status(result.status).json({ error: result.error });
    }
    res.json(result.data);
  } catch (err) {
    console.error('Error dismissing anomaly:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;
