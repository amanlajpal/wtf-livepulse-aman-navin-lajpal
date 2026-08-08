const pool = require('../pool');

const GYMS_DATA = [
  { name: 'WTF Gyms — Lajpat Nagar', city: 'New Delhi', capacity: 220, opens_at: '05:30', closes_at: '22:30', status: 'active' },
  { name: 'WTF Gyms — Connaught Place', city: 'New Delhi', capacity: 180, opens_at: '06:00', closes_at: '22:00', status: 'active' },
  { name: 'WTF Gyms — Bandra West', city: 'Mumbai', capacity: 300, opens_at: '05:00', closes_at: '23:00', status: 'active' },
  { name: 'WTF Gyms — Powai', city: 'Mumbai', capacity: 250, opens_at: '05:30', closes_at: '22:30', status: 'active' },
  { name: 'WTF Gyms — Indiranagar', city: 'Bengaluru', capacity: 200, opens_at: '05:30', closes_at: '22:00', status: 'active' },
  { name: 'WTF Gyms — Koramangala', city: 'Bengaluru', capacity: 180, opens_at: '06:00', closes_at: '22:00', status: 'active' },
  { name: 'WTF Gyms — Banjara Hills', city: 'Hyderabad', capacity: 160, opens_at: '06:00', closes_at: '22:00', status: 'active' },
  { name: 'WTF Gyms — Sector 18 Noida', city: 'Noida', capacity: 140, opens_at: '06:00', closes_at: '21:30', status: 'active' },
  { name: 'WTF Gyms — Salt Lake', city: 'Kolkata', capacity: 120, opens_at: '06:00', closes_at: '21:00', status: 'active' },
  { name: 'WTF Gyms — Velachery', city: 'Chennai', capacity: 110, opens_at: '06:00', closes_at: '21:00', status: 'active' }
];

const MEMBER_SPECS = [
  { index: 0, key: 'lajpat', count: 650, monthlyPct: 0.50, quarterlyPct: 0.30, annualPct: 0.20, activePct: 0.88 },
  { index: 1, key: 'cp', count: 550, monthlyPct: 0.40, quarterlyPct: 0.40, annualPct: 0.20, activePct: 0.85 },
  { index: 2, key: 'bandra', count: 750, monthlyPct: 0.40, quarterlyPct: 0.40, annualPct: 0.20, activePct: 0.90 },
  { index: 3, key: 'powai', count: 600, monthlyPct: 0.40, quarterlyPct: 0.40, annualPct: 0.20, activePct: 0.87 },
  { index: 4, key: 'indiranagar', count: 550, monthlyPct: 0.40, quarterlyPct: 0.40, annualPct: 0.20, activePct: 0.89 },
  { index: 5, key: 'koramangala', count: 500, monthlyPct: 0.40, quarterlyPct: 0.40, annualPct: 0.20, activePct: 0.86 },
  { index: 6, key: 'banjara', count: 450, monthlyPct: 0.50, quarterlyPct: 0.30, annualPct: 0.20, activePct: 0.84 },
  { index: 7, key: 'noida', count: 400, monthlyPct: 0.60, quarterlyPct: 0.25, annualPct: 0.15, activePct: 0.82 },
  { index: 8, key: 'saltlake', count: 300, monthlyPct: 0.60, quarterlyPct: 0.30, annualPct: 0.10, activePct: 0.80 },
  { index: 9, key: 'velachery', count: 250, monthlyPct: 0.60, quarterlyPct: 0.30, annualPct: 0.10, activePct: 0.78 }
];

const FIRST_NAMES = [
  'Aarav', 'Ananya', 'Rohan', 'Priya', 'Aditya', 'Sneha', 'Vikram', 'Neha', 'Rahul', 'Kavya',
  'Arjun', 'Isha', 'Dev', 'Pooja', 'Karan', 'Riya', 'Siddharth', 'Divya', 'Varun', 'Meera',
  'Amit', 'Shreya', 'Rajesh', 'Anushka', 'Sanjay', 'Tanvi', 'Manish', 'Simran', 'Alok', 'Tarun'
];

const LAST_NAMES = [
  'Sharma', 'Verma', 'Gupta', 'Mehta', 'Singh', 'Kumar', 'Patel', 'Joshi', 'Shah', 'Nair',
  'Rao', 'Reddy', 'Chowdhury', 'Banerjee', 'Iyer', 'Deshmukh', 'Kulkarni', 'Bhat', 'Agarwal', 'Saxena'
];

