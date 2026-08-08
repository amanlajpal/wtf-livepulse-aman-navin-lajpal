import React from 'react';
import { AnimatedNumber } from './UI/AnimatedNumber';
import { Users } from 'lucide-react';

export function OccupancyCard({ snapshot, loading }) {
  if (loading || !snapshot) {
    return (
      <div className="bg-[#1A1A2E] border border-[#2D2D4D] rounded-2xl p-6 h-48 animate-pulse flex flex-col justify-between">
        <div className="h-4 bg-[#252545] rounded w-1/3"></div>
        <div className="h-10 bg-[#252545] rounded w-1/2"></div>
        <div className="h-3 bg-[#252545] rounded w-full"></div>
      </div>
    );
  }

  const occupancy = snapshot.current_occupancy || 0;
  const capacity = snapshot.capacity || 1;
  const pct = Math.min(100, Math.round((occupancy / capacity) * 100));

  // Threshold color coding (M-03)
  let statusColor = 'text-emerald-400';
  let bgColor = 'bg-emerald-500';
  let borderColor = 'border-emerald-500/30';
  let badgeText = 'Normal';

  if (pct >= 85) {
    statusColor = 'text-red-400';
    bgColor = 'bg-red-500';
    borderColor = 'border-red-500/30';
    badgeText = 'High Traffic / Near Capacity';
  } else if (pct >= 60) {
    statusColor = 'text-amber-400';
    bgColor = 'bg-amber-500';
    borderColor = 'border-amber-500/30';
    badgeText = 'Moderate Traffic';
  }

  return (
    <div className={`bg-[#1A1A2E] border ${borderColor} rounded-2xl p-6 transition-all shadow-xl`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-slate-400" />
          <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-300">Live Occupancy</h3>
        </div>
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${borderColor} ${statusColor} bg-[#0D0D1A]`}>
          {badgeText}
        </span>
      </div>

      {/* Main KPI display */}
      <div className="flex items-baseline gap-3 mb-4">
        <span className={`text-4xl sm:text-5xl font-extrabold font-mono ${statusColor}`} id="live-occupancy-counter">
          <AnimatedNumber value={occupancy} />
        </span>
        <span className="text-lg text-slate-400 font-mono">
          / {capacity} capacity (<AnimatedNumber value={pct} suffix="%" />)
        </span>
      </div>

      {/* Progress bar */}
      <div className="space-y-1.5">
        <div className="w-full bg-[#0D0D1A] rounded-full h-3 overflow-hidden p-0.5 border border-[#2D2D4D]">
          <div
            className={`h-full rounded-full transition-all duration-500 ${bgColor}`}
            style={{ width: `${pct}%` }}
          ></div>
        </div>
        <div className="flex justify-between text-[11px] font-mono text-slate-400">
          <span>0%</span>
          <span>60% (Mod)</span>
          <span>85% (High)</span>
          <span>100%</span>
        </div>
      </div>
    </div>
  );
}
