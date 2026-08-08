import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { UserCheck } from 'lucide-react';

const COLORS = ['#10B981', '#06B6D4']; // Emerald for New, Cyan for Renewal

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    return (
      <div className="bg-[#1A1A2E] border border-[#3D3D66] p-3 rounded-xl shadow-2xl text-xs">
        <p className="text-slate-200 font-semibold mb-1">{data.name}</p>
        <p className="text-white font-mono font-bold text-sm">
          Memberships : <span className="text-cyan-400 font-extrabold">{data.value}</span>
        </p>
      </div>
    );
  }
  return null;
};

export function NewVsRenewalChart({ data = [], loading }) {
  if (loading) {
    return (
      <div className="bg-[#1A1A2E] border border-[#2D2D4D] rounded-2xl p-6 h-72 animate-pulse flex items-center justify-center">
        <span className="text-slate-500 text-sm">Loading New vs Renewal Ratio...</span>
      </div>
    );
  }

  const chartData = [
    { name: 'New Joiners', value: 0 },
    { name: 'Renewals', value: 0 }
  ];

  data.forEach((row) => {
    if (row.payment_type === 'new') chartData[0].value = parseInt(row.count, 10);
    if (row.payment_type === 'renewal') chartData[1].value = parseInt(row.count, 10);
  });

  const total = chartData[0].value + chartData[1].value;
  const newPct = total > 0 ? Math.round((chartData[0].value / total) * 100) : 0;

  return (
    <div className="bg-[#1A1A2E] border border-[#2D2D4D] rounded-2xl p-6 shadow-xl h-72 flex flex-col">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <UserCheck className="w-5 h-5 text-emerald-400" />
          <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-300">
            New vs Renewal Ratio
          </h3>
        </div>
        <span className="text-xs font-mono font-semibold text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded">
          {newPct}% New
        </span>
      </div>

      <div className="flex-1 w-full relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={75}
              paddingAngle={5}
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '12px', color: '#E2E8F0' }} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
