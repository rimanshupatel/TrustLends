"use client";

import { useEffect, useState } from "react";
import {
  Wallet,
  Activity,
  AlertTriangle,
  BrainCircuit,
  Lightbulb,
  CheckCircle,
  HelpCircle,
  TrendingUp,
  Percent,
  ShieldCheck
} from "lucide-react";
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell
} from "recharts";

import { Link } from "react-router-dom";
import Sidebar from "@/components/layout/Sidebar";
import StatCard from "@/components/ui/StatCard";
import TrustHistoryChart from "@/components/charts/TrustHistoryChart";
import RiskHeatmap from "@/components/charts/RiskHeatmap";
import { userProfile } from "@/lib/mock-data";
import { useUser } from "@/hooks/useApi";
import { useWallet } from "@/context/WalletContext";


// Horizontal Bar Data
const purposeDefaultData = [
  { name: "Medical", rate: 0.4, color: "#059669" },
  { name: "Education", rate: 0.8, color: "#1A56DB" },
  { name: "Emergency", rate: 1.1, color: "#D97706" },
  { name: "Business", rate: 3.2, color: "#7C3AED" },
  { name: "Other", rate: 4.7, color: "#DC2626" },
];

export default function AnalyticsPage() {
  const { walletAddress } = useWallet();
  const { user } = useUser(walletAddress);
  const [mounted, setMounted] = useState(false);
  const [timeframe, setTimeframe] = useState<"1M" | "3M" | "6M" | "1Y">("6M");

  useEffect(() => {
    setMounted(true);
  }, []);

  const truncateWallet = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const currentUser = user || userProfile;
  const currentWallet = walletAddress || userProfile.walletAddress;

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Derive top card stats dynamically
  let defaultProb = "2.3%";
  let defaultBadge = "Very Low";
  let defaultBadgeType: "success" | "warning" | "danger" = "success";
  if (currentUser.aiRiskLevel === "Medium") {
    defaultProb = "12.5%";
    defaultBadge = "Medium";
    defaultBadgeType = "warning";
  } else if (currentUser.aiRiskLevel === "High") {
    defaultProb = "28.4%";
    defaultBadge = "High Risk";
    defaultBadgeType = "danger";
  }

  const limit = currentUser.creditLimit || 2000;
  const debt = currentUser.totalActiveDebt || 0;
  const utilization = limit > 0 ? ((debt / limit) * 100).toFixed(1) : "0.0";

  const score = currentUser.trustScore || 500;
  const predictedScore = Math.min(score + 15, 1000);

  // Dynamic Radar Chart Data
  const currentRadarData = [
    { subject: "On-chain", Arjun: Math.min(Math.round((currentUser.trustScore || 500) / 10), 100), Average: 70 },
    { subject: "Finance", Arjun: Math.min(Math.round(currentUser.repaymentRate || 100), 100), Average: 65 },
    { subject: "Social", Arjun: Math.min(Math.round(currentUser.socialTrustScore || 50), 100), Average: 55 },
    { subject: "KYC Level", Arjun: currentUser.kycLevel === 3 ? 100 : currentUser.kycLevel === 2 ? 75 : currentUser.kycLevel === 1 ? 50 : 20, Average: 50 },
    { subject: "AI Predict", Arjun: currentUser.aiRiskLevel === "Low" ? 91 : currentUser.aiRiskLevel === "Medium" ? 68 : 42, Average: 72 },
  ];


  return (
    <div className="min-h-screen bg-background flex font-sans">
      <Sidebar />

      <main className="flex-1 pl-16 xl:pl-60 min-h-screen flex flex-col transition-all duration-300">
        
        {/* Top Header Bar */}
        <header className="h-16 bg-white border-b border-borderCustom px-6 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-text-primary">Risk Analytics Dashboard</span>
            <span className="text-xs text-text-muted hidden sm:inline-block">· AI-powered credit profiling insights</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 px-3 py-1.5 border border-borderCustom bg-slate-50 rounded-xl font-mono text-xs text-text-secondary select-none">
              <Wallet className="w-3.5 h-3.5 text-text-muted" />
              <span>{truncateWallet(currentWallet)}</span>
            </div>
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-primary to-accent text-white flex items-center justify-center font-mono text-sm font-semibold">
              {getInitials(currentUser.name || "Arjun Sharma")}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-6 md:p-8 space-y-8 max-w-7xl w-full mx-auto">
          
          {/* Your Risk Profile (Top Cards) */}
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Default Probability"
              value={defaultProb}
              badgeText={defaultBadge}
              badgeType={defaultBadgeType}
              icon={Percent}
              subtext="AI assessment rank: Top 5%"
            />
            <StatCard
              title="Credit Utilization"
              value={`${utilization}%`}
              subtext={`₹${debt.toLocaleString()} active debt of ₹${limit.toLocaleString()} limit`}
              icon={Activity}
            />
            <StatCard
              title="Score Volatility"
              value="Low"
              badgeText="Stable"
              badgeType="success"
              icon={TrendingUp}
              subtext="Standard deviation: ±12 pts"
            />
            <StatCard
              title="Predicted Score (30 days)"
              value={predictedScore.toString()}
              badgeText="+15 points"
              badgeType="info"
              icon={BrainCircuit}
              subtext="AI projection based on cash flow"
            />
          </section>

          {/* Historical Trend with Timeline Toggles */}
          <section className="bg-white border border-cardBorder rounded-xl p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-bold text-text-primary">Credit Score Evolution</h3>
                <p className="text-xs text-text-muted mt-0.5">Comparing your score changes against platform trends.</p>
              </div>
              
              {/* Timeframe selector */}
              <div className="flex bg-slate-100 p-1 rounded-xl border border-borderCustom w-fit">
                {(["1M", "3M", "6M", "1Y"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTimeframe(t)}
                    className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                      timeframe === t
                        ? "bg-white text-text-primary shadow-sm"
                        : "text-text-secondary hover:text-text-primary"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
            
            <TrustHistoryChart />
          </section>

          {/* AI Recommendation Insights Panel */}
          <section className="space-y-4">
            <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider">AI Insights & Optimization</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Card 1 (blue) */}
              <div className="bg-blue-50/70 border border-blue-100 rounded-xl p-5 shadow-sm space-y-4 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-primary">
                    <CheckCircle className="w-5 h-5 flex-shrink-0" />
                    <span className="text-xs font-bold uppercase tracking-wider">Activity Increase</span>
                  </div>
                  <p className="text-xs text-text-secondary leading-relaxed font-semibold">
                    Your on-chain activity increased by 34% this month, contributing positive indicators to your scoring profiles.
                  </p>
                </div>
                <button className="w-full py-2 bg-white border border-blue-200 text-primary text-xs font-bold rounded-lg hover:bg-blue-100/50 transition-colors">
                  Check History (+12 pts)
                </button>
              </div>

              {/* Card 2 (amber) */}
              <div className="bg-amber-50/70 border border-amber-100 rounded-xl p-5 shadow-sm space-y-4 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-warning">
                    <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                    <span className="text-xs font-bold uppercase tracking-wider">Missed Warnings</span>
                  </div>
                  <p className="text-xs text-text-secondary leading-relaxed font-semibold">
                    We noticed 2 missed payment reminders on-chain. Set up automatic Stellar wallet pull approvals to protect your rating.
                  </p>
                </div>
                <button className="w-full py-2 bg-white border border-amber-200 text-warning text-xs font-bold rounded-lg hover:bg-amber-100/50 transition-colors">
                  Setup Auto-Pay
                </button>
              </div>

              {/* Card 3 (violet) */}
              <div className="bg-violet-50/70 border border-purple-100 rounded-xl p-5 shadow-sm space-y-4 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-accent">
                    <Lightbulb className="w-5 h-5 flex-shrink-0" />
                    <span className="text-xs font-bold uppercase tracking-wider">Credit Increase</span>
                  </div>
                  <p className="text-xs text-text-secondary leading-relaxed font-semibold">
                    Adding 1 more guarantor to your social trust circles could unlock ₹15,000 of additional credit limit.
                  </p>
                </div>
                <Link
                  to="/social"
                  className="w-full block text-center py-2 bg-white border border-purple-200 text-accent text-xs font-bold rounded-lg hover:bg-purple-100/50 transition-colors"
                >
                  Link Guarantor
                </Link>
              </div>

            </div>
          </section>

          {/* Radar Chart & Horizontal Bar Split */}
          <section className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Radar Score breakdown */}
            <div className="lg:col-span-6 bg-white border border-cardBorder rounded-xl p-6 shadow-sm space-y-6">
              <div>
                <h3 className="text-sm font-bold text-text-primary">Score Dimension Breakdown</h3>
                <p className="text-xs text-text-muted mt-0.5">Dimensions vs. platform benchmarks.</p>
              </div>

              {mounted ? (
                <div className="w-full h-64 flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={currentRadarData}>
                      <PolarGrid stroke="#F1F5F9" />
                      <PolarAngleAxis dataKey="subject" stroke="#94A3B8" fontSize={11} className="font-semibold" />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                      <Radar
                        name="Your Profile"
                        dataKey="Arjun"
                        stroke="#1A56DB"
                        fill="#1A56DB"
                        fillOpacity={0.25}
                      />
                      <Radar
                        name="Platform Average"
                        dataKey="Average"
                        stroke="#94A3B8"
                        fill="none"
                        strokeDasharray="4 4"
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-64 w-full bg-slate-50 border border-borderCustom rounded-xl animate-pulse" />
              )}

              <div className="flex justify-center gap-6 text-xs font-bold text-text-secondary border-t border-slate-50 pt-4">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-primary" />
                  <span>Your Dimensions</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-none border border-text-muted border-dashed" />
                  <span>Platform Average</span>
                </div>
              </div>
            </div>

            {/* Loan Purpose default rates (horizontal bar) */}
            <div className="lg:col-span-6 bg-white border border-cardBorder rounded-xl p-6 shadow-sm space-y-6">
              <div>
                <h3 className="text-sm font-bold text-text-primary">Default Rates by Purpose</h3>
                <p className="text-xs text-text-muted mt-0.5">Historical credit category risk analysis.</p>
              </div>

              {mounted ? (
                <div className="w-full h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      layout="vertical"
                      data={purposeDefaultData}
                      margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" horizontal={false} />
                      <XAxis
                        type="number"
                        stroke="#94A3B8"
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(val) => `${val}%`}
                        className="font-mono"
                      />
                      <YAxis
                        type="category"
                        dataKey="name"
                        stroke="#94A3B8"
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                        className="font-semibold"
                      />
                      <Tooltip formatter={(value) => [`${value}% Default Rate`, "Probability"]} />
                      <Bar dataKey="rate" radius={[0, 6, 6, 0]} maxBarSize={20}>
                        {purposeDefaultData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-64 w-full bg-slate-50 border border-borderCustom rounded-xl animate-pulse" />
              )}

              <div className="p-3.5 bg-blue-50/50 border border-blue-100 rounded-xl flex items-center gap-2 text-xs text-primary leading-normal">
                <HelpCircle className="w-4 h-4 flex-shrink-0" />
                <span>Notice: Medical and educational requests exhibit low historical default probability and receive interest rate subsidies.</span>
              </div>
            </div>

          </section>

          {/* Risk Heatmap component */}
          <section>
            <RiskHeatmap />
          </section>

        </div>

      </main>
    </div>
  );
}
