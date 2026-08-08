import React from 'react';
import { useGymStore } from '../store/gymStore';
import { LiveStatusDot } from './UI/LiveStatusDot';
import { Activity, AlertTriangle, ShieldAlert } from 'lucide-react';

export function Navigation() {
  const gyms = useGymStore((state) => state.gyms);
  const selectedGymId = useGymStore((state) => state.selectedGymId);
  const setSelectedGymId = useGymStore((state) => state.setSelectedGymId);
  const anomalies = useGymStore((state) => state.anomalies);
  const isWsConnected = useGymStore((state) => state.isWsConnected);
  const dateRange = useGymStore((state) => state.dateRange);
  const setDateRange = useGymStore((state) => state.setDateRange);

  const activeAnomaliesCount = anomalies.length;

  return (
    <header className="bg-[#1A1A2E] border-b border-[#2D2D4D] sticky top-0 z-50">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-tr from-cyan-600 to-emerald-500 p-2.5 rounded-xl shadow-lg shadow-cyan-500/20">
            <Activity className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold font-sora tracking-tight text-white flex items-center gap-2">
              WTF LIVEPULSE
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
                v1.0 REALTIME
              </span>
            </h1>
            <p className="text-xs text-slate-400">Multi-Gym Operations Command Centre</p>
          </div>
        </div>

        {/* Gym Selector & Controls */}
        <div className="flex items-center gap-4 flex-wrap">
          {/* Gym Selector Dropdown */}
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Gym Location:</label>
            <select
              id="gym-selector"
              value={selectedGymId || ''}
              onChange={(e) => setSelectedGymId(e.target.value)}
              className="bg-[#0D0D1A] border border-[#2D2D4D] text-white text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:border-cyan-500 font-medium transition-colors"
            >
              {gyms.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name} ({g.city})
                </option>
              ))}
            </select>
          </div>

          {/* Date Range Selector */}
          <div className="flex items-center bg-[#0D0D1A] border border-[#2D2D4D] rounded-lg p-0.5 text-xs font-medium">
            {['7d', '30d', '90d'].map((range) => (
              <button
                key={range}
                onClick={() => setDateRange(range)}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  dateRange === range
                    ? 'bg-cyan-600 text-white shadow-sm font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {range.toUpperCase()}
              </button>
            ))}
          </div>

          {/* Anomaly Count Badge */}
          <a
            href="#anomalies-section"
            className="flex items-center gap-2 bg-[#0D0D1A] hover:bg-[#16162A] border border-[#2D2D4D] hover:border-amber-500/50 px-3 py-1.5 rounded-lg transition-all"
          >
            <AlertTriangle className={`w-4 h-4 ${activeAnomaliesCount > 0 ? 'text-amber-400 animate-pulse' : 'text-slate-400'}`} />
            <span className="text-xs font-semibold text-slate-300">Anomalies</span>
            {activeAnomaliesCount > 0 && (
              <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full animate-bounce">
                {activeAnomaliesCount}
              </span>
            )}
          </a>

          {/* Live WebSocket Indicator */}
          <div className="bg-[#0D0D1A] border border-[#2D2D4D] px-3 py-1.5 rounded-lg">
            <LiveStatusDot isLive={isWsConnected} />
          </div>
        </div>
      </div>
    </header>
  );
}
