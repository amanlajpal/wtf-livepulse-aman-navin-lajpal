import React, { useState } from 'react';
import { useAnomalies } from '../hooks/useAnomalies';
import { ShieldAlert, AlertTriangle, CheckCircle2, X } from 'lucide-react';

export function AnomaliesTable() {
  const { anomalies, loading, dismissAnomaly } = useAnomalies();
  const [selectedAnomalyToDismiss, setSelectedAnomalyToDismiss] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  const formatDate = (ts) => {
    if (!ts) return '';
    return new Date(ts).toLocaleString('en-IN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const handleDismissConfirm = async () => {
    if (!selectedAnomalyToDismiss) return;
    setErrorMessage('');
    const res = await dismissAnomaly(selectedAnomalyToDismiss.id);
    if (!res.success) {
      setErrorMessage(res.error || 'Failed to dismiss anomaly');
    } else {
      setSelectedAnomalyToDismiss(null);
    }
  };

  return (
    <div id="anomalies-section" className="bg-[#1A1A2E] border border-[#2D2D4D] rounded-2xl p-6 shadow-xl mb-6">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#2D2D4D]">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-amber-400" />
          <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-300">
            Real-Time Anomaly Log ({anomalies.length} Active Alerts)
          </h3>
        </div>
        <span className="text-xs font-mono text-amber-400 bg-amber-950 border border-amber-800 px-2.5 py-1 rounded-full">
          30s Background Evaluator
        </span>
      </div>

      {errorMessage && (
        <div className="mb-4 bg-red-950/80 border border-red-800 text-red-300 px-4 py-2 rounded-xl text-xs flex justify-between items-center">
          <span>{errorMessage}</span>
          <button onClick={() => setErrorMessage('')} className="text-red-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {loading ? (
        <div className="py-12 text-center text-slate-500 text-sm">Loading anomalies...</div>
      ) : anomalies.length === 0 ? (
        <div className="py-12 text-center text-slate-400 text-sm flex flex-col items-center gap-2">
          <CheckCircle2 className="w-8 h-8 text-emerald-400" />
          <span>All gym systems operating normally. Zero active anomalies.</span>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#2D2D4D] text-slate-400 uppercase font-mono tracking-wider">
                <th className="py-3 px-4">Gym Name</th>
                <th className="py-3 px-4">Anomaly Type</th>
                <th className="py-3 px-4">Severity</th>
                <th className="py-3 px-4">Time Detected</th>
                <th className="py-3 px-4">Message</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2D2D4D]/60 font-medium">
              {anomalies.map((item) => {
                const isCritical = item.severity === 'critical';

                return (
                  <tr key={item.id} className="hover:bg-[#0D0D1A]/50 transition-colors">
                    <td className="py-3 px-4 font-semibold text-slate-200">{item.gym_name}</td>
                    <td className="py-3 px-4">
                      <span className="font-mono text-cyan-300 uppercase">{item.type}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                          isCritical
                            ? 'bg-red-950 text-red-400 border-red-800'
                            : 'bg-amber-950 text-amber-400 border-amber-800'
                        }`}
                      >
                        {item.severity}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-400">{formatDate(item.detected_at)}</td>
                    <td className="py-3 px-4 text-slate-300 max-w-xs truncate">{item.message}</td>
                    <td className="py-3 px-4 text-right">
                      {isCritical ? (
                        <span className="text-[11px] text-slate-500 font-mono italic" title="Critical alerts auto-resolve only">
                          Auto-resolve Only
                        </span>
                      ) : (
                        <button
                          onClick={() => setSelectedAnomalyToDismiss(item)}
                          className="bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 px-3 py-1 rounded-lg text-xs font-semibold transition-all"
                        >
                          Dismiss
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Confirmation Modal */}
      {selectedAnomalyToDismiss && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#1A1A2E] border border-amber-500/40 rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="w-6 h-6 text-amber-400" />
              <h4 className="text-lg font-bold text-white">Dismiss Anomaly Warning</h4>
            </div>

            <p className="text-sm text-slate-300 mb-6">
              Are you sure you want to dismiss this warning for{' '}
              <span className="text-cyan-400 font-semibold">{selectedAnomalyToDismiss.gym_name}</span>?
            </p>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setSelectedAnomalyToDismiss(null)}
                className="px-4 py-2 bg-[#0D0D1A] border border-[#2D2D4D] text-slate-300 hover:text-white rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleDismissConfirm}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold rounded-xl text-xs shadow-lg shadow-amber-600/30"
              >
                Confirm Dismissal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
