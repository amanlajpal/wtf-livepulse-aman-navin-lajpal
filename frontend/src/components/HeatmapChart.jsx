import React from 'react';
import { Calendar } from 'lucide-react';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const HOURS = Array.from({ length: 18 }, (_, i) => i + 5); // 5am to 10pm

export function HeatmapChart({ heatmapData = [], loading }) {
  if (loading) {
    return (
      <div className="bg-[#1A1A2E] border border-[#2D2D4D] rounded-2xl p-6 h-80 animate-pulse flex items-center justify-center">
        <span className="text-slate-500 text-sm">Loading Peak Hour Heatmap...</span>
      </div>
    );
  }

  // Map heatmap data to lookup grid
  const grid = {};
  let maxCount = 1;

  heatmapData.forEach((row) => {
    const dow = row.day_of_week;
    const hod = row.hour_of_day;
    const cnt = parseInt(row.checkin_count, 10);
    grid[`${dow}-${hod}`] = cnt;
    if (cnt > maxCount) maxCount = cnt;
  });

  const getHeatmapColor = (count) => {
    if (!count || count === 0) return 'bg-[#0D0D1A] text-slate-600';
    const ratio = count / maxCount;
    if (ratio > 0.75) return 'bg-cyan-500 text-slate-950 font-bold border border-cyan-300';
    if (ratio > 0.50) return 'bg-cyan-700 text-cyan-100 font-semibold';
    if (ratio > 0.25) return 'bg-cyan-900/80 text-cyan-300';
    return 'bg-cyan-950/40 text-cyan-400';
  };

  return (
    <div className="bg-[#1A1A2E] border border-[#2D2D4D] rounded-2xl p-6 shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-cyan-400" />
          <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-300">
            7-Day Peak Hours Heatmap
          </h3>
        </div>
        <span className="text-xs font-mono text-cyan-400 bg-cyan-950 border border-cyan-800 px-2.5 py-1 rounded-full">
          Materialized View Fast Query
        </span>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[700px]">
          {/* Header row: hours */}
          <div className="grid grid-cols-[60px_repeat(18,1fr)] gap-1 mb-1 text-[11px] font-mono text-slate-400 text-center">
            <div>Day</div>
            {HOURS.map((h) => (
              <div key={h}>{String(h).padStart(2, '0')}:00</div>
            ))}
          </div>

          {/* Day rows */}
          {DAYS.map((dayName, dIdx) => (
            <div key={dayName} className="grid grid-cols-[60px_repeat(18,1fr)] gap-1 mb-1 text-xs">
              <div className="font-semibold text-slate-300 flex items-center">{dayName}</div>
              {HOURS.map((hIdx) => {
                const count = grid[`${dIdx}-${hIdx}`] || 0;
                return (
                  <div
                    key={hIdx}
                    title={`${dayName} ${hIdx}:00 - ${count} check-ins`}
                    className={`h-7 rounded flex items-center justify-center text-[10px] font-mono transition-all hover:scale-110 cursor-pointer ${getHeatmapColor(
                      count
                    )}`}
                  >
                    {count > 0 ? count : ''}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
