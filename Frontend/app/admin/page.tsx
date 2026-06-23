"use client";

import { useState, useEffect } from "react";
import {
  Wallet,
  Users,
  AlertOctagon,
  Award,
  ShieldCheck,
  CheckCircle,
  XCircle,
  HelpCircle,
  Coins,
  TrendingDown,
  Activity,
  Search,
  Filter
} from "lucide-react";

import Sidebar from "@/components/layout/Sidebar";
import StatCard from "@/components/ui/StatCard";
import DataTable from "@/components/ui/DataTable";
import ProgressBar from "@/components/ui/ProgressBar";
import KYCLevelBadge from "@/components/ui/KYCLevelBadge";
import RiskBadge from "@/components/ui/RiskBadge";
import {
  userProfile,
  adminStats,
  adminUserManagement as initialUsers,
  loanQueue as initialQueue,
  fraudAlerts
} from "@/lib/mock-data";
import { useAdmin } from "@/hooks/useApi";
import { useWallet } from "@/context/WalletContext";

export default function AdminPanelPage() {
  const { walletAddress } = useWallet();
  const { stats, users, queue, fraud, loading } = useAdmin();

  const [usersList, setUsersList] = useState<any[]>(initialUsers);
  const [loanQueue, setLoanQueue] = useState<any[]>(initialQueue);
  const [searchQuery, setSearchQuery] = useState("");
  const [kycFilter, setKycFilter] = useState("all");
  const [activeGuaranteesCount, setActiveGuaranteesCount] = useState(0);

  // Sync users and queue from API if available
  useEffect(() => {
    if (users && users.length > 0) {
      const mapped = users.map((u: any, idx: number) => ({
        id: u.walletAddress || `U-DB-${idx}`,
        name: u.name || "Unknown User",
        score: u.trustScore !== undefined ? u.trustScore : 500,
        kycLevel: u.kycLevel !== undefined ? u.kycLevel : 0,
        activeLoans: u.activeLoansCount !== undefined ? u.activeLoansCount : 0,
        debt: u.totalActiveDebt ? `₹${u.totalActiveDebt.toLocaleString()}` : "—",
        riskFlag: u.aiRiskLevel !== "Low" ? `${u.aiRiskLevel} Default` : "None",
        status: u.aiRiskLevel === "High" ? "Flagged" : "Active"
      }));
      setUsersList(mapped);
    } else {
      setUsersList(initialUsers);
    }
  }, [users]);

  useEffect(() => {
    if (queue && queue.length > 0) {
      setLoanQueue(queue);
    } else {
      setLoanQueue(initialQueue);
    }
  }, [queue]);

  const currentStats = stats || adminStats;
  const currentFraudAlerts = (fraud && fraud.length > 0) ? fraud : fraudAlerts;
  const currentWallet = walletAddress || userProfile.walletAddress;


  // Sync active guarantees count
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem("locked_guarantees");
      if (stored) {
        const list = JSON.parse(stored);
        const activeList = list.filter((g: any) => g.status === "Active Loan");
        setActiveGuaranteesCount(activeList.length);
      }
    }
  }, []);

  // Handle Search and KYC Filter
  const filteredUsers = usersList.filter((u) => {
    const matchesSearch = u.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesKyc = kycFilter === "all" || u.kycLevel === Number(kycFilter);
    return matchesSearch && matchesKyc;
  });

  // Handle Loan Approval Queue Actions
  const handleApproveLoan = (id: string, name: string, amount: string) => {
    setLoanQueue(loanQueue.filter((item) => item.id !== id));
    alert(`Loan approved for ${name} (${amount}). Disbursement transaction published to Stellar ledger.`);
  };

  const handleRejectLoan = (id: string, name: string) => {
    setLoanQueue(loanQueue.filter((item) => item.id !== id));
    alert(`Loan request rejected for ${name}. Notification sent on-chain.`);
  };

  // Handle User Freeze Action
  const handleFreezeUser = (id: string, name: string) => {
    setUsersList(
      usersList.map((u) => (u.id === id ? { ...u, status: u.status === "Frozen" ? "Active" : "Frozen" } : u))
    );
    alert(`Status updated for ${name}. Stellar pull authorization updated.`);
  };

  const truncateWallet = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <div className="min-h-screen bg-background flex font-sans">
      <Sidebar />

      <main className="flex-1 pl-16 xl:pl-60 min-h-screen flex flex-col transition-all duration-300">
        
        {/* Top Header Bar */}
        <header className="h-16 bg-white border-b border-borderCustom px-6 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-text-primary">Admin Backoffice Panel</span>
            <span className="text-xs text-text-muted hidden sm:inline-block">· System metrics and compliance queue</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 px-3 py-1.5 border border-borderCustom bg-slate-50 rounded-xl font-mono text-xs text-text-secondary select-none">
              <Wallet className="w-3.5 h-3.5 text-text-muted" />
              <span>{truncateWallet(currentWallet)}</span>
            </div>
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-primary to-accent text-white flex items-center justify-center font-mono text-sm font-semibold">
              AS
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-6 md:p-8 space-y-8 max-w-7xl w-full mx-auto">
          
          {activeGuaranteesCount > 0 && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3 text-xs text-warning font-semibold leading-relaxed animate-shake shadow-sm">
              <AlertOctagon className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-text-primary">Active Obligations Lock Warning</p>
                <p className="mt-0.5">You have {activeGuaranteesCount} active guarantee(s) locked. Resolve them before making account configuration or profile changes.</p>
              </div>
            </div>
          )}
          
          {/* Top 5 Stat Cards */}
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
            <StatCard title="Total Users" value={currentStats.totalUsers.toLocaleString()} icon={Users} />
            <StatCard title="Active Loans" value={currentStats.activeLoans.toLocaleString()} icon={Activity} />
            <StatCard title="Pool Liquidity" value={`$${(currentStats.poolLiquidity / 1000000).toFixed(1)}M`} icon={Coins} />
            <StatCard title="Default Rate" value={`${currentStats.defaultRate}%`} badgeText="Very Low" badgeType="success" icon={TrendingDown} />
            <StatCard title="Flagged Walled IDs" value={currentStats.flaggedAccounts} badgeText="Action Required" badgeType="danger" icon={AlertOctagon} />
          </section>

          {/* User Management Section */}
          <section className="bg-white border border-cardBorder rounded-xl p-6 shadow-sm space-y-6">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-bold text-text-primary">User Management</h3>
                <p className="text-xs text-text-muted mt-0.5">Link analysis, scores auditing, and wallet enforcement controls.</p>
              </div>

              {/* Filters / Search */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                  <input
                    type="text"
                    placeholder="Search user name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs bg-white text-text-secondary focus:outline-none focus:ring-2 focus:ring-primary/20 w-44"
                  />
                </div>
                <div className="flex items-center gap-2 border border-borderCustom rounded-xl px-3 py-2 bg-slate-50 text-text-secondary text-xs font-semibold">
                  <Filter className="w-3.5 h-3.5 text-text-muted" />
                  <select
                    value={kycFilter}
                    onChange={(e) => setKycFilter(e.target.value)}
                    className="bg-transparent focus:outline-none cursor-pointer"
                  >
                    <option value="all">All KYC levels</option>
                    <option value="1">Level 1 Only</option>
                    <option value="2">Level 2 Only</option>
                    <option value="3">Level 3 Only</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Table */}
            <DataTable headers={["User ID / Name", "Trust Score", "KYC Level", "Active Loans", "Outstanding Debt", "Risk Flag", "Status", "Action"]}>
              {filteredUsers.map((user) => (
                <tr key={user.id} className="border-b border-borderCustom hover:bg-slate-50/50 transition-colors">
                  <td className="py-4 px-4 text-xs">
                    <p className="font-bold text-text-primary">{user.name}</p>
                    <p className="font-mono text-text-muted mt-0.5">{user.id}</p>
                  </td>
                  <td className="py-4 px-4 text-sm font-mono font-bold text-text-primary">
                    {user.score}
                  </td>
                  <td className="py-4 px-4">
                    <KYCLevelBadge level={user.kycLevel} />
                  </td>
                  <td className="py-4 px-4 text-xs font-semibold text-text-secondary">
                    {user.activeLoans}
                  </td>
                  <td className="py-4 px-4 text-sm font-mono text-text-secondary">
                    {user.debt}
                  </td>
                  <td className="py-4 px-4">
                    {user.riskFlag !== "None" ? (
                      <span className="inline-flex px-2 py-0.5 bg-red-50 text-danger border border-red-100 text-[10px] font-bold rounded-full">
                        {user.riskFlag}
                      </span>
                    ) : (
                      <span className="text-xs text-text-muted">—</span>
                    )}
                  </td>
                  <td className="py-4 px-4">
                    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                      user.status === "Active"
                        ? "bg-emerald-50 border-emerald-100 text-success"
                        : user.status === "Flagged"
                        ? "bg-amber-50 border-amber-100 text-warning"
                        : "bg-red-50 border-red-100 text-danger"
                    }`}>
                      {user.status}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-right space-x-2">
                    <button
                      onClick={() => handleFreezeUser(user.id, user.name)}
                      className={`px-2.5 py-1.5 text-[10px] font-bold rounded-lg border transition-colors ${
                        user.status === "Frozen"
                          ? "bg-emerald-50 text-success border-emerald-250 hover:bg-emerald-100/55"
                          : "bg-red-50 text-danger border-red-250 hover:bg-red-100/55"
                      }`}
                    >
                      {user.status === "Frozen" ? "Unfreeze" : "Freeze"}
                    </button>
                  </td>
                </tr>
              ))}
            </DataTable>

          </section>

          {/* Risk Monitoring & Queue split */}
          <section className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Real-time Flagged Alerts & Platform Metrics (Left) */}
            <div className="lg:col-span-5 space-y-6">
              
              {/* Platform Health Metrics */}
              <div className="bg-white border border-cardBorder rounded-xl p-5 shadow-sm space-y-4">
                <span className="text-xs font-bold text-text-primary uppercase tracking-wider block">Platform Health Metrics</span>
                
                <ProgressBar
                  value={currentStats.platformHealth.poolUtilization}
                  max={100}
                  label="Pool Utilization Rate"
                  subLabel={`${currentStats.platformHealth.poolUtilization}%`}
                />

                <div className="grid grid-cols-2 gap-4 text-xs font-semibold text-text-secondary">
                  <div className="p-3.5 bg-slate-50 border border-borderCustom rounded-xl">
                    <p className="text-[10px] text-text-muted uppercase font-bold">Insurance coverage</p>
                    <p className="text-sm font-mono font-bold text-text-primary mt-1">
                      ${currentStats.platformHealth.insuranceCoverage.toLocaleString()}
                    </p>
                  </div>
                  <div className="p-3.5 bg-slate-50 border border-borderCustom rounded-xl">
                    <p className="text-[10px] text-text-muted uppercase font-bold">Avg. System Score</p>
                    <p className="text-sm font-mono font-bold text-text-primary mt-1">
                      {currentStats.platformHealth.avgTrustScore} Score
                    </p>
                  </div>
                </div>
              </div>

              {/* Real-time alerts queue */}
              <div className="space-y-4">
                <span className="text-xs font-bold text-text-primary uppercase tracking-wider block">AI Fraud Alerts</span>
                {currentFraudAlerts.map((alt) => (
                  <div key={alt.id} className="bg-red-50 border border-red-100 rounded-xl p-4.5 flex gap-3 text-xs leading-normal">
                    <AlertOctagon className="w-5 h-5 text-danger flex-shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p className="font-bold text-danger">{alt.type}</p>
                      <p className="text-text-secondary text-[11px]">{alt.detail}</p>
                      <div className="flex gap-4 pt-2 text-[10px] font-bold uppercase tracking-wider">
                        <button className="text-danger hover:text-red-750 font-bold">Investigate ({alt.score})</button>
                        <button className="text-text-secondary hover:text-text-primary font-bold">Dismiss</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

            </div>

            {/* Loan Approval Queue (Right) */}
            <div className="lg:col-span-7 space-y-4">
              <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider">Loan Approval Queue</h3>
              
              <DataTable headers={["User", "Amount", "Trust Score", "AI Risk", "Action"]}>
                {loanQueue.map((item) => (
                  <tr key={item.id} className="border-b border-borderCustom hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 px-4 text-xs font-semibold text-text-primary">
                      {item.name}
                      {item.autoApproved && (
                        <span className="block mt-1 w-fit px-1.5 py-0.5 bg-emerald-50 border border-emerald-100 text-success text-[8px] uppercase tracking-wider font-bold rounded-lg">
                          Auto-approved
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-xs font-mono font-semibold text-text-secondary">
                      {item.amount}
                    </td>
                    <td className="py-3 px-4 text-sm font-mono font-bold text-text-primary">
                      {item.score}
                    </td>
                    <td className="py-3 px-4">
                      <RiskBadge risk={item.aiRisk} />
                    </td>
                    <td className="py-3 px-4 text-right space-x-2 whitespace-nowrap">
                      <button
                        onClick={() => handleApproveLoan(item.id, item.name, item.amount)}
                        className="px-2 py-1 bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white text-[10px] font-bold rounded-lg shadow-sm"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleRejectLoan(item.id, item.name)}
                        className="px-2 py-1 border border-borderCustom text-text-secondary hover:bg-slate-50 text-[10px] font-bold rounded-lg"
                      >
                        Reject
                      </button>
                    </td>
                  </tr>
                ))}
                {loanQueue.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-xs text-text-muted font-medium">
                      All loan requests processed! Queue is clean.
                    </td>
                  </tr>
                )}
              </DataTable>
            </div>

          </section>

        </div>

      </main>
    </div>
  );
}
