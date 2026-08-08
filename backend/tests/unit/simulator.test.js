const simulatorService = require('../../src/services/simulatorService');
const pool = require('../../src/db/pool');

jest.mock('../../src/db/pool', () => ({
  query: jest.fn()
}));

jest.mock('../../src/services/anomalyService', () => ({
  runAnomalyChecks: jest.fn().mockResolvedValue()
}));

describe('Unit Tests: Simulator Logic', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    simulatorService.stop();
  });

  test('9. simulator start updates status to running and sets speed', () => {
    const res = simulatorService.start(5);
    expect(res.status).toBe('running');
    expect(res.speed).toBe(5);

    simulatorService.stop();
  });

  test('10. simulator stop updates status to paused and clears timer', () => {
    simulatorService.start(1);
    const res = simulatorService.stop();
    expect(res.status).toBe('paused');
  });

  test('11. simulator tick generates check-in event and broadcasts correctly', async () => {
    pool.query
      .mockResolvedValueOnce({
        rows: [{ id: 'gym-1', name: 'WTF Gyms — Lajpat Nagar', capacity: 200 }]
      }) // getRandomGym
      .mockResolvedValueOnce({
        rows: [{ id: 'm-1', name: 'Rahul Sharma' }]
      }) // getMemberToCheckin
      .mockResolvedValueOnce({ rows: [] }) // insert checkin
      .mockResolvedValueOnce({ rows: [] }) // update member last_checkin
      .mockResolvedValueOnce({
        rows: [{ count: '45' }]
      }); // getOccupancy

    // Force checkin branch by mocking Math.random
    const originalRandom = Math.random;
    Math.random = jest.fn().mockReturnValue(0.1); // < 0.6 => checkin

    const broadcasts = [];
    simulatorService.setBroadcastCallback((payload) => broadcasts.push(payload));
    simulatorService.status = 'running';

    await simulatorService.tick();

    Math.random = originalRandom;

    expect(broadcasts).toHaveLength(1);
    expect(broadcasts[0].type).toBe('CHECKIN_EVENT');
    expect(broadcasts[0].member_name).toBe('Rahul Sharma');
    expect(broadcasts[0].current_occupancy).toBe(45);
  });
});
