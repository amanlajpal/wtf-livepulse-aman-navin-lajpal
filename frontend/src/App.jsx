import React from 'react';
import { useWebSocket } from './hooks/useWebSocket';
import { useGymData } from './hooks/useGymData';
import { Navigation } from './components/Navigation';
import { SummaryBar } from './components/SummaryBar';
import { SimulatorControls } from './components/SimulatorControls';
import { OccupancyCard } from './components/OccupancyCard';
import { RevenueTicker } from './components/RevenueTicker';
import { ActivityFeed } from './components/ActivityFeed';
import { HeatmapChart } from './components/HeatmapChart';
import { RevenueBreakdownChart } from './components/RevenueBreakdownChart';
import { ChurnRiskPanel } from './components/ChurnRiskPanel';
import { NewVsRenewalChart } from './components/NewVsRenewalChart';
import { CrossGymRevenueChart } from './components/CrossGymRevenueChart';
import { AnomaliesTable } from './components/AnomaliesTable';

export default function App() {
  // Initialize WebSocket connection
  useWebSocket();

  const { liveSnapshot, analytics, crossGymData, activityFeed, loading } = useGymData();

  return (
    <div className="min-h-screen bg-[#0D0D1A] text-[#E2E8F0] pb-12">
      {/* Navigation Bar */}
      <Navigation />

      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 pt-6">
        {/* Top Aggregated Summary Bar (S-06) */}
        <SummaryBar />

        {/* Live Simulator Controls (Module 4) */}
        <SimulatorControls />

        {/* Real-Time Anomaly Log Table (Module 3) */}
        <AnomaliesTable />

        {/* Module 1: Live Operations Dashboard */}
        <div className="mb-8">
          <h2 className="text-lg font-bold font-sora text-white mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
            MODULE 1 — Live Gym Operations Dashboard
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <OccupancyCard snapshot={liveSnapshot} loading={loading.snapshot} />
            <RevenueTicker snapshot={liveSnapshot} loading={loading.snapshot} />
            <ActivityFeed feed={activityFeed} />
          </div>
        </div>

        {/* Module 2: Analytics Engine */}
        <div className="mb-8">
          <h2 className="text-lg font-bold font-sora text-white mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            MODULE 2 — Analytics Engine
          </h2>

          {/* Row 1: Heatmap (Full Width) */}
          <div className="mb-6">
            <HeatmapChart heatmapData={analytics?.heatmap} loading={loading.analytics} />
          </div>

          {/* Row 2: Charts Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <RevenueBreakdownChart data={analytics?.revenue_breakdown} loading={loading.analytics} />
            <ChurnRiskPanel members={analytics?.churn_risk} loading={loading.analytics} />
            <NewVsRenewalChart data={analytics?.new_vs_renewal} loading={loading.analytics} />
          </div>

          {/* Row 3: Cross-Gym Comparison */}
          <div>
            <CrossGymRevenueChart data={crossGymData} loading={loading.gyms} />
          </div>
        </div>
      </main>
    </div>
  );
}
