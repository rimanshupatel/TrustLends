"use client";

import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Wallet,
  TrendingUp,
  Award,
  Users,
  ShieldCheck,
  Coins,
  ChevronRight,
  Info,
  Calendar,
  AlertCircle
} from "lucide-react";

import Sidebar from "@/components/layout/Sidebar";
import StatCard from "@/components/ui/StatCard";
import DataTable from "@/components/ui/DataTable";
import ProgressBar from "@/components/ui/ProgressBar";
import PoolLiquidityChart from "@/components/charts/PoolLiquidityChart";
import LoanDistributionChart from "@/components/charts/LoanDistributionChart";
import Tooltip from "@/components/ui/Tooltip";
import { userProfile, lendMarket } from "@/lib/mock-data";
import { useWallet } from "@/context/WalletContext";
import { useUser, useLendPositions } from "@/hooks/useApi";
import { callCreateEscrow } from "@/lib/contract";
import { sendXLMPayment } from "@/lib/stellar";
import { usePoolStats } from "@/lib/usePoolStats";
export default function LendPage() {
  const { walletAddress } = useWallet();
  const { user: liveUser } = useUser(walletAddress);
  const { positions: livePositions, createPosition, withdrawPosition } = useLendPositions(walletAddress);
  const { poolBalance, averageApy, activeBorrowers, loading: statsLoading } = usePoolStats();
  const [txStatus, setTxStatus] = useState<"idle" | "pending" | "success" | "failed">("idle");
  const [txHash, setTxHash] = useState<string | null>(null);
  const [depositAmount, setDepositAmount] = useState(2500);
  const [lockPeriod, setLockPeriod] = useState<"Flexible" | "3M" | "6M" | "12M">("6M");
  const [positions, setPositions] = useState<any[]>(lendMarket.activePositions);

  useEffect(() => {
    if (livePositions !== undefined && livePositions.length > 0) {
      setPositions(livePositions);
    }
  }, [livePositions]);

  // Dynamic calculations for deposit
  const getApyByLock = () => {
    switch (lockPeriod) {
      case "Flexible": return 12;
      case "3M": return 14;
      case "6M": return 16;
      case "12M": return 18;
    }
  };

  const apy = getApyByLock();
  const estimatedMonthlyEarnings = (depositAmount * (apy / 100)) / 12;
  const estimatedAnnualEarnings = depositAmount * (apy / 100);

  // Handle deposit simulation
  const handleDepositSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!walletAddress) {
      alert("Please connect your wallet first.");
      return;
    }
    if (depositAmount <= 0) return;

    setTxStatus("pending");
    try {
      const xlmAmount = (depositAmount / 7).toFixed(7);

      // Send XLM to pool treasury + register escrow
      const hash = await callCreateEscrow(
        walletAddress,
        import.meta.env.VITE_POOL_TREASURY_ADDRESS,
        xlmAmount
      );

      setTxHash(hash);
      setTxStatus("success");

      if (liveUser) {
        await createPosition({
          amount: depositAmount,
          lockPeriod: lockPeriod === "Flexible" ? "Flexible" : `${lockPeriod.replace("M", "")} Months`,
          apy
        });
      }
    } catch (err: any) {
      setTxStatus("failed");
      console.error(err);
    }
  };

  // Withdraw simulation
  const handleWithdraw = (id: string, amount: string) => {
    if (confirm(`Are you sure you want to withdraw your position of ${amount}?`)) {
      if (liveUser) {
        withdrawPosition(id).then(() => {
          alert(`Withdrawn ${amount} from pool.`);
        }).catch((err) => {
          alert("Withdrawal failed: " + err.message);
        });
      } else {
        setPositions(positions.filter(pos => pos.id !== id));
        alert(`Withdrawn ${amount} from pool.`);
      }
    }
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
            <span className="text-lg font-bold text-text-primary">Lend Marketplace</span>
            <span className="text-xs text-text-muted hidden sm:inline-block">· Supply liquidity & earn AI-managed yield</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 px-3 py-1.5 border border-borderCustom bg-slate-50 rounded-xl font-mono text-xs text-text-secondary select-none">
              <Wallet className="w-3.5 h-3.5 text-text-muted" />
              <span>{truncateWallet(walletAddress || userProfile.walletAddress)}</span>
            </div>
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-primary to-accent text-white flex items-center justify-center font-mono text-sm font-semibold">
              AS
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-6 md:p-8 space-y-8 max-w-7xl w-full mx-auto">

          {/* Top Stats Row */}
          <section className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <StatCard
              title="Total Pool Liquidity"
              value={statsLoading ? "Loading..." : poolBalance || "0.0000 XLM"}
              subtext="Accumulated Stellar assets"
              icon={Coins}
            />
            <StatCard
              title="Average Platform APY"
              value={statsLoading ? "Loading..." : `${averageApy}%`}
              subtext="Aggregated across risk tiers"
              icon={TrendingUp}
            />
            <StatCard
              title="Active Borrowers"
              value={statsLoading ? "Loading..." : activeBorrowers ?? 0}
              subtext="98.2% healthy repayment record"
              icon={Users}
            />
          </section>

          {/* Deposit & Pool Stats Split */}
          <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

            {/* Deposit Panel (Left) */}
            <div className="lg:col-span-6 bg-white border border-cardBorder rounded-xl p-6 shadow-sm space-y-6">
              <div>
                <h2 className="text-base font-bold text-text-primary">Deposit to Lending Pool</h2>
                <p className="text-xs text-text-muted mt-0.5">Supply USD-backed assets to earn yield distributed across verified credits.</p>
              </div>

              <form onSubmit={handleDepositSubmit} className="space-y-5">

                {/* Deposit Amount */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-text-secondary" htmlFor="deposit-amount-input">Amount to Supply ($)</label>
                  <input
                    id="deposit-amount-input"
                    type="number"
                    min="10"
                    step="10"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(Number(e.target.value))}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-mono focus:ring-2 focus:ring-primary/20 focus:border-primary focus:outline-none"
                    placeholder="Enter deposit amount"
                  />
                </div>

                {/* Lock Period Selector */}
                <div className="space-y-1.5">
                  <span className="text-xs font-semibold text-text-secondary block">Lock Duration</span>
                  <div className="grid grid-cols-4 gap-2.5">
                    {(["Flexible", "3M", "6M", "12M"] as const).map((period) => (
                      <button
                        type="button"
                        key={period}
                        onClick={() => setLockPeriod(period)}
                        className={`py-2.5 text-xs font-semibold rounded-xl border transition-all ${lockPeriod === period
                          ? "bg-primary border-primary text-white shadow-sm"
                          : "bg-white border-borderCustom text-text-secondary hover:bg-slate-50"
                          }`}
                      >
                        {period === "Flexible" ? "Flexible" : period}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Earnings Calculation panel */}
                <div className="p-4 bg-slate-50 border border-borderCustom rounded-xl space-y-3 font-sans text-xs">
                  <div className="flex justify-between items-center text-text-secondary">
                    <span>Lending APY Lock:</span>
                    <span className="font-mono text-text-primary font-bold text-sm text-primary">{apy}%</span>
                  </div>
                  <div className="flex justify-between items-center text-text-secondary">
                    <span>Est. Monthly Income:</span>
                    <span className="font-mono text-text-primary font-bold text-success">${estimatedMonthlyEarnings.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center text-text-secondary">
                    <span>Est. Annual Income:</span>
                    <span className="font-mono text-text-primary font-bold text-success">${estimatedAnnualEarnings.toFixed(2)}</span>
                  </div>
                </div>
                {txStatus === "pending" && (
                  <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl text-xs text-warning font-medium flex items-center gap-2">
                    <span className="animate-spin">⏳</span> Depositing to pool on Stellar...
                  </div>
                )}
                {txStatus === "success" && txHash && (
                  <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-xs text-success font-medium">
                    ✅ Deposit confirmed!{" "}
                    <a href={`https://stellar.expert/explorer/testnet/tx/${txHash}`} target="_blank" className="underline font-bold">View tx ↗</a>
                  </div>
                )}
                {txStatus === "failed" && (
                  <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-xs text-danger font-medium">
                    ❌ Deposit failed. Please try again.
                  </div>
                )}
                {/* Action button */}
                <button
                  type="submit"
                  disabled={depositAmount <= 0}
                  className="w-full py-3.5 bg-gradient-to-r from-primary to-accent hover:opacity-90 disabled:opacity-50 text-white font-bold rounded-xl shadow-md transition-all text-xs uppercase tracking-wider"
                >
                  Deposit Now
                </button>

                <div className="p-2.5 bg-emerald-50 border border-emerald-100 rounded-lg text-[10px] text-success leading-normal flex items-start gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                  <span>Your assets are spread programmatically. 15% is allocated to the platform insurance pool to cushion defaults.</span>
                </div>
              </form>
            </div>

            {/* Pool Stats Panel (Right) */}
            <div className="lg:col-span-6 bg-white border border-cardBorder rounded-xl p-6 shadow-sm space-y-6">
              <div>
                <h2 className="text-base font-bold text-text-primary">Pool Metrics</h2>
                <p className="text-xs text-text-muted mt-0.5">Asset composition and utilization vectors.</p>
              </div>

              {/* Composition Chart */}
              <div className="bg-slate-50/50 rounded-xl p-4 border border-borderCustom">
                <span className="text-xs font-bold text-text-primary block mb-4">Risk Composition</span>
                <PoolLiquidityChart />
              </div>

              {/* Detail Metrics */}
              <div className="space-y-4 pt-2">
                <ProgressBar
                  value={lendMarket.utilizationRate}
                  max={100}
                  label="Pool Utilization Rate"
                  subLabel={`${lendMarket.utilizationRate}%`}
                />

                <div className="grid grid-cols-2 gap-4 text-xs font-semibold text-text-secondary">
                  <div className="p-3 bg-slate-50 border border-borderCustom rounded-xl">
                    <p className="text-[10px] text-text-muted uppercase font-bold">Insurance Coverage</p>
                    <p className="text-sm font-mono font-bold text-text-primary mt-1">15% ($127,080)</p>
                  </div>
                  <div className="p-3 bg-slate-50 border border-borderCustom rounded-xl">
                    <p className="text-[10px] text-text-muted uppercase font-bold">Avg. Borrower Score</p>
                    <p className="text-sm font-mono font-bold text-text-primary mt-1">724 Score</p>
                  </div>
                </div>
              </div>

            </div>

          </section>

          {/* Active Positions Table */}
          <section className="space-y-4">
            <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider">Active Positions</h3>
            <DataTable headers={["Position ID", "Amount Supplied", "Lock Period", "APY", "Earned Interest", "Status", "Action"]}>
              {positions.map((pos) => (
                <tr key={pos.id} className="border-b border-borderCustom hover:bg-slate-50/50">
                  <td className="py-4 px-4 text-sm font-mono font-bold text-text-primary">{pos.id}</td>
                  <td className="py-4 px-4 text-sm font-mono text-text-secondary">{pos.amount}</td>
                  <td className="py-4 px-4 text-xs font-semibold text-text-primary">{pos.lockPeriod}</td>
                  <td className="py-4 px-4 text-sm font-mono text-text-secondary">{pos.apy}</td>
                  <td className="py-4 px-4 text-sm font-mono text-success font-bold">{pos.earned}</td>
                  <td className="py-4 px-4">
                    <span className="inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 border border-emerald-100 text-success">
                      {pos.status}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-right">
                    <button
                      onClick={() => handleWithdraw(pos.id, pos.amount)}
                      className="px-3 py-1.5 border border-red-200 text-danger hover:bg-red-50 text-xs font-bold rounded-lg transition-colors"
                    >
                      Withdraw
                    </button>
                  </td>
                </tr>
              ))}
            </DataTable>
          </section>

          {/* Risk Distribution Chart Section */}
          <section className="bg-white border border-cardBorder rounded-xl p-6 shadow-sm space-y-4">
            <div>
              <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider">Risk Distribution</h3>
              <p className="text-xs text-text-muted mt-0.5">Asset allocation by credit score brackets.</p>
            </div>
            <LoanDistributionChart />
          </section>

        </div>

      </main>
    </div>
  );
}
