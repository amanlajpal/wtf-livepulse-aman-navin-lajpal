const simulatorService = require('../services/simulatorService');
const { broadcast } = require('../websocket/socketServer');

function initSimulatorJob() {
  simulatorService.setBroadcastCallback(broadcast);
}

module.exports = {
  initSimulatorJob
};
