import React from 'react';
import { AnimatedNumber } from './UI/AnimatedNumber';
import { IndianRupee, TrendingUp } from 'lucide-react';

export function RevenueTicker({ snapshot, loading }) {
  if (loading || !snapshot) {
    return (
      <div className="bg-[#1A1A2E] border border-[#2D2D4D] rounded-2xl p-6 h-48 animate-pulse flex flex-col justify-between">
        <div className="h-4 bg-[#252545] rounded w-1/3"></div>
        <div className="h-10 bg-[#252545] rounded w-1/2"></div>
        <div className="h-3 bg-[#252545] rounded w-full"></div>
      </div>
    );
  }

  const revenue = parseFloat(snapshot.today_revenue) || 0;

  return (
    <div className="bg-[#1A1A2E] border border-cyan-500/30 rounded-2xl p-6 shadow-xl relative overflow-hidden">
      <div className="absolute -right-6 -bottom-6 opacity-10 text-cyan-400">
        <TrendingUp className="w-36 h-36" />
      </div>

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <IndianRupee className="w-5 h-5 text-cyan-400" />
          <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-300">Today's Revenue Ticker</h3>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800">
          Real-time
        </span>
      </div>

      <div className="flex items-baseline gap-2 mb-3">
        <span className="text-4xl sm:text-5xl font-extrabold font-mono text-cyan-300" id="live-revenue-ticker">
          <AnimatedNumber value={revenue} prefix="₹" />
        </span>
      </div>

      <p className="text-xs text-slate-400">
        Live membership collections for <span className="text-slate-200 font-semibold">{snapshot.name}</span> today.
      </p>
    </div>
  );
}