const PLAN_PRICES = {
  monthly: 1499,
  quarterly: 3999,
  annual: 11999
};

const PLAN_DAYS = {
  monthly: 30,
  quarterly: 90,
  annual: 365
};

const HOURLY_MULTIPLIERS = [
  0.00, 0.00, 0.00, 0.00, 0.00, 0.00, // 0-5
  0.60, // 6
  1.00, 1.00, 1.00, // 7-9
  0.40, 0.40, // 10-11
  0.30, 0.30, // 12-13
  0.20, 0.20, 0.20, // 14-16
  0.90, 0.90, 0.90, 0.90, // 17-20
  0.35, 0.35, // 21-22
  0.00 // 23
];

const DOW_MULTIPLIERS = [0.45, 1.00, 0.95, 0.90, 0.95, 0.85, 0.70]; // 0=Sun..6=Sat

function getRandomElement(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomPhone() {
  const startDigit = getRandomElement(['9', '8', '7']);
  let rest = '';
  for (let i = 0; i < 9; i++) {
    rest += Math.floor(Math.random() * 10);
  }
  return startDigit + rest;
}

async function seed() {
  console.log('Starting WTF LivePulse Database Seeding...');
  const startMs = Date.now();

  const client = await pool.connect();

  try {
    // 1. Check if already seeded
    const gymCheck = await client.query('SELECT COUNT(*) FROM gyms');
    if (parseInt(gymCheck.rows[0].count, 10) >= 10) {
      console.log('Database is already seeded with 10 gyms. Skipping seed.');
      return;
    }

    await client.query('BEGIN');

    // 2. Insert Gyms
    console.log('Seeding gyms...');
    const gymIds = [];
    for (const g of GYMS_DATA) {
      const res = await client.query(
        `INSERT INTO gyms (name, city, capacity, opens_at, closes_at, status)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id, name`,
        [g.name, g.city, g.capacity, g.opens_at, g.closes_at, g.status]
      );
      gymIds.push(res.rows[0].id);
    }
    console.log('Seeding gyms... done');

    // 3. Insert 5000 Members
    console.log('Seeding 5000 members...');
    const membersList = [];
    const now = new Date();

    let totalChurnHighCount = 0;
    let totalChurnCriticalCount = 0;

    for (let gIdx = 0; gIdx < 10; gIdx++) {
      const gymId = gymIds[gIdx];
      const spec = MEMBER_SPECS[gIdx];

      const monthlyCount = Math.round(spec.count * spec.monthlyPct);
      const quarterlyCount = Math.round(spec.count * spec.quarterlyPct);
      const annualCount = spec.count - monthlyCount - quarterlyCount;

      const activeTarget = Math.round(spec.count * spec.activePct);
      const inactiveTarget = Math.round(spec.count * 0.08);

      for (let mIdx = 0; mIdx < spec.count; mIdx++) {
        let planType = 'monthly';
        if (mIdx >= monthlyCount && mIdx < monthlyCount + quarterlyCount) {
          planType = 'quarterly';
        } else if (mIdx >= monthlyCount + quarterlyCount) {
          planType = 'annual';
        }

        const isRenewal = Math.random() < 0.20;
        const memberType = isRenewal ? 'renewal' : 'new';

        let status = 'active';
        if (mIdx >= activeTarget && mIdx < activeTarget + inactiveTarget) {
          status = 'inactive';
        } else if (mIdx >= activeTarget + inactiveTarget) {
          status = 'frozen';
        }

        const fname = getRandomElement(FIRST_NAMES);
        const lname = getRandomElement(LAST_NAMES);
        const name = `${fname} ${lname}`;
        const email = `${fname.toLowerCase()}.${lname.toLowerCase()}${gIdx * 1000 + mIdx}@gmail.com`;
        const phone = getRandomPhone();

        // Joined at calculation
        let joinDaysAgo = Math.floor(Math.random() * 90); // 0..89 days ago
        if (isRenewal || status === 'inactive') {
          joinDaysAgo = 91 + Math.floor(Math.random() * 89); // 91..179 days ago
        }
        const joinedAt = new Date(now.getTime() - joinDaysAgo * 86400000);
        const planExpiresAt = new Date(joinedAt.getTime() + PLAN_DAYS[planType] * 86400000);

        membersList.push({
          gymId,
          gymIdx: gIdx,
          name,
          email,
          phone,
          planType,
          memberType,
          status,
          joinedAt,
          planExpiresAt,
          joinDaysAgo
        });
      }
    }

    // Insert members in batches of 500
    const insertedMembers = [];
    for (let i = 0; i < membersList.length; i += 500) {
      const chunk = membersList.slice(i, i + 500);
      const valueTuples = [];
      const params = [];
      let pIdx = 1;

      for (const m of chunk) {
        valueTuples.push(`($${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++})`);
        params.push(m.gymId, m.name, m.email, m.phone, m.planType, m.memberType, m.status, m.joinedAt.toISOString(), m.planExpiresAt.toISOString());
      }

      const res = await client.query(
        `INSERT INTO members (gym_id, name, email, phone, plan_type, member_type, status, joined_at, plan_expires_at)
         VALUES ${valueTuples.join(', ')}
         RETURNING id, gym_id, name, plan_type, member_type, status, joined_at`,
        params
      );
      for (let k = 0; k < res.rows.length; k++) {
        insertedMembers.push({
          ...res.rows[k],
          gymIdx: chunk[k].gymIdx,
          joinDaysAgo: chunk[k].joinDaysAgo
        });
      }
    }
    console.log('Seeding 5000 members... done');

    // 4. Seed Payments
    console.log('Seeding payment history...');
    const paymentValues = [];
    const paymentParams = [];
    let payParamIdx = 1;

    for (const m of insertedMembers) {
      const amount = PLAN_PRICES[m.plan_type];
      const firstPaidAt = new Date(new Date(m.joined_at).getTime() + (Math.random() * 10 - 5) * 60000);

      // Payment 1
      paymentValues.push(`($${payParamIdx++}, $${payParamIdx++}, $${payParamIdx++}, $${payParamIdx++}, $${payParamIdx++}, $${payParamIdx++}, $${payParamIdx++})`);
      paymentParams.push(m.id, m.gym_id, amount, m.plan_type, m.member_type === 'renewal' ? 'new' : m.member_type, firstPaidAt.toISOString(), 'Initial membership payment');

      // Payment 2 for renewal members
      if (m.member_type === 'renewal') {
        const secondPaidAt = new Date(firstPaidAt.getTime() + PLAN_DAYS[m.plan_type] * 86400000);
        if (secondPaidAt <= now) {
          paymentValues.push(`($${payParamIdx++}, $${payParamIdx++}, $${payParamIdx++}, $${payParamIdx++}, $${payParamIdx++}, $${payParamIdx++}, $${payParamIdx++})`);
          paymentParams.push(m.id, m.gym_id, amount, m.plan_type, 'renewal', secondPaidAt.toISOString(), 'Renewal membership payment');
        }
      }
    }

    // SCENARIO 6.3 SETUP FOR SALT LAKE (Gym index 8):
    // Same day last week revenue >= 15,000 (8-10 payments of 1499/3999)
    // Today revenue <= 3,000 (0-2 payments)
    const saltLakeGymId = gymIds[8];
    const saltLakeMembers = insertedMembers.filter(m => m.gym_id === saltLakeGymId);
    const lastWeekSameDay = new Date(now.getTime() - 7 * 86400000);
    lastWeekSameDay.setHours(10, 0, 0, 0);

    for (let i = 0; i < 9; i++) {
      const m = saltLakeMembers[i % saltLakeMembers.length];
      const pTime = new Date(lastWeekSameDay.getTime() + i * 1800000); // spread across hours
      paymentValues.push(`($${payParamIdx++}, $${payParamIdx++}, $${payParamIdx++}, $${payParamIdx++}, $${payParamIdx++}, $${payParamIdx++}, $${payParamIdx++})`);
      paymentParams.push(m.id, saltLakeGymId, 1499, 'monthly', 'new', pTime.toISOString(), 'Seeded last-week baseline payment for Salt Lake');
    }

    // Insert payments in chunks of 500
    for (let i = 0; i < paymentValues.length; i += 500) {
      const valChunk = paymentValues.slice(i, i + 500);
      const paramCountPerTuple = 7;
      const flatParams = paymentParams.slice(i * paramCountPerTuple, (i + valChunk.length) * paramCountPerTuple);
      
      // Re-index param placeholders ($1, $2...)
      const reindexedTuples = valChunk.map((_, tIdx) => {
        const base = tIdx * paramCountPerTuple;
        return `($${base+1}, $${base+2}, $${base+3}, $${base+4}, $${base+5}, $${base+6}, $${base+7})`;
      });

      await client.query(
        `INSERT INTO payments (member_id, gym_id, amount, plan_type, payment_type, paid_at, notes)
         VALUES ${reindexedTuples.join(', ')}`,
        flatParams
      );
    }
    console.log('Seeding payment history... done');

    // 5. Seed Check-ins History (~270,000 rows over 90 days)
    console.log('Seeding 90 days of check-ins...');
    const activeMembers = insertedMembers.filter(m => m.status === 'active');
    
    // Group active members by gym
    const membersByGym = {};
    for (let i = 0; i < 10; i++) membersByGym[i] = [];
    for (const m of activeMembers) {
      membersByGym[m.gymIdx].push(m);
    }

    // We deliberately assign churn risk timestamps to a subset of active members (Section 3.3):
    // Min 150 active members with last_checkin_at 45-60 days ago
    // Min 80 active members with last_checkin_at > 60 days ago
    const churnHighMembers = new Set();
    const churnCriticalMembers = new Set();

    let hCount = 0;
    let cCount = 0;
    for (let gIdx = 0; gIdx < 10; gIdx++) {
      const gMembers = membersByGym[gIdx];
      for (const m of gMembers) {
        if (hCount < 160 && !churnHighMembers.has(m.id)) {
          churnHighMembers.add(m.id);
          hCount++;
        } else if (cCount < 90 && !churnHighMembers.has(m.id) && !churnCriticalMembers.has(m.id)) {
          churnCriticalMembers.add(m.id);
          cCount++;
        }
      }
    }

    // Generate daily checkin events
    const checkinTuples = [];
    const checkinParams = [];
    let checkinParamIdx = 1;

    // Helper to flush checkins
    const flushCheckins = async () => {
      if (checkinTuples.length === 0) return;
      await client.query(
        `INSERT INTO checkins (member_id, gym_id, checked_in, checked_out)
         VALUES ${checkinTuples.join(', ')}`,
        checkinParams
      );
      checkinTuples.length = 0;
      checkinParams.length = 0;
      checkinParamIdx = 1;
    };

    const numDays = 90;

    for (let d = numDays; d >= 0; d--) {
      const dayDate = new Date(now.getTime() - d * 86400000);
      const dow = dayDate.getDay();
      const dowMult = DOW_MULTIPLIERS[dow];

      for (let gIdx = 0; gIdx < 10; gIdx++) {
        const gymId = gymIds[gIdx];
        const gMembers = membersByGym[gIdx];
        if (!gMembers || gMembers.length === 0) continue;

        // Skip historical generation for today's open checkin special setups
        if (d === 0) continue;

        // Calculate expected checkins for this gym on this day
        // ~300 checkins/day * dowMult
        const targetCheckinsForDay = Math.round(300 * dowMult * (gMembers.length / 500));

        for (let hour = 5; hour <= 22; hour++) {
          const hMult = HOURLY_MULTIPLIERS[hour];
          if (hMult === 0) continue;

          const countForHour = Math.round((targetCheckinsForDay / 16) * hMult);

          for (let k = 0; k < countForHour; k++) {
            const member = getRandomElement(gMembers);

            // Skip generating recent checkins for churn risk members
            if (d < 45 && churnHighMembers.has(member.id)) continue;
            if (d < 60 && churnCriticalMembers.has(member.id)) continue;

            // Generate specific checkin time within the hour
            const minute = Math.floor(Math.random() * 60);
            const checkinTime = new Date(dayDate.getFullYear(), dayDate.getMonth(), dayDate.getDate(), hour, minute, Math.floor(Math.random() * 60));

            if (checkinTime > now) continue;

            const durationMins = 45 + Math.floor(Math.random() * 45); // 45..89 mins
            const checkoutTime = new Date(checkinTime.getTime() + durationMins * 60000);

            checkinTuples.push(`($${checkinParamIdx++}, $${checkinParamIdx++}, $${checkinParamIdx++}, $${checkinParamIdx++})`);
            checkinParams.push(member.id, gymId, checkinTime.toISOString(), checkoutTime.toISOString());

            if (checkinTuples.length >= 800) {
              await flushCheckins();
            }
          }
        }
      }
    }
    await flushCheckins();

    // 6. Seed Specific Churn Risk Last Checkins
    for (const m of activeMembers) {
      if (churnHighMembers.has(m.id)) {
        const daysAgo = 46 + Math.floor(Math.random() * 12); // 46..57 days ago
        const cTime = new Date(now.getTime() - daysAgo * 86400000);
        const coTime = new Date(cTime.getTime() + 60 * 60000);
        checkinTuples.push(`($${checkinParamIdx++}, $${checkinParamIdx++}, $${checkinParamIdx++}, $${checkinParamIdx++})`);
        checkinParams.push(m.id, m.gym_id, cTime.toISOString(), coTime.toISOString());
      } else if (churnCriticalMembers.has(m.id)) {
        const daysAgo = 62 + Math.floor(Math.random() * 20); // 62..81 days ago
        const cTime = new Date(now.getTime() - daysAgo * 86400000);
        const coTime = new Date(cTime.getTime() + 60 * 60000);
        checkinTuples.push(`($${checkinParamIdx++}, $${checkinParamIdx++}, $${checkinParamIdx++}, $${checkinParamIdx++})`);
        checkinParams.push(m.id, m.gym_id, cTime.toISOString(), coTime.toISOString());
      }
    }
    await flushCheckins();

    // 7. Seed Open Check-ins (Currently In Gym Population - Section 4.4 & Section 6)
    console.log('Seeding seed-time open check-ins and anomaly test scenarios...');

    for (let gIdx = 0; gIdx < 10; gIdx++) {
      const gymId = gymIds[gIdx];
      const gMembers = membersByGym[gIdx].filter(m => !churnHighMembers.has(m.id) && !churnCriticalMembers.has(m.id));

      let openCount = 15; // default medium

      if (gIdx === 2) {
        // BANDRA WEST (Gym 3, index 2): SCENARIO 6.2 CAPACITY BREACH ALERT (275 to 295 open check-ins)
        openCount = 280;
      } else if (gIdx === 9) {
        // VELACHERY (Gym 10, index 9): SCENARIO 6.1 ZERO CHECK-IN ALERT (0 open check-ins, last checkin > 2h 10m ago)
        openCount = 0;
        // Insert a closed check-in 2 hours 15 minutes ago
        const vMember = gMembers[0];
        const vCheckin = new Date(now.getTime() - (2 * 3600000 + 15 * 60000));
        const vCheckout = new Date(vCheckin.getTime() + 45 * 60000);
        checkinTuples.push(`($${checkinParamIdx++}, $${checkinParamIdx++}, $${checkinParamIdx++}, $${checkinParamIdx++})`);
        checkinParams.push(vMember.id, gymId, vCheckin.toISOString(), vCheckout.toISOString());
      } else if (gIdx === 3) {
        // Powai (Large): 30
        openCount = 30;
      } else if (gIdx === 0 || gIdx === 1 || gIdx === 4 || gIdx === 5 || gIdx === 6) {
        // Medium: 20
        openCount = 20;
      } else {
        // Small (Noida, Salt Lake): 10
        openCount = 10;
      }

      for (let k = 0; k < openCount; k++) {
        const member = gMembers[k % gMembers.length];
        const minutesAgo = 10 + Math.floor(Math.random() * 60); // checked in 10..70m ago
        const cTime = new Date(now.getTime() - minutesAgo * 60000);

        checkinTuples.push(`($${checkinParamIdx++}, $${checkinParamIdx++}, $${checkinParamIdx++}, NULL)`);
        checkinParams.push(member.id, gymId, cTime.toISOString());
      }
    }
    await flushCheckins();
    console.log('Seeding 90 days of check-ins... done');

    // 8. Update members.last_checkin_at to match MAX(checked_in) from checkins
    console.log('Updating members last_checkin_at from checkins table...');
    await client.query(`
      UPDATE members m
      SET last_checkin_at = sub.max_checkin
      FROM (
        SELECT member_id, MAX(checked_in) AS max_checkin
        FROM checkins
        GROUP BY member_id
      ) sub
      WHERE m.id = sub.member_id;
    `);

    // 9. Refresh Materialized View
    console.log('Refreshing gym_hourly_stats materialized view...');
    await client.query('REFRESH MATERIALIZED VIEW gym_hourly_stats;');

    await client.query('COMMIT');

    const duration = ((Date.now() - startMs) / 1000).toFixed(2);
    console.log(`WTF LivePulse Database Seeding completed successfully in ${duration} seconds!`);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error seeding database:', err);
    throw err;
  } finally {
    client.release();
  }
}

if (require.main === module) {
  seed()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = seed;
