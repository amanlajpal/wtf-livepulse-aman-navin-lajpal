const pool = require('../db/pool');

class AnomalyService {
  async runAnomalyChecks(broadcastCallback = null) {
    const client = await pool.connect();
    try {
      const gymsRes = await client.query('SELECT * FROM gyms WHERE status = $1', ['active']);
      const gyms = gymsRes.rows;

      const now = new Date();
      const currentHourMin = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

      for (const gym of gyms) {
        // -------------------------------------------------------------
        // 1. Zero Check-ins Check
        // -------------------------------------------------------------
        const isOpen = currentHourMin >= gym.opens_at && currentHourMin <= gym.closes_at;
        if (isOpen) {
          const recentCheckinRes = await client.query(
            `SELECT COUNT(*)::INTEGER AS recent_count
             FROM checkins
             WHERE gym_id = $1 AND checked_in >= NOW() - INTERVAL '2 hours'`,
            [gym.id]
          );
          const recentCount = parseInt(recentCheckinRes.rows[0].recent_count, 10);

          if (recentCount === 0) {
            // Trigger zero_checkins anomaly if not already active
            const existingRes = await client.query(
              `SELECT id FROM anomalies WHERE gym_id = $1 AND type = 'zero_checkins' AND resolved = FALSE`,
              [gym.id]
            );
            if (existingRes.rows.length === 0) {
              const msg = `Zero check-ins recorded at ${gym.name} in the last 2 hours during operating hours.`;
              const insertRes = await client.query(
                `INSERT INTO anomalies (gym_id, type, severity, message, resolved, dismissed)
                 VALUES ($1, 'zero_checkins', 'warning', $2, FALSE, FALSE)
                 RETURNING *`,
                [gym.id, msg]
              );
              const anomaly = insertRes.rows[0];
              if (broadcastCallback) {
                broadcastCallback({
                  type: 'ANOMALY_DETECTED',
                  anomaly_id: anomaly.id,
                  gym_id: gym.id,
                  gym_name: gym.name,
                  anomaly_type: 'zero_checkins',
                  severity: 'warning',
                  message: msg
                });
              }
            }
          } else {
            // Auto-resolve zero_checkins if active
            const activeZeroRes = await client.query(
              `SELECT id FROM anomalies WHERE gym_id = $1 AND type = 'zero_checkins' AND resolved = FALSE`,
              [gym.id]
            );
            if (activeZeroRes.rows.length > 0) {
              for (const aRow of activeZeroRes.rows) {
                await client.query(
                  `UPDATE anomalies SET resolved = TRUE, resolved_at = NOW() WHERE id = $1`,
                  [aRow.id]
                );
                if (broadcastCallback) {
                  broadcastCallback({
                    type: 'ANOMALY_RESOLVED',
                    anomaly_id: aRow.id,
                    gym_id: gym.id,
                    resolved_at: new Date().toISOString()
                  });
                }
              }
            }
          }
        }

        // -------------------------------------------------------------
        // 2. Capacity Breach Check
        // -------------------------------------------------------------
        const occRes = await client.query(
          `SELECT COUNT(*)::INTEGER AS count FROM checkins WHERE gym_id = $1 AND checked_out IS NULL`,
          [gym.id]
        );
        const currentOcc = parseInt(occRes.rows[0].count, 10);
        const occPct = (currentOcc / gym.capacity) * 100;

        if (occPct > 90) {
          // Trigger capacity breach
          const existingRes = await client.query(
            `SELECT id FROM anomalies WHERE gym_id = $1 AND type = 'capacity_breach' AND resolved = FALSE`,
            [gym.id]
          );
          if (existingRes.rows.length === 0) {
            const msg = `Capacity breach at ${gym.name}! Current occupancy is ${currentOcc}/${gym.capacity} (${occPct.toFixed(1)}%).`;
            const insertRes = await client.query(
              `INSERT INTO anomalies (gym_id, type, severity, message, resolved, dismissed)
               VALUES ($1, 'capacity_breach', 'critical', $2, FALSE, FALSE)
               RETURNING *`,
              [gym.id, msg]
            );
            const anomaly = insertRes.rows[0];
            if (broadcastCallback) {
              broadcastCallback({
                type: 'ANOMALY_DETECTED',
                anomaly_id: anomaly.id,
                gym_id: gym.id,
                gym_name: gym.name,
                anomaly_type: 'capacity_breach',
                severity: 'critical',
                message: msg
              });
            }
          }
        } else if (occPct < 85) {
          // Auto-resolve capacity breach
          const activeCapRes = await client.query(
            `SELECT id FROM anomalies WHERE gym_id = $1 AND type = 'capacity_breach' AND resolved = FALSE`,
            [gym.id]
          );
          if (activeCapRes.rows.length > 0) {
            for (const aRow of activeCapRes.rows) {
              await client.query(
                `UPDATE anomalies SET resolved = TRUE, resolved_at = NOW() WHERE id = $1`,
                [aRow.id]
              );
              if (broadcastCallback) {
                broadcastCallback({
                  type: 'ANOMALY_RESOLVED',
                  anomaly_id: aRow.id,
                  gym_id: gym.id,
                  resolved_at: new Date().toISOString()
                });
              }
            }
          }
        }

        // -------------------------------------------------------------
        // 3. Revenue Drop Check
        // -------------------------------------------------------------
        const todayRevRes = await client.query(
          `SELECT COALESCE(SUM(amount), 0)::NUMERIC AS total FROM payments WHERE gym_id = $1 AND paid_at >= CURRENT_DATE`,
          [gym.id]
        );
        const todayRev = parseFloat(todayRevRes.rows[0].total);

        // Same day last week (7 days ago midnight to midnight + 24h)
        const lastWeekRevRes = await client.query(
          `SELECT COALESCE(SUM(amount), 0)::NUMERIC AS total 
           FROM payments 
           WHERE gym_id = $1 
             AND paid_at >= (CURRENT_DATE - INTERVAL '7 days') 
             AND paid_at < (CURRENT_DATE - INTERVAL '6 days')`,
          [gym.id]
        );
        const lastWeekRev = parseFloat(lastWeekRevRes.rows[0].total);

        if (lastWeekRev > 0) {
          const ratio = todayRev / lastWeekRev;
          if (ratio <= 0.70) {
            // Drop > 30%
            const existingRes = await client.query(
              `SELECT id FROM anomalies WHERE gym_id = $1 AND type = 'revenue_drop' AND resolved = FALSE`,
              [gym.id]
            );
            if (existingRes.rows.length === 0) {
              const msg = `Revenue drop detected at ${gym.name}. Today: ₹${todayRev.toLocaleString('en-IN')} vs Last Week: ₹${lastWeekRev.toLocaleString('en-IN')}.`;
              const insertRes = await client.query(
                `INSERT INTO anomalies (gym_id, type, severity, message, resolved, dismissed)
                 VALUES ($1, 'revenue_drop', 'warning', $2, FALSE, FALSE)
                 RETURNING *`,
                [gym.id, msg]
              );
              const anomaly = insertRes.rows[0];
              if (broadcastCallback) {
                broadcastCallback({
                  type: 'ANOMALY_DETECTED',
                  anomaly_id: anomaly.id,
                  gym_id: gym.id,
                  gym_name: gym.name,
                  anomaly_type: 'revenue_drop',
                  severity: 'warning',
                  message: msg
                });
              }
            }
          } else if (ratio >= 0.80) {
            // Auto-resolve revenue drop when recovered within 20%
            const activeRevRes = await client.query(
              `SELECT id FROM anomalies WHERE gym_id = $1 AND type = 'revenue_drop' AND resolved = FALSE`,
              [gym.id]
            );
            if (activeRevRes.rows.length > 0) {
              for (const aRow of activeRevRes.rows) {
                await client.query(
                  `UPDATE anomalies SET resolved = TRUE, resolved_at = NOW() WHERE id = $1`,
                  [aRow.id]
                );
                if (broadcastCallback) {
                  broadcastCallback({
                    type: 'ANOMALY_RESOLVED',
                    anomaly_id: aRow.id,
                    gym_id: gym.id,
                    resolved_at: new Date().toISOString()
                  });
                }
              }
            }
          }
        }
      }
    } finally {
      client.release();
    }
  }

