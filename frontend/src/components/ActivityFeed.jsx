import React from 'react';
import { LogIn, LogOut, CreditCard, Activity } from 'lucide-react';

export function ActivityFeed({ feed = [] }) {
  const formatTime = (ts) => {
    if (!ts) return '';
    const date = new Date(ts);
    return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const getEventBadge = (type) => {
    switch (type) {
      case 'CHECKIN':
      case 'check-in':
        return (
          <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400 bg-emerald-950/60 border border-emerald-800/80 px-2 py-0.5 rounded-md">
            <LogIn className="w-3.5 h-3.5" /> CHECK-IN
          </span>
        );
      case 'CHECKOUT':
      case 'check-out':
        return (
          <span className="flex items-center gap-1.5 text-xs font-semibold text-amber-400 bg-amber-950/60 border border-amber-800/80 px-2 py-0.5 rounded-md">
            <LogOut className="w-3.5 h-3.5" /> CHECK-OUT
          </span>
        );
      case 'PAYMENT':
      case 'payment':
        return (
          <span className="flex items-center gap-1.5 text-xs font-semibold text-cyan-400 bg-cyan-950/60 border border-cyan-800/80 px-2 py-0.5 rounded-md">
            <CreditCard className="w-3.5 h-3.5" /> PAYMENT
          </span>
        );
      default:
        return (
          <span className="text-xs font-semibold text-slate-400 bg-slate-800 px-2 py-0.5 rounded-md">
            EVENT
          </span>
        );
    }
  };

  return (
    <div className="bg-[#1A1A2E] border border-[#2D2D4D] rounded-2xl p-6 shadow-xl h-[420px] flex flex-col">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#2D2D4D]">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-cyan-400" />
          <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-300">Live Activity Feed (Last 20)</h3>
        </div>
        <span className="text-xs text-slate-400 font-mono">Auto-scroll</span>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2.5 pr-1" id="activity-feed-list">
        {feed.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-sm">
            Waiting for live events...
          </div>
        ) : (
          feed.map((item, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between bg-[#0D0D1A] p-3 rounded-xl border border-[#2D2D4D]/60 hover:border-[#3D3D66] transition-colors"
            >
              <div className="flex items-center gap-3">
                {getEventBadge(item.event_type)}
                <div>
                  <p className="text-xs font-semibold text-slate-200">{item.member_name}</p>
                  <p className="text-[11px] text-slate-400">{item.gym_name}</p>
                </div>
              </div>
              <span className="text-[11px] font-mono text-slate-400">{formatTime(item.timestamp)}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
