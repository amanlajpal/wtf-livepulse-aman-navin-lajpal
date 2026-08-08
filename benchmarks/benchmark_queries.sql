-- EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT) for all 6 WTF LivePulse queries

-- Q1: Live Occupancy — Single Gym (Target < 0.5ms)
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT COUNT(*) FROM checkins WHERE gym_id = (SELECT id FROM gyms LIMIT 1) AND checked_out IS NULL;

-- Q2: Today's Revenue — Single Gym (Target < 0.8ms)
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT SUM(amount) FROM payments WHERE gym_id = (SELECT id FROM gyms LIMIT 1) AND paid_at >= CURRENT_DATE;

-- Q3: Churn Risk Members (Target < 1ms)
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT id, name, last_checkin_at FROM members WHERE status='active' AND last_checkin_at < NOW() - INTERVAL '45 days';

-- Q4: Peak Hour Heatmap (7d) (Target < 0.3ms)
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT * FROM gym_hourly_stats WHERE gym_id = (SELECT id FROM gyms LIMIT 1);

-- Q5: Cross-Gym Revenue Comparison (Target < 2ms)
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT gym_id, SUM(amount) FROM payments WHERE paid_at >= NOW() - INTERVAL '30 days' GROUP BY gym_id ORDER BY SUM(amount) DESC;

-- Q6: Active Anomalies — All Gyms (Target < 0.3ms)
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT * FROM anomalies WHERE resolved = FALSE ORDER BY detected_at DESC;
