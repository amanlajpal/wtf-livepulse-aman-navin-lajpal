import React from 'react';
import { UserX, AlertCircle } from 'lucide-react';

export function ChurnRiskPanel({ members = [], loading }) {
  if (loading) {
    return (
      <div className="bg-[#1A1A2E] border border-[#2D2D4D] rounded-2xl p-6 h-72 animate-pulse flex items-center justify-center">
        <span className="text-slate-500 text-sm">Loading Churn Risk Members...</span>
      </div>
    );
  }

  const formatDate = (ts) => {
    if (!ts) return 'N/A';
    return new Date(ts).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getDaysAgo = (ts) => {
    if (!ts) return 0;
    const diff = Date.now() - new Date(ts).getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="bg-[#1A1A2E] border border-[#2D2D4D] rounded-2xl p-6 shadow-xl h-72 flex flex-col">
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#2D2D4D]">
        <div className="flex items-center gap-2">
          <UserX className="w-5 h-5 text-amber-400" />
          <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-300">
            Live Churn Risk Panel ({members.length})
          </h3>
        </div>
        <span className="text-[11px] font-mono text-slate-400">45+ Days Inactive</span>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2 pr-1" id="churn-risk-list">
        {members.length === 0 ? (
          <div className="text-center py-10 text-slate-500 text-sm">
            No churn risk members detected for this gym.
          </div>
        ) : (
          members.map((m) => {
            const daysAgo = getDaysAgo(m.last_checkin_at);
            const isCritical = m.risk_level === 'Critical' || daysAgo >= 60;

            return (
              <div
                key={m.id}
                className="flex items-center justify-between bg-[#0D0D1A] p-2.5 rounded-xl border border-[#2D2D4D]/60 hover:border-[#3D3D66] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`p-1.5 rounded-lg ${isCritical ? 'bg-red-500/10 text-red-400' : 'bg-amber-500/10 text-amber-400'}`}>
                    <AlertCircle className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-200">{m.name}</p>
                    <p className="text-[11px] text-slate-400">Last check-in: {formatDate(m.last_checkin_at)}</p>
                  </div>
                </div>

                <div className="text-right">
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                      isCritical
                        ? 'bg-red-950 text-red-400 border-red-800'
                        : 'bg-amber-950 text-amber-400 border-amber-800'
                    }`}
                  >
                    {isCritical ? 'Critical' : 'High'} ({daysAgo}d)
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
