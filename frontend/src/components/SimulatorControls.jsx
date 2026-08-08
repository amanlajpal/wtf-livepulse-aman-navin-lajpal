import React from 'react';
import { useGymStore } from '../store/gymStore';
import { Play, Pause, RotateCcw, FastForward, Cpu } from 'lucide-react';

export function SimulatorControls() {
  const simulatorState = useGymStore((state) => state.simulatorState);
  const startSimulator = useGymStore((state) => state.startSimulator);
  const stopSimulator = useGymStore((state) => state.stopSimulator);
  const resetSimulator = useGymStore((state) => state.resetSimulator);

  const isRunning = simulatorState.status === 'running';

  return (
    <div className="bg-[#16162A] border border-cyan-500/30 rounded-2xl p-4 mb-6 flex flex-wrap items-center justify-between gap-4 shadow-lg shadow-cyan-500/5">
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-cyan-500/10 text-cyan-400 rounded-xl border border-cyan-500/20">
          <Cpu className="w-5 h-5" />
        </div>
        <div>
          <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            Live Simulation Engine
            <span
              className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md ${
                isRunning ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-slate-800 text-slate-400'
              }`}
            >
              {simulatorState.status.toUpperCase()}
            </span>
          </h4>
          <p className="text-xs text-slate-400">Injects real-time check-ins, check-outs & payments into PostgreSQL</p>
        </div>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        {/* Speed Selector */}
        <div className="flex items-center bg-[#0D0D1A] border border-[#2D2D4D] rounded-xl p-1 text-xs font-semibold">
          <span className="px-2 text-slate-400 flex items-center gap-1">
            <FastForward className="w-3.5 h-3.5" /> Speed:
          </span>
          {[1, 5, 10].map((s) => (
            <button
              key={s}
              onClick={() => isRunning && startSimulator(s)}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                simulatorState.speed === s
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {s}x
            </button>
          ))}
        </div>

        {/* Start / Pause Button */}
        {isRunning ? (
          <button
            onClick={stopSimulator}
            className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold rounded-xl text-xs shadow-lg shadow-amber-600/20 transition-all"
          >
            <Pause className="w-4 h-4" /> Pause Simulation
          </button>
        ) : (
          <button
            onClick={() => startSimulator(simulatorState.speed)}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-emerald-600/20 transition-all"
          >
            <Play className="w-4 h-4" /> Start Simulation
          </button>
        )}

        {/* Reset Baseline Button */}
        <button
          onClick={resetSimulator}
          className="flex items-center gap-2 px-3 py-2 bg-[#0D0D1A] hover:bg-[#1A1A2E] border border-[#2D2D4D] text-slate-300 hover:text-white rounded-xl text-xs font-semibold transition-all"
        >
          <RotateCcw className="w-4 h-4 text-slate-400" /> Reset Baseline
        </button>
      </div>
    </div>
  );
}
