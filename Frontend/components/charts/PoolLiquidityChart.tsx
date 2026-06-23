"use client";

import { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend
} from "recharts";
import { lendMarket } from "@/lib/mock-data";

export default function PoolLiquidityChart() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="h-64 w-full bg-slate-50 border border-borderCustom rounded-xl animate-pulse flex items-center justify-center text-xs text-text-muted">
        Loading pool composition...
      </div>
    );
  }

  const data = lendMarket.riskDistribution.map(item => ({
    name: item.tier.split(" (")[0], // e.g. "Low Risk"
    value: item.percentage,
    color: item.color
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-cardBorder p-2.5 rounded-xl shadow-lg font-sans text-xs">
          <p className="font-bold text-text-primary mb-1">{payload[0].name}</p>
          <p className="text-text-secondary">
            Pool share: <span className="font-mono font-bold text-text-primary">{payload[0].value}%</span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full h-64 flex flex-col justify-between">
      <div className="flex-1 min-h-[180px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={75}
              paddingAngle={4}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="flex flex-wrap justify-center gap-4 text-xs font-semibold text-text-secondary px-4 mt-2">
        {data.map((item, idx) => (
          <div key={idx} className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
            <span>{item.name} ({item.value}%)</span>
          </div>
        ))}
      </div>
    </div>
  );
}
