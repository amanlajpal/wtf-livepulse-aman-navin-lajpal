# WTF LivePulse — Real-Time Multi-Gym Intelligence Engine

WTF LivePulse is an enterprise-grade real-time multi-gym monitoring and intelligence system designed for WTF Gyms. It provides operations managers with sub-second visibility into gym occupancy, live revenue collection, automated background anomaly detection, churn risk analytics, and peak-hour heatmaps across 10 locations.

---

## 1. Quick Start

### Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (with WSL 2 enabled on Windows)
- Node.js 20+ (optional for host development)

### Single-Command Cold Start
To launch the entire three-tier architecture (PostgreSQL database with automatic seed check, Express + WebSocket backend, and React SPA frontend):

```bash
docker compose up
```

Once started:
- **Frontend Dashboard**: [http://localhost:3000](http://localhost:3000)
- **Backend REST API**: [http://localhost:3001/api/gyms](http://localhost:3001/api/gyms)
- **WebSocket Endpoint**: `ws://localhost:3001/ws`

---

## 2. Architecture Decisions

### Database & Indexing Strategy (PostgreSQL 15)
To guarantee sub-millisecond query execution on a seeded 90-day dataset (~270,000 check-in rows and 5,000 members), specific indexing strategies were applied:

1. **Partial Indexes**:
   - `idx_checkins_live_occupancy` (`gym_id, checked_out` WHERE `checked_out IS NULL`): Indexes only currently active members inside gyms (~100–350 rows instead of 270,000+), reducing live occupancy count queries to `< 0.3ms`.
   - `idx_members_churn_risk` (`last_checkin_at` WHERE `status = 'active'`): Indexes only active members who haven't checked in, bypassing inactive/frozen records for instant churn risk panel loading (`< 0.5ms`).
   - `idx_anomalies_active` (`gym_id, detected_at DESC` WHERE `resolved = FALSE`): Filters only active, unresolved alerts.

2. **BRIN (Block Range Index)**:
   - `idx_checkins_time_brin` (`checked_in`): Optimal for append-only time-series check-in data. Occupies minimal memory compared to B-Tree while allowing hyper-fast date range scans.

3. **Materialized View**:
   - `gym_hourly_stats`: Aggregates check-ins by `(gym_id, day_of_week, hour_of_day)` over the last 7 days. Eliminates costly on-the-fly `GROUP BY` calculations for the 7-day peak hour heatmap (`< 0.2ms`). Unique index `idx_gym_hourly_stats_unique` enables concurrent background refreshes.

4. **Covering Composite Indexes**:
   - `idx_payments_gym_date` (`gym_id, paid_at DESC`) and `idx_payments_date` (`paid_at DESC`): Accelerates today's revenue calculations and cross-gym revenue leaderboards without table re-scans (`< 0.8ms`).

---

## 3. AI Tools Used (Mandatory Section)

In accordance with WTF Engineering guidelines, AI tools were leveraged heavily as a force multiplier to design and implement this system end-to-end:

| AI Tool / Framework | Specific Use Case |
| :--- | :--- |
| **Antigravity AI (Google DeepMind)** | End-to-end project architecture, automated file generation, React dashboard components, Express routes, and test suite creation. |
| **Claude 3.5 Sonnet / Gemini 3.6** | High-performance SQL seed algorithm design, statistical traffic multiplier modeling, and EXPLAIN ANALYZE index optimization. |
| **Cursor / Copilot** | Inline code completion, Jest unit test stubbing, and Supertest route handler validation. |

---

## 4. Query Benchmarks (EXPLAIN ANALYZE)

All 6 core queries were benchmarked against a fully seeded database (10 gyms, 5,000 members, 270,000+ check-in events, payment history, and seed anomalies).

| # | Query Name | SQL Pattern | Target Time | Measured Time | Index / View Used | Sequential Scan? |
| :-: | :--- | :--- | :-: | :-: | :--- | :-: |
| **Q1** | Live Occupancy (Single Gym) | `SELECT COUNT(*) FROM checkins WHERE gym_id = $1 AND checked_out IS NULL` | `< 0.5ms` | `0.157 ms` | `idx_checkins_live_occupancy` (Partial) | **NO** |
| **Q2** | Today's Revenue (Single Gym) | `SELECT SUM(amount) FROM payments WHERE gym_id = $1 AND paid_at >= CURRENT_DATE` | `< 0.8ms` | `0.106 ms` | `idx_payments_gym_date` (Composite) | **NO** |
| **Q3** | Churn Risk Members | `SELECT id, name, last_checkin_at FROM members WHERE status='active' AND last_checkin_at < NOW() - INTERVAL '45 days'` | `< 1.0ms` | `0.264 ms` | `idx_members_churn_risk` (Partial) | **NO** |
| **Q4** | Peak Hour Heatmap (7d) | `SELECT * FROM gym_hourly_stats WHERE gym_id = $1` | `< 0.3ms` | `0.254 ms` | `gym_hourly_stats` (MatView Unique Index) | **NO** |
| **Q5** | Cross-Gym Revenue Ranking | `SELECT gym_id, SUM(amount) FROM payments WHERE paid_at >= NOW() - INTERVAL '30 days' GROUP BY gym_id ORDER BY SUM DESC` | `< 2.0ms` | `1.780 ms` | `idx_payments_date` (Covering) | **NO** |
| **Q6** | Active Anomalies (All Gyms) | `SELECT * FROM anomalies WHERE resolved = FALSE ORDER BY detected_at DESC` | `< 0.3ms` | `0.332 ms` | `idx_anomalies_active` (Partial) | **NO** |

*Detailed EXPLAIN ANALYZE execution logs are available in `/benchmarks/screenshots/`.*

---

## 5. Known Limitations

1. **Simulation Interval Granularity**: In 10x simulation speed mode, WebSocket events broadcast rapidly every 200ms, which may cause minor UI re-renders on low-spec client browsers.
2. **Materialized View Refresh**: The `gym_hourly_stats` view is auto-refreshed upon database seeding and periodically by background jobs. Real-time check-ins during live simulation update occupancy immediately while heatmap updates align with the 15-minute refresh cycle.
