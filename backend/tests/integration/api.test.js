const request = require('supertest');
const { app } = require('../../src/app');
const statsService = require('../../src/services/statsService');
const anomalyService = require('../../src/services/anomalyService');
const simulatorService = require('../../src/services/simulatorService');

jest.mock('../../src/services/statsService');
jest.mock('../../src/services/anomalyService');
jest.mock('../../src/services/simulatorService');
jest.mock('../../src/db/seeds/seed', () => jest.fn().mockResolvedValue());

describe('Integration Tests: API Endpoints (Supertest)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('1. GET /api/gyms returns 200 with list of 10 gyms', async () => {
    const mockGyms = Array.from({ length: 10 }, (_, i) => ({
      id: `gym-${i+1}`,
      name: `WTF Gym ${i+1}`,
      capacity: 200,
      current_occupancy: 45,
      today_revenue: 15000
    }));
    statsService.getAllGyms.mockResolvedValue(mockGyms);

    const res = await request(app).get('/api/gyms');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(10);
    expect(res.body[0]).toHaveProperty('name');
  });

  test('2. GET /api/gyms/:id/live returns 200 with live snapshot', async () => {
    const mockSnapshot = {
      id: 'gym-1',
      name: 'WTF Gyms — Lajpat Nagar',
      current_occupancy: 50,
      today_revenue: 25000,
      recent_events: [],
      active_anomalies: []
    };
    statsService.getGymLiveSnapshot.mockResolvedValue(mockSnapshot);

    const res = await request(app).get('/api/gyms/gym-1/live');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('current_occupancy', 50);
    expect(res.body).toHaveProperty('today_revenue', 25000);
  });

  test('3. GET /api/gyms/:id/live returns 404 for invalid gym id', async () => {
    statsService.getGymLiveSnapshot.mockResolvedValue(null);

    const res = await request(app).get('/api/gyms/invalid-id/live');
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error', 'Gym not found');
  });

  test('4. GET /api/gyms/:id/analytics returns 200 with analytics data', async () => {
    statsService.getGymAnalytics.mockResolvedValue({
      heatmap: [],
      revenue_breakdown: [],
      churn_risk: [],
      new_vs_renewal: []
    });

    const res = await request(app).get('/api/gyms/gym-1/analytics?dateRange=30d');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('heatmap');
    expect(res.body).toHaveProperty('churn_risk');
  });

  test('5. GET /api/analytics/cross-gym returns 200 with cross-gym ranking', async () => {
    statsService.getCrossGymRevenue.mockResolvedValue([
      { gym_id: 'g1', gym_name: 'Bandra', total_revenue: 450000, rank: 1 }
    ]);

    const res = await request(app).get('/api/analytics/cross-gym');
    expect(res.status).toBe(200);
    expect(res.body[0].rank).toBe(1);
  });

  test('6. GET /api/anomalies returns 200 with active anomalies', async () => {
    anomalyService.getActiveAnomalies.mockResolvedValue([]);

    const res = await request(app).get('/api/anomalies');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test('7. PATCH /api/anomalies/:id/dismiss returns 403 when anomaly is critical', async () => {
    anomalyService.dismissAnomaly.mockResolvedValue({
      error: 'Critical anomalies cannot be manually dismissed.',
      status: 403
    });

    const res = await request(app).patch('/api/anomalies/crit-id/dismiss');
    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/cannot be manually dismissed/i);
  });

  test('8. PATCH /api/anomalies/:id/dismiss returns 200 when warning is dismissed', async () => {
    anomalyService.dismissAnomaly.mockResolvedValue({
      data: { id: 'warn-id', dismissed: true },
      status: 200
    });

    const res = await request(app).patch('/api/anomalies/warn-id/dismiss');
    expect(res.status).toBe(200);
    expect(res.body.dismissed).toBe(true);
  });

  test('9. POST /api/simulator/start returns 200 with status running', async () => {
    simulatorService.start.mockReturnValue({ status: 'running', speed: 5 });

    const res = await request(app).post('/api/simulator/start').send({ speed: 5 });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('running');
    expect(res.body.speed).toBe(5);
  });

  test('10. POST /api/simulator/stop returns 200 with status paused', async () => {
    simulatorService.stop.mockReturnValue({ status: 'paused' });

    const res = await request(app).post('/api/simulator/stop');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('paused');
  });

  test('11. POST /api/simulator/reset returns 200 with status reset', async () => {
    simulatorService.reset.mockResolvedValue({ status: 'reset' });

    const res = await request(app).post('/api/simulator/reset');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('reset');
  });

  test('12. GET /health returns 200 with health status', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});
