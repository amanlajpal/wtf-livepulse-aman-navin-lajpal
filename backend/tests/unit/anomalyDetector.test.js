const anomalyService = require('../../src/services/anomalyService');
const pool = require('../../src/db/pool');

jest.mock('../../src/db/pool', () => ({
  connect: jest.fn(),
  query: jest.fn()
}));

describe('Unit Tests: Anomaly Detection Logic', () => {
  let mockClient;

  beforeEach(() => {
    jest.clearAllMocks();
    mockClient = {
      query: jest.fn(),
      release: jest.fn()
    };
    pool.connect.mockResolvedValue(mockClient);
  });

  const setupQueryMock = ({
    gyms = [{ id: 'gym-1', name: 'WTF Gyms — Test', status: 'active', opens_at: '00:00', closes_at: '23:59', capacity: 100 }],
    recentCount = 5,
    occupancyCount = 20,
    todayRevenue = 5000,
    lastWeekRevenue = 5000,
    activeAnomalies = []
  }) => {
    mockClient.query.mockImplementation((sql, params) => {
      const queryStr = typeof sql === 'string' ? sql : sql.text || '';

      if (queryStr.includes('FROM gyms WHERE status')) {
        return Promise.resolve({ rows: gyms });
      }
      if (queryStr.includes('checked_in >= NOW() - INTERVAL \'2 hours\'')) {
        return Promise.resolve({ rows: [{ recent_count: String(recentCount) }] });
      }
      if (queryStr.includes('checked_out IS NULL')) {
        return Promise.resolve({ rows: [{ count: String(occupancyCount) }] });
      }
      if (queryStr.includes('paid_at >= CURRENT_DATE')) {
        return Promise.resolve({ rows: [{ total: String(todayRevenue) }] });
      }
      if (queryStr.includes('paid_at < (CURRENT_DATE - INTERVAL \'6 days\')')) {
        return Promise.resolve({ rows: [{ total: String(lastWeekRevenue) }] });
      }
      if (queryStr.includes('SELECT id FROM anomalies WHERE gym_id = $1 AND type =')) {
        let type = params[1];
        if (queryStr.includes("'zero_checkins'")) type = 'zero_checkins';
        if (queryStr.includes("'capacity_breach'")) type = 'capacity_breach';
        if (queryStr.includes("'revenue_drop'")) type = 'revenue_drop';

        const match = activeAnomalies.filter((a) => a.type === type);
        return Promise.resolve({ rows: match });
      }
      if (queryStr.includes('INSERT INTO anomalies')) {
        return Promise.resolve({
          rows: [{
            id: 'anom-inserted-1',
            gym_id: params[0],
            type: params[1],
            severity: params[2],
            message: params[3]
          }]
        });
      }
      if (queryStr.includes('UPDATE anomalies SET resolved = TRUE')) {
        return Promise.resolve({ rows: [] });
      }
      return Promise.resolve({ rows: [] });
    });
  };

  test('1. zero_checkins anomaly fires when active gym during operating hours has no check-ins in last 2h', async () => {
    setupQueryMock({ recentCount: 0 });

    const broadcasts = [];
    await anomalyService.runAnomalyChecks((event) => broadcasts.push(event));

    expect(broadcasts).toHaveLength(1);
    expect(broadcasts[0].type).toBe('ANOMALY_DETECTED');
    expect(broadcasts[0].anomaly_type).toBe('zero_checkins');
    expect(broadcasts[0].severity).toBe('warning');
  });

  test('2. capacity_breach anomaly fires when occupancy > 90%', async () => {
    setupQueryMock({ occupancyCount: 95 }); // 95% > 90%

    const broadcasts = [];
    await anomalyService.runAnomalyChecks((event) => broadcasts.push(event));

    expect(broadcasts).toHaveLength(1);
    expect(broadcasts[0].type).toBe('ANOMALY_DETECTED');
    expect(broadcasts[0].anomaly_type).toBe('capacity_breach');
    expect(broadcasts[0].severity).toBe('critical');
  });

  test('3. revenue_drop anomaly fires when today revenue <= 70% of same day last week', async () => {
    setupQueryMock({ todayRevenue: 2000, lastWeekRevenue: 10000 }); // 20% <= 70%

    const broadcasts = [];
    await anomalyService.runAnomalyChecks((event) => broadcasts.push(event));

    expect(broadcasts).toHaveLength(1);
    expect(broadcasts[0].type).toBe('ANOMALY_DETECTED');
    expect(broadcasts[0].anomaly_type).toBe('revenue_drop');
  });

  test('4. zero_checkins auto-resolves when a check-in occurs', async () => {
    setupQueryMock({
      recentCount: 5,
      activeAnomalies: [{ id: 'anom-z', type: 'zero_checkins' }]
    });

    const broadcasts = [];
    await anomalyService.runAnomalyChecks((event) => broadcasts.push(event));

    expect(broadcasts).toHaveLength(1);
    expect(broadcasts[0].type).toBe('ANOMALY_RESOLVED');
    expect(broadcasts[0].anomaly_id).toBe('anom-z');
  });

  test('5. capacity_breach auto-resolves when occupancy drops below 85%', async () => {
    setupQueryMock({
      occupancyCount: 80, // < 85%
      activeAnomalies: [{ id: 'anom-c', type: 'capacity_breach' }]
    });

    const broadcasts = [];
    await anomalyService.runAnomalyChecks((event) => broadcasts.push(event));

    expect(broadcasts).toHaveLength(1);
    expect(broadcasts[0].type).toBe('ANOMALY_RESOLVED');
    expect(broadcasts[0].anomaly_id).toBe('anom-c');
  });

  test('6. revenue_drop auto-resolves when revenue recovers within 20% of last week', async () => {
    setupQueryMock({
      todayRevenue: 8500,
      lastWeekRevenue: 10000, // 85% >= 80%
      activeAnomalies: [{ id: 'anom-r', type: 'revenue_drop' }]
    });

    const broadcasts = [];
    await anomalyService.runAnomalyChecks((event) => broadcasts.push(event));

    expect(broadcasts).toHaveLength(1);
    expect(broadcasts[0].type).toBe('ANOMALY_RESOLVED');
    expect(broadcasts[0].anomaly_id).toBe('anom-r');
  });

  test('7. critical anomaly cannot be manually dismissed (returns 403)', async () => {
    pool.query.mockResolvedValueOnce({
      rows: [{
        id: 'anom-crit',
        type: 'capacity_breach',
        severity: 'critical',
        dismissed: false
      }]
    });

    const res = await anomalyService.dismissAnomaly('anom-crit');
    expect(res.status).toBe(403);
    expect(res.error).toMatch(/cannot be manually dismissed/i);
  });

  test('8. warning anomaly can be successfully dismissed', async () => {
    pool.query
      .mockResolvedValueOnce({
        rows: [{
          id: 'anom-warn',
          type: 'zero_checkins',
          severity: 'warning',
          dismissed: false
        }]
      })
      .mockResolvedValueOnce({
        rows: [{
          id: 'anom-warn',
          type: 'zero_checkins',
          severity: 'warning',
          dismissed: true
        }]
      });

    const res = await anomalyService.dismissAnomaly('anom-warn');
    expect(res.status).toBe(200);
    expect(res.data.dismissed).toBe(true);
  });
});
