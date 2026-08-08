const pool = require('../db/pool');

class StatsService {
  async getAllGyms() {
    const query = `
      SELECT 
        g.id,
        g.name,
        g.city,
        g.capacity,
        g.status,
        g.opens_at,
        g.closes_at,
        COALESCE(c.occupancy, 0)::INTEGER AS current_occupancy,
        COALESCE(p.today_revenue, 0)::NUMERIC AS today_revenue
      FROM gyms g
      LEFT JOIN (
        SELECT gym_id, COUNT(*) AS occupancy
        FROM checkins
        WHERE checked_out IS NULL
        GROUP BY gym_id
      ) c ON g.id = c.gym_id
      LEFT JOIN (
        SELECT gym_id, SUM(amount) AS today_revenue
        FROM payments
        WHERE paid_at >= CURRENT_DATE
        GROUP BY gym_id
      ) p ON g.id = p.gym_id
      ORDER BY g.name ASC;
    `;
    const res = await pool.query(query);
    return res.rows;
  }

  async getGymLiveSnapshot(gymId) {
    const gymRes = await pool.query('SELECT * FROM gyms WHERE id = $1', [gymId]);
    if (gymRes.rows.length === 0) return null;
    const gym = gymRes.rows[0];

    // Occupancy query (<0.5ms target using idx_checkins_live_occupancy)
    const occRes = await pool.query(
      'SELECT COUNT(*)::INTEGER AS occupancy FROM checkins WHERE gym_id = $1 AND checked_out IS NULL',
      [gymId]
    );

    // Revenue query (<0.8ms target using idx_payments_gym_date)
    const revRes = await pool.query(
      'SELECT COALESCE(SUM(amount), 0)::NUMERIC AS today_revenue FROM payments WHERE gym_id = $1 AND paid_at >= CURRENT_DATE',
      [gymId]
    );

    // Recent events (last 10 events)
    const eventsRes = await pool.query(
      `
      (
        SELECT 'check-in' AS event_type, m.name AS member_name, c.checked_in AS timestamp
        FROM checkins c
        JOIN members m ON c.member_id = m.id
        WHERE c.gym_id = $1
        ORDER BY c.checked_in DESC LIMIT 5
      )
      UNION ALL
      (
        SELECT 'check-out' AS event_type, m.name AS member_name, c.checked_out AS timestamp
        FROM checkins c
        JOIN members m ON c.member_id = m.id
        WHERE c.gym_id = $1 AND c.checked_out IS NOT NULL
        ORDER BY c.checked_out DESC LIMIT 5
      )
      UNION ALL
      (
        SELECT 'payment' AS event_type, m.name AS member_name, p.paid_at AS timestamp
        FROM payments p
        JOIN members m ON p.member_id = m.id
        WHERE p.gym_id = $1
        ORDER BY p.paid_at DESC LIMIT 5
      )
      ORDER BY timestamp DESC
      LIMIT 10;
      `,
      [gymId]
    );

    // Active anomalies
    const anomaliesRes = await pool.query(
      'SELECT * FROM anomalies WHERE gym_id = $1 AND resolved = FALSE ORDER BY detected_at DESC',
      [gymId]
    );

    return {
      ...gym,
      current_occupancy: parseInt(occRes.rows[0].occupancy, 10),
      today_revenue: parseFloat(revRes.rows[0].today_revenue),
      recent_events: eventsRes.rows,
      active_anomalies: anomaliesRes.rows
    };
  }

  async getGymAnalytics(gymId, dateRange = '30d') {
    let days = 30;
    if (dateRange === '7d') days = 7;
    if (dateRange === '90d') days = 90;

    // 1. Peak Hour Heatmap (7d) using Materialized View (<0.3ms target)
    const heatmapRes = await pool.query(
      'SELECT day_of_week, hour_of_day, checkin_count FROM gym_hourly_stats WHERE gym_id = $1',
      [gymId]
    );

    // 2. Revenue Breakdown by Plan Type
    const revBreakdownRes = await pool.query(
      `SELECT plan_type, SUM(amount)::NUMERIC AS total_revenue
       FROM payments
       WHERE gym_id = $1 AND paid_at >= NOW() - ($2 || ' days')::INTERVAL
       GROUP BY plan_type`,
      [gymId, days]
    );

    // 3. Churn Risk Members (<1ms target using idx_members_churn_risk)
    const churnRes = await pool.query(
      `SELECT id, name, last_checkin_at,
              CASE 
                WHEN last_checkin_at < NOW() - INTERVAL '60 days' THEN 'Critical'
                ELSE 'High'
              END AS risk_level
       FROM members
       WHERE gym_id = $1 AND status = 'active' AND last_checkin_at < NOW() - INTERVAL '45 days'
       ORDER BY last_checkin_at ASC`,
      [gymId]
    );

    // 4. New vs Renewal Ratio (last 30d)
    const ratioRes = await pool.query(
      `SELECT payment_type, COUNT(*)::INTEGER AS count
       FROM payments
       WHERE gym_id = $1 AND paid_at >= NOW() - ($2 || ' days')::INTERVAL
       GROUP BY payment_type`,
      [gymId, days]
    );

    return {
      heatmap: heatmapRes.rows,
      revenue_breakdown: revBreakdownRes.rows,
      churn_risk: churnRes.rows,
      new_vs_renewal: ratioRes.rows
    };
  }

  async getCrossGymRevenue() {
    // Cross-Gym Revenue Comparison (<2ms target using idx_payments_date)
    const query = `
      SELECT 
        g.id AS gym_id,
        g.name AS gym_name,
        COALESCE(SUM(p.amount), 0)::NUMERIC AS total_revenue
      FROM gyms g
      LEFT JOIN payments p ON g.id = p.gym_id AND p.paid_at >= NOW() - INTERVAL '30 days'
      GROUP BY g.id, g.name
      ORDER BY total_revenue DESC;
    `;
    const res = await pool.query(query);
    return res.rows.map((row, index) => ({
      ...row,
      rank: index + 1,
      total_revenue: parseFloat(row.total_revenue)
    }));
  }

  async getRecentActivityFeed(limit = 20) {
    const query = `
      (
        SELECT 'CHECKIN' AS event_type, m.name AS member_name, g.name AS gym_name, c.checked_in AS timestamp, c.gym_id
        FROM checkins c
        JOIN members m ON c.member_id = m.id
        JOIN gyms g ON c.gym_id = g.id
        ORDER BY c.checked_in DESC LIMIT $1
      )
      UNION ALL
      (
        SELECT 'CHECKOUT' AS event_type, m.name AS member_name, g.name AS gym_name, c.checked_out AS timestamp, c.gym_id
        FROM checkins c
        JOIN members m ON c.member_id = m.id
        JOIN gyms g ON c.gym_id = g.id
        WHERE c.checked_out IS NOT NULL
        ORDER BY c.checked_out DESC LIMIT $1
      )
      UNION ALL
      (
        SELECT 'PAYMENT' AS event_type, m.name AS member_name, g.name AS gym_name, p.paid_at AS timestamp, p.gym_id
        FROM payments p
        JOIN members m ON p.member_id = m.id
        JOIN gyms g ON p.gym_id = g.id
        ORDER BY p.paid_at DESC LIMIT $1
      )
      ORDER BY timestamp DESC
      LIMIT $1;
    `;
    const res = await pool.query(query, [limit]);
    return res.rows;
  }
}

module.exports = new StatsService();
