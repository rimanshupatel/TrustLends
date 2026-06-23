"use client";

import { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell
} from "recharts";

const distributionData = [
  { bracket: "500 - 600", capital: 45000, borrowers: 92, risk: "High", color: "#DC2626" },
  { bracket: "600 - 700", capital: 185000, borrowers: 310, risk: "Medium", color: "#D97706" },
  { bracket: "700 - 800", capital: 390000, borrowers: 842, risk: "Low", color: "#1A56DB" },
  { bracket: "800 - 1000", capital: 227200, borrowers: 598, risk: "Minimal", color: "#059669" },
];

export default function LoanDistributionChart() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="h-64 w-full bg-slate-50 border border-borderCustom rounded-xl animate-pulse flex items-center justify-center text-xs text-text-muted">
        Loading distribution stats...
      </div>
    );
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white border border-cardBorder p-3 rounded-xl shadow-lg font-sans">
          <p className="text-xs font-bold text-text-primary mb-1">Score: {data.bracket}</p>
          <div className="space-y-1 text-xs">
            <p className="text-text-secondary">
              Capital Allocated: <span className="font-mono font-bold text-text-primary">${data.capital.toLocaleString()}</span>
            </p>
            <p className="text-text-secondary">
              Borrowers count: <span className="font-mono font-bold text-text-primary">{data.borrowers}</span>
            </p>
            <p className="text-text-secondary">
              Risk Category: <span className="font-bold" style={{ color: data.color }}>{data.risk}</span>
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={distributionData}
          margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
          <XAxis
            dataKey="bracket"
            stroke="#94A3B8"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            dy={8}
            className="font-semibold"
          />
          <YAxis
            stroke="#94A3B8"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            dx={-8}
            tickFormatter={(val) => `$${val / 1000}k`}
            className="font-mono"
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: '#F8F9FC' }} />
          <Bar dataKey="capital" radius={[8, 8, 0, 0]} maxBarSize={48}>
            {distributionData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} opacity={0.85} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
