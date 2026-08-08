const statsService = require('../../src/services/statsService');
const pool = require('../../src/db/pool');

jest.mock('../../src/db/pool', () => ({
  query: jest.fn()
}));

describe('Unit Tests: Stats Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('1. getAllGyms returns formatted list of gyms', async () => {
    pool.query.mockResolvedValueOnce({
      rows: [
        { id: 'g1', name: 'WTF Gyms — Lajpat Nagar', current_occupancy: 45, today_revenue: 15000 }
      ]
    });

    const res = await statsService.getAllGyms();
    expect(res).toHaveLength(1);
    expect(res[0].name).toBe('WTF Gyms — Lajpat Nagar');
  });

  test('2. getGymLiveSnapshot returns complete live snapshot', async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [{ id: 'g1', name: 'WTF Gyms — Lajpat Nagar', capacity: 220 }] }) // gym
      .mockResolvedValueOnce({ rows: [{ occupancy: '50' }] }) // occupancy
      .mockResolvedValueOnce({ rows: [{ today_revenue: '25000' }] }) // revenue
      .mockResolvedValueOnce({ rows: [{ event_type: 'check-in', member_name: 'Priya Mehta', timestamp: '2026-08-08T10:00:00Z' }] }) // recent events
      .mockResolvedValueOnce({ rows: [] }); // anomalies

    const snapshot = await statsService.getGymLiveSnapshot('g1');
    expect(snapshot.id).toBe('g1');
    expect(snapshot.current_occupancy).toBe(50);
    expect(snapshot.today_revenue).toBe(25000);
    expect(snapshot.recent_events).toHaveLength(1);
  });

  test('3. getGymAnalytics returns heatmap, breakdown, churn risk, and ratio', async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [{ day_of_week: 1, hour_of_day: 8, checkin_count: '15' }] }) // heatmap
      .mockResolvedValueOnce({ rows: [{ plan_type: 'monthly', total_revenue: '45000' }] }) // breakdown
      .mockResolvedValueOnce({ rows: [{ id: 'm1', name: 'Arjun Patel', last_checkin_at: '2026-06-01', risk_level: 'Critical' }] }) // churn risk
      .mockResolvedValueOnce({ rows: [{ payment_type: 'new', count: '10' }] }); // ratio

    const analytics = await statsService.getGymAnalytics('g1', '30d');
    expect(analytics.heatmap).toHaveLength(1);
    expect(analytics.revenue_breakdown).toHaveLength(1);
    expect(analytics.churn_risk).toHaveLength(1);
    expect(analytics.new_vs_renewal).toHaveLength(1);
  });

  test('4. getCrossGymRevenue returns ranked cross gym comparison', async () => {
    pool.query.mockResolvedValueOnce({
      rows: [
        { gym_id: 'g3', gym_name: 'WTF Gyms — Bandra West', total_revenue: '450000' },
        { gym_id: 'g4', gym_name: 'WTF Gyms — Powai', total_revenue: '350000' }
      ]
    });

    const res = await statsService.getCrossGymRevenue();
    expect(res).toHaveLength(2);
    expect(res[0].rank).toBe(1);
    expect(res[0].total_revenue).toBe(450000);
    expect(res[1].rank).toBe(2);
  });

  test('5. getRecentActivityFeed returns recent activity items', async () => {
    pool.query.mockResolvedValueOnce({
      rows: [
        { event_type: 'CHECKIN', member_name: 'Ankit Verma', gym_name: 'Bandra West', timestamp: '2026-08-08T10:00:00Z', gym_id: 'g3' }
      ]
    });

    const feed = await statsService.getRecentActivityFeed(20);
    expect(feed).toHaveLength(1);
    expect(feed[0].member_name).toBe('Ankit Verma');
  });
});
