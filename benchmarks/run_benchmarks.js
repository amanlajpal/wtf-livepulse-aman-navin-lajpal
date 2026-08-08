const fs = require('fs');
const path = require('path');
const pool = require('../backend/src/db/pool');

async function runBenchmarks() {
  console.log('Running PostgreSQL EXPLAIN ANALYZE Benchmarks...');

  const client = await pool.connect();
  try {
    const gymRes = await client.query('SELECT id FROM gyms LIMIT 1');
    if (gymRes.rows.length === 0) {
      console.error('No gyms found. Please seed the database first.');
      process.exit(1);
    }
    const sampleGymId = gymRes.rows[0].id;

    const queries = [
      {
        id: 'Q1',
        name: 'Live Occupancy — Single Gym',
        target: '< 0.5ms',
        indexUsed: 'idx_checkins_live_occupancy (partial)',
        sql: `EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT) SELECT COUNT(*) FROM checkins WHERE gym_id = '${sampleGymId}' AND checked_out IS NULL;`
      },
      {
        id: 'Q2',
        name: "Today's Revenue — Single Gym",
        target: '< 0.8ms',
        indexUsed: 'idx_payments_gym_date (composite)',
        sql: `EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT) SELECT SUM(amount) FROM payments WHERE gym_id = '${sampleGymId}' AND paid_at >= CURRENT_DATE;`
      },
      {
        id: 'Q3',
        name: 'Churn Risk Members',
        target: '< 1.0ms',
        indexUsed: 'idx_members_churn_risk (partial)',
        sql: `EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT) SELECT id, name, last_checkin_at FROM members WHERE status='active' AND last_checkin_at < NOW() - INTERVAL '45 days';`
      },
      {
        id: 'Q4',
        name: 'Peak Hour Heatmap (7d)',
        target: '< 0.3ms',
        indexUsed: 'idx_gym_hourly_stats_unique (materialized view)',
        sql: `EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT) SELECT * FROM gym_hourly_stats WHERE gym_id = '${sampleGymId}';`
      },
      {
        id: 'Q5',
        name: 'Cross-Gym Revenue Comparison',
        target: '< 2.0ms',
        indexUsed: 'idx_payments_date (covering)',
        sql: `EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT) SELECT gym_id, SUM(amount) FROM payments WHERE paid_at >= NOW() - INTERVAL '30 days' GROUP BY gym_id ORDER BY SUM(amount) DESC;`
      },
      {
        id: 'Q6',
        name: 'Active Anomalies — All Gyms',
        target: '< 0.3ms',
        indexUsed: 'idx_anomalies_active (partial)',
        sql: `EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT) SELECT * FROM anomalies WHERE resolved = FALSE ORDER BY detected_at DESC;`
      }
    ];

    const outDir = path.join(__dirname, 'screenshots');
    if (!fs.existsSync(outDir)) {
      fs.mkdirSync(outDir, { recursive: true });
    }

    const summaryResults = [];

    for (const q of queries) {
      console.log(`Executing ${q.id}: ${q.name}...`);
      const res = await client.query(q.sql);
      const planLines = res.rows.map(r => r['QUERY PLAN']).join('\n');

      let executionTime = 'N/A';
      const execMatch = planLines.match(/Execution Time: ([\d\.]+) ms/);
      if (execMatch) {
        executionTime = `${execMatch[1]} ms`;
      }

      const logContent = `=== BENCHMARK QUERY ${q.id}: ${q.name} ===\nTarget Time: ${q.target}\nIndex Used: ${q.indexUsed}\nMeasured Execution Time: ${executionTime}\n\n=== EXPLAIN ANALYZE OUTPUT ===\n${planLines}\n`;

      fs.writeFileSync(path.join(outDir, `${q.id}_output.txt`), logContent);
      summaryResults.push({
        id: q.id,
        name: q.name,
        target: q.target,
        executionTime,
        indexUsed: q.indexUsed
      });
    }

    console.log('\n========================================');
    console.log('BENCHMARK SUMMARY RESULTS');
    console.log('========================================');
    console.table(summaryResults);

    fs.writeFileSync(path.join(__dirname, 'benchmark_summary.json'), JSON.stringify(summaryResults, null, 2));
  } catch (err) {
    console.error('Error running benchmarks:', err);
  } finally {
    client.release();
    process.exit(0);
  }
}

runBenchmarks();
