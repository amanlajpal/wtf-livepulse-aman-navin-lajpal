import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { PieChart as PieIcon } from 'lucide-react';

const COLORS = {
  monthly: '#06B6D4', // cyan
  quarterly: '#10B981', // emerald
  annual: '#8B5CF6' // purple
};

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    return (
      <div className="bg-[#1A1A2E] border border-[#3D3D66] p-3 rounded-xl shadow-2xl text-xs">
        <p className="text-slate-200 font-semibold mb-1">{data.payload.name}</p>
        <p className="text-white font-mono font-bold text-sm">
          Revenue : <span className="text-cyan-400 font-extrabold">₹{data.value.toLocaleString('en-IN')}</span>
        </p>
      </div>
    );
  }
  return null;
};

export function RevenueBreakdownChart({ data = [], loading }) {
  if (loading) {
    return (
      <div className="bg-[#1A1A2E] border border-[#2D2D4D] rounded-2xl p-6 h-72 animate-pulse flex items-center justify-center">
        <span className="text-slate-500 text-sm">Loading Revenue Breakdown...</span>
      </div>
    );
  }

  const formattedData = data.map((item) => ({
    name: item.plan_type.toUpperCase(),
    plan_type: item.plan_type,
    revenue: parseFloat(item.total_revenue)
  }));

  return (
    <div className="bg-[#1A1A2E] border border-[#2D2D4D] rounded-2xl p-6 shadow-xl h-72 flex flex-col">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <PieIcon className="w-5 h-5 text-cyan-400" />
          <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-300">
            Revenue by Membership Plan
          </h3>
        </div>
      </div>

      <div className="flex-1 w-full mt-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={formattedData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
            <XAxis dataKey="name" stroke="#64748B" fontSize={12} tickLine={false} />
            <YAxis stroke="#64748B" fontSize={12} tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="revenue" radius={[6, 6, 0, 0]}>
              {formattedData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[entry.plan_type] || '#06B6D4'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