  async getActiveAnomalies(gymId = null, severity = null) {
    // Target query performance <0.3ms using idx_anomalies_active (Q6 benchmark)
    let sql = `
      SELECT a.*, g.name AS gym_name
      FROM anomalies a
      JOIN gyms g ON a.gym_id = g.id
      WHERE a.resolved = FALSE AND a.dismissed = FALSE
    `;
    const params = [];

    if (gymId) {
      params.push(gymId);
      sql += ` AND a.gym_id = $${params.length}`;
    }

    if (severity) {
      params.push(severity);
      sql += ` AND a.severity = $${params.length}`;
    }

    sql += ` ORDER BY a.detected_at DESC`;

    const res = await pool.query(sql, params);
    return res.rows;
  }

  async dismissAnomaly(anomalyId) {
    const res = await pool.query('SELECT * FROM anomalies WHERE id = $1', [anomalyId]);
    if (res.rows.length === 0) return { error: 'Not Found', status: 404 };

    const anomaly = res.rows[0];
    if (anomaly.severity === 'critical') {
      return { error: 'Critical anomalies cannot be manually dismissed.', status: 403 };
    }

    const updateRes = await pool.query(
      'UPDATE anomalies SET dismissed = TRUE WHERE id = $1 RETURNING *',
      [anomalyId]
    );

    return { data: updateRes.rows[0], status: 200 };
  }
}

module.exports = new AnomalyService();
