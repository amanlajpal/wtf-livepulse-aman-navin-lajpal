const anomalyService = require('../services/anomalyService');
const { broadcast } = require('../websocket/socketServer');

let jobInterval = null;

function startAnomalyDetectorJob(intervalMs = 30000) {
  if (jobInterval) clearInterval(jobInterval);

  // Run immediate initial check
  anomalyService.runAnomalyChecks(broadcast).catch(err => {
    console.error('Error running initial anomaly checks:', err);
  });

  jobInterval = setInterval(() => {
    anomalyService.runAnomalyChecks(broadcast).catch(err => {
      console.error('Error running scheduled anomaly checks:', err);
    });
  }, intervalMs);
}

function stopAnomalyDetectorJob() {
  if (jobInterval) {
    clearInterval(jobInterval);
    jobInterval = null;
  }
}

module.exports = {
  startAnomalyDetectorJob,
  stopAnomalyDetectorJob
};
