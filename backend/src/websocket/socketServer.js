const { WebSocketServer, WebSocket } = require('ws');

let wss = null;

function setupWebSocket(server) {
  wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (ws) => {
    ws.isAlive = true;
    ws.on('pong', () => { ws.isAlive = true; });

    // Send connection greeting
    ws.send(JSON.stringify({ type: 'CONNECTED', message: 'Connected to WTF LivePulse WebSocket Server' }));
  });

  // Heartbeat ping interval
  const interval = setInterval(() => {
    if (!wss) return;
    wss.clients.forEach((ws) => {
      if (ws.isAlive === false) return ws.terminate();
      ws.isAlive = false;
      ws.ping();
    });
  }, 30000);

  if (interval.unref) {
    interval.unref();
  }

  wss.on('close', () => {
    clearInterval(interval);
  });

  return wss;
}

function broadcast(payload) {
  if (!wss) return;
  const message = JSON.stringify(payload);
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

module.exports = {
  setupWebSocket,
  broadcast
};
