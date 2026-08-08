import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Trophy } from 'lucide-react';

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    return (
      <div className="bg-[#1A1A2E] border border-[#3D3D66] p-3 rounded-xl shadow-2xl text-xs">
        <p className="text-slate-200 font-semibold mb-1">{data.payload.name}</p>
        <p className="text-white font-mono font-bold text-sm">
          30-Day Revenue : <span className="text-cyan-400 font-extrabold">₹{data.value.toLocaleString('en-IN')}</span>
        </p>
      </div>
    );
  }
  return null;
};

export function CrossGymRevenueChart({ data = [], loading }) {
  if (loading) {
    return (
      <div className="bg-[#1A1A2E] border border-[#2D2D4D] rounded-2xl p-6 h-80 animate-pulse flex items-center justify-center">
        <span className="text-slate-500 text-sm">Loading Cross-Gym Revenue Rankings...</span>
      </div>
    );
  }

  const formattedData = data.map((item) => ({
    name: item.gym_name.replace('WTF Gyms — ', ''),
    revenue: parseFloat(item.total_revenue),
    rank: item.rank
  }));

  return (
    <div className="bg-[#1A1A2E] border border-[#2D2D4D] rounded-2xl p-6 shadow-xl h-80 flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-amber-400" />
          <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-300">
            Cross-Gym Revenue Leaderboard (Last 30 Days)
          </h3>
        </div>
        <span className="text-xs font-mono text-cyan-400 bg-cyan-950 border border-cyan-800 px-2.5 py-1 rounded-full">
          GROUP BY Covered Index (&lt;2ms)
        </span>
      </div>

      <div className="flex-1 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={formattedData} layout="vertical" margin={{ top: 5, right: 30, left: 100, bottom: 5 }}>
            <XAxis type="number" stroke="#64748B" fontSize={11} tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`} tickLine={false} />
            <YAxis type="category" dataKey="name" stroke="#E2E8F0" fontSize={11} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="revenue" radius={[0, 4, 4, 0]}>
              {formattedData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={index === 0 ? '#F59E0B' : index < 3 ? '#06B6D4' : '#3B82F6'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
