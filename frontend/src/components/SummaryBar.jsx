import React from 'react';
import { useGymStore } from '../store/gymStore';
import { AnimatedNumber } from './UI/AnimatedNumber';
import { Users, IndianRupee, ShieldAlert } from 'lucide-react';

export function SummaryBar() {
  const gyms = useGymStore((state) => state.gyms);
  const anomalies = useGymStore((state) => state.anomalies);

  const totalOccupancy = gyms.reduce((acc, g) => acc + (g.current_occupancy || 0), 0);
  const totalRevenue = gyms.reduce((acc, g) => acc + (parseFloat(g.today_revenue) || 0), 0);
  const totalAnomalies = anomalies.length;

  return (
    <div className="bg-[#16162A] border border-[#2D2D4D] rounded-2xl p-4 mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Total Active Occupancy */}
      <div className="flex items-center gap-4 bg-[#0D0D1A] p-4 rounded-xl border border-[#2D2D4D]/60">
        <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
          <Users className="w-6 h-6" />
        </div>
        <div>
          <p className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Total Checked-In Right Now</p>
          <div className="text-2xl font-bold font-mono text-white">
            <AnimatedNumber value={totalOccupancy} suffix=" members" />
          </div>
        </div>
      </div>

      {/* Total Revenue Today */}
      <div className="flex items-center gap-4 bg-[#0D0D1A] p-4 rounded-xl border border-[#2D2D4D]/60">
        <div className="p-3 bg-cyan-500/10 text-cyan-400 rounded-xl border border-cyan-500/20">
          <IndianRupee className="w-6 h-6" />
        </div>
        <div>
          <p className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Total Revenue Today (All Gyms)</p>
          <div className="text-2xl font-bold font-mono text-cyan-300">
            <AnimatedNumber value={totalRevenue} prefix="₹" />
          </div>
        </div>
      </div>

      {/* Active Anomalies Count */}
      <div className="flex items-center gap-4 bg-[#0D0D1A] p-4 rounded-xl border border-[#2D2D4D]/60">
        <div className={`p-3 rounded-xl border ${totalAnomalies > 0 ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-slate-500/10 text-slate-400 border-slate-500/20'}`}>
          <ShieldAlert className="w-6 h-6" />
        </div>
        <div>
          <p className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Active Anomalies System-Wide</p>
          <div className={`text-2xl font-bold font-mono ${totalAnomalies > 0 ? 'text-amber-400' : 'text-slate-300'}`}>
            <AnimatedNumber value={totalAnomalies} suffix={totalAnomalies === 1 ? ' alert' : ' alerts'} />
          </div>
        </div>
      </div>
    </div>
  );
}
