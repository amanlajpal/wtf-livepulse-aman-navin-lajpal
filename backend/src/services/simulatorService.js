const pool = require('../db/pool');
const anomalyService = require('./anomalyService');

class SimulatorService {
  constructor() {
    this.status = 'paused'; // 'running' | 'paused'
    this.speed = 1; // 1 | 5 | 10
    this.timer = null;
    this.broadcastCallback = null;
  }

  setBroadcastCallback(cb) {
    this.broadcastCallback = cb;
  }

  start(speed = 1) {
    this.speed = parseInt(speed, 10) || 1;
    this.status = 'running';

    if (this.timer) {
      clearInterval(this.timer);
    }

    const intervalMs = Math.max(100, Math.floor(2000 / this.speed));
    this.timer = setInterval(() => {
      this.tick();
    }, intervalMs);

    return { status: this.status, speed: this.speed };
  }

  stop() {
    this.status = 'paused';
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    return { status: this.status };
  }

  async reset() {
    this.stop();
    // Close all open check-ins to baseline state
    await pool.query('UPDATE checkins SET checked_out = NOW() WHERE checked_out IS NULL');
    return { status: 'reset' };
  }

  async tick() {
    if (this.status !== 'running') return;

    try {
      // 1. Pick a random gym
      const gymRes = await pool.query('SELECT * FROM gyms WHERE status = $1 ORDER BY RANDOM() LIMIT 1', ['active']);
      if (gymRes.rows.length === 0) return;
      const gym = gymRes.rows[0];

      // 2. Decide action: Check-in, Check-out, or Payment
      const rand = Math.random();

      if (rand < 0.60) {
        // CHECK-IN EVENT
        const memberRes = await pool.query(
          `SELECT m.id, m.name
           FROM members m
           WHERE m.gym_id = $1 AND m.status = 'active'
             AND m.id NOT IN (SELECT member_id FROM checkins WHERE checked_out IS NULL)
           ORDER BY RANDOM() LIMIT 1`,
          [gym.id]
        );

        if (memberRes.rows.length > 0) {
          const member = memberRes.rows[0];
          await pool.query(
            'INSERT INTO checkins (member_id, gym_id, checked_in) VALUES ($1, $2, NOW())',
            [member.id, gym.id]
          );

          // Update member last_checkin_at
          await pool.query('UPDATE members SET last_checkin_at = NOW() WHERE id = $1', [member.id]);

          // Get updated occupancy
          const occRes = await pool.query(
            'SELECT COUNT(*)::INTEGER AS count FROM checkins WHERE gym_id = $1 AND checked_out IS NULL',
            [gym.id]
          );
          const currentOcc = parseInt(occRes.rows[0].count, 10);
          const capacityPct = Math.round((currentOcc / gym.capacity) * 100);

          if (this.broadcastCallback) {
            this.broadcastCallback({
              type: 'CHECKIN_EVENT',
              gym_id: gym.id,
              gym_name: gym.name,
              member_name: member.name,
              timestamp: new Date().toISOString(),
              current_occupancy: currentOcc,
              capacity_pct: capacityPct
            });
          }
        }
      } else if (rand < 0.90) {
        // CHECK-OUT EVENT
        const openCheckinRes = await pool.query(
          `SELECT c.id, c.member_id, m.name AS member_name
           FROM checkins c
           JOIN members m ON c.member_id = m.id
           WHERE c.gym_id = $1 AND c.checked_out IS NULL
           ORDER BY c.checked_in ASC LIMIT 1`,
          [gym.id]
        );

        if (openCheckinRes.rows.length > 0) {
          const openCheckin = openCheckinRes.rows[0];
          await pool.query('UPDATE checkins SET checked_out = NOW() WHERE id = $1', [openCheckin.id]);

          // Get updated occupancy
          const occRes = await pool.query(
            'SELECT COUNT(*)::INTEGER AS count FROM checkins WHERE gym_id = $1 AND checked_out IS NULL',
            [gym.id]
          );
          const currentOcc = parseInt(occRes.rows[0].count, 10);
          const capacityPct = Math.round((currentOcc / gym.capacity) * 100);

          if (this.broadcastCallback) {
            this.broadcastCallback({
              type: 'CHECKOUT_EVENT',
              gym_id: gym.id,
              gym_name: gym.name,
              member_name: openCheckin.member_name,
              timestamp: new Date().toISOString(),
              current_occupancy: currentOcc,
              capacity_pct: capacityPct
            });
          }
        }
      } else {
        // PAYMENT EVENT
        const memberRes = await pool.query(
          'SELECT id, name, plan_type FROM members WHERE gym_id = $1 ORDER BY RANDOM() LIMIT 1',
          [gym.id]
        );

        if (memberRes.rows.length > 0) {
          const member = memberRes.rows[0];
          const amounts = { monthly: 1499, quarterly: 3999, annual: 11999 };
          const amount = amounts[member.plan_type] || 1499;

          await pool.query(
            `INSERT INTO payments (member_id, gym_id, amount, plan_type, payment_type, paid_at, notes)
             VALUES ($1, $2, $3, $4, 'renewal', NOW(), 'Simulated live payment')`,
            [member.id, gym.id, amount, member.plan_type]
          );

          // Get today's total revenue for gym
          const revRes = await pool.query(
            'SELECT COALESCE(SUM(amount), 0)::NUMERIC AS total FROM payments WHERE gym_id = $1 AND paid_at >= CURRENT_DATE',
            [gym.id]
          );
          const todayTotal = parseFloat(revRes.rows[0].total);

          if (this.broadcastCallback) {
            this.broadcastCallback({
              type: 'PAYMENT_EVENT',
              gym_id: gym.id,
              gym_name: gym.name,
              amount,
              plan_type: member.plan_type,
              member_name: member.name,
              today_total: todayTotal
            });
          }
        }
      }

      // Check anomalies after tick
      await anomalyService.runAnomalyChecks(this.broadcastCallback);
    } catch (err) {
      console.error('Error in simulator tick:', err);
    }
  }
}

module.exports = new SimulatorService();
