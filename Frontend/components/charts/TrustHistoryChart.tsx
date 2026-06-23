"use client";

import { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from "recharts";
import { scoreHistory } from "@/lib/mock-data";

export default function TrustHistoryChart() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="h-72 w-full bg-slate-50 border border-borderCustom rounded-xl animate-pulse flex items-center justify-center text-xs text-text-muted">
        Loading score analytics...
      </div>
    );
  }

  // Custom tooltips styling to match premium aesthetics
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-cardBorder p-3 rounded-xl shadow-lg font-sans">
          <p className="text-xs font-bold text-text-primary mb-1.5">{label} 2025</p>
          <div className="space-y-1">
            {payload.map((entry: any, index: number) => (
              <p key={index} className="text-xs flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                <span className="text-text-secondary">{entry.name}:</span>
                <span className="font-mono font-bold text-text-primary">{entry.value}</span>
              </p>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={scoreHistory}
          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
        >
          <defs>
            <linearGradient id="scoreHistoryGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#1A56DB" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#1A56DB" stopOpacity={0.0} />
            </linearGradient>
            <linearGradient id="avgHistoryGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#94A3B8" stopOpacity={0.1} />
              <stop offset="95%" stopColor="#94A3B8" stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
          <XAxis
            dataKey="month"
            stroke="#94A3B8"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            dy={10}
            className="font-medium"
          />
          <YAxis
            domain={[500, 1000]}
            stroke="#94A3B8"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            dx={-10}
            className="font-mono"
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            verticalAlign="top"
            height={36}
            iconType="circle"
            iconSize={8}
            className="text-xs"
            wrapperStyle={{ fontSize: "12px", fontFamily: "Inter, sans-serif" }}
          />
          <Area
            type="monotone"
            dataKey="score"
            name="Your Score"
            stroke="#1A56DB"
            strokeWidth={3}
            fillOpacity={1}
            fill="url(#scoreHistoryGradient)"
            activeDot={{ r: 6, stroke: "#1A56DB", strokeWidth: 2, fill: "#fff" }}
          />
          <Area
            type="monotone"
            dataKey="avgScore"
            name="Platform Average"
            stroke="#94A3B8"
            strokeWidth={2}
            strokeDasharray="4 4"
            fillOpacity={1}
            fill="url(#avgHistoryGradient)"
            activeDot={{ r: 4 }}
          />
          <Area
            type="monotone"
            dataKey="top10Percent"
            name="Top 10% Bracket"
            stroke="#7C3AED"
            strokeWidth={2}
            fill="none"
            activeDot={{ r: 4 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
