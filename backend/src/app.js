const http = require('http');
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { setupWebSocket } = require('./websocket/socketServer');
const { startAnomalyDetectorJob } = require('./jobs/anomalyDetector');
const { initSimulatorJob } = require('./jobs/simulator');
const seed = require('./db/seeds/seed');

const gymsRouter = require('./routes/gyms');
const membersRouter = require('./routes/members');
const analyticsRouter = require('./routes/analytics');
const anomaliesRouter = require('./routes/anomalies');
const simulatorRouter = require('./routes/simulator');

const app = express();
const server = http.createServer(app);

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/gyms', gymsRouter);
app.use('/api/members', membersRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/anomalies', anomaliesRouter);
app.use('/api/simulator', simulatorRouter);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Setup WebSocket
setupWebSocket(server);
initSimulatorJob();

const PORT = process.env.PORT || 3001;

async function startServer() {
  try {
    if (process.env.NODE_ENV !== 'test') {
      console.log('Checking database seed status on startup...');
      await seed();
      startAnomalyDetectorJob(30000);
    }

    if (require.main === module) {
      server.listen(PORT, () => {
        console.log(`WTF LivePulse Backend Server running on port ${PORT}`);
      });
    }
  } catch (err) {
    console.error('Failed to start server:', err);
  }
}

startServer();

module.exports = { app, server };
