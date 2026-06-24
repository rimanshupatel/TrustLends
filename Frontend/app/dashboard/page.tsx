"use client";

import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  Bell,
  Wallet,
  ArrowRight,
  Shield,
  Users,
  BrainCircuit,
  TrendingUp,
  CreditCard,
  CheckCircle,
  AlertCircle,
  Send,
  DollarSign,
  Info
} from "lucide-react";

import Sidebar from "@/components/layout/Sidebar";
import StatCard from "@/components/ui/StatCard";
import LoanCard from "@/components/ui/LoanCard";
import TrustScoreRing from "@/components/ui/TrustScoreRing";
import ProgressBar from "@/components/ui/ProgressBar";
import DataTable from "@/components/ui/DataTable";
import TransactionRow from "@/components/ui/TransactionRow";
import Modal from "@/components/ui/Modal";
import Tooltip from "@/components/ui/Tooltip";
import KYCLevelBadge from "@/components/ui/KYCLevelBadge";
import NotificationBell from "@/components/ui/NotificationBell";
import SendTransaction from "@/components/ui/SendTransaction";
import GuarantorLockCard, { LockedGuaranteeItem } from "@/components/guarantor/GuarantorLockCard";
import { callReleaseFunds, callRepayLoan } from "@/lib/contract";
import { sendXLMPayment } from "@/lib/stellar";
import { useAuth } from "@/context/AuthContext";
import { useWallet } from "@/context/WalletContext";

const POOL_TREASURY = import.meta.env.VITE_POOL_TREASURY_ADDRESS || 'GDRNUHQGNSDT3FW6BLA7FRL4SXRSOUB2PV6HGPVSMML7FPLOECYWLDOA';

import {
  userProfile,
  scoreBreakdown,
  recentTransactions,
  endorsements
} from "@/lib/mock-data";
import { useUser, useTransactions, useActiveLoan } from "@/hooks/useApi";
import TrustHistoryChart from "@/components/charts/TrustHistoryChart";

const DEFAULT_LOCKED_GUARANTEES: LockedGuaranteeItem[] = [
  { id: "gur-mock-1", borrowerName: "Rahul Sharma", borrowerScore: 685, amount: "₹10,000", duration: "5 Months", status: "Active Loan", repaidProgress: 0 },
  { id: "gur-mock-2", borrowerName: "Amit Verma", borrowerScore: 710, amount: "₹5,000", duration: "0 Months (Repaid)", status: "Released", repaidProgress: 100 },
  { id: "gur-mock-3", borrowerName: "Vikram Sen", borrowerScore: 590, amount: "₹8,000", duration: "1 Month", status: "Active Loan (85% Repaid)", repaidProgress: 85 }
];

export default function Dashboard() {
  const { user } = useAuth();
  const {
    walletAddress,
    isConnected,
    xlmBalance,
    error,
    isFunding,
    fundAccount,
    isSendModalOpen,
    setSendModalOpen,
    connectWallet
  } = useWallet();

  const [activeLoanState, setActiveLoanState] = useState<any>(null);
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState(2400);
  const [txs, setTxs] = useState(recentTransactions);
  const [lockedGuarantees, setLockedGuarantees] = useState<LockedGuaranteeItem[]>([]);

  // Live Database Hooks
  const { user: liveUser, refreshUser } = useUser(walletAddress);
  const { transactions: liveTxs, refreshTransactions } = useTransactions(walletAddress);
  const { activeLoan: liveLoan, repayLoan: apiRepayLoan } = useActiveLoan(walletAddress);

  useEffect(() => {
    if (liveLoan !== undefined && liveLoan !== null) {
      setActiveLoanState({
        ...liveLoan,
        loanId: liveLoan._id
      });
    } else if (liveLoan === null) {
      setActiveLoanState(null); // clear mock data
    }
  }, [liveLoan]);

  // Sync locked guarantees from localStorage
  const syncGuarantees = useCallback(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem("locked_guarantees");
      if (stored) {
        setLockedGuarantees(JSON.parse(stored));
      } else {
        setLockedGuarantees(DEFAULT_LOCKED_GUARANTEES);
        localStorage.setItem("locked_guarantees", JSON.stringify(DEFAULT_LOCKED_GUARANTEES));
      }
    }
  }, []);

  useEffect(() => {
    syncGuarantees();
    window.addEventListener("guarantees_updated", syncGuarantees);
    return () => window.removeEventListener("guarantees_updated", syncGuarantees);
  }, [syncGuarantees]);

  const handleExitGuarantee = (id: string) => {
    const updated = lockedGuarantees.filter(g => g.id !== id);
    setLockedGuarantees(updated);
    localStorage.setItem("locked_guarantees", JSON.stringify(updated));
    // Trigger sidebar sync
    window.dispatchEvent(new Event("guarantees_updated"));
  };

  // Handle simulated loan payment
  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (paymentAmount <= 0) return;

    try {
      if (liveUser) {
        const xlmAmount = (paymentAmount / 7).toFixed(7);

        // 1. Stellar classic payment borrower → pool
        const txHash = await sendXLMPayment(
          walletAddress!,
          POOL_TREASURY,
          xlmAmount,
          'repayment'
        );

        // 2. DB update
        await apiRepayLoan({ amount: paymentAmount, txHash });

        // 3. Contract update — use numeric loan counter not MongoDB _id
        await callRepayLoan(
          walletAddress!,
          '1', // contract loan counter — track karo create_loan se
          xlmAmount
        );

        refreshTransactions();
        refreshUser();
        setIsPayModalOpen(false);
        alert(`✅ Repayment done! TX: ${txHash}`);

      } else {
        // Mock fallback
        const remaining = Math.max((activeLoanState?.remaining || 0) - paymentAmount, 0);
        const repaid = (activeLoanState?.repaid || 0) + paymentAmount;
        const progress = Math.round((repaid / (activeLoanState?.amount || 1)) * 100);
        setActiveLoanState({ ...activeLoanState, repaid, remaining, progress });
        setIsPayModalOpen(false);
        alert(`✅ Repayment of ₹${paymentAmount.toLocaleString()} completed!`);
      }
    } catch (err: any) {
      alert("Repayment failed: " + err.message);
    }
  };

  const truncateWallet = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const displayName = liveUser?.name || user?.name || userProfile.name;
  const displayWallet = walletAddress || userProfile.walletAddress;
  const displayTrustScore = liveUser ? liveUser.trustScore : userProfile.trustScore;
  const displayKycLevel = liveUser ? liveUser.kycLevel : userProfile.kycLevel;
  const displayCreditLimit = liveUser ? liveUser.creditLimit : userProfile.creditLimit;
  const displayActiveDebt = liveUser?.totalActiveDebt ?? 0;
  const displayNextPaymentAmount = liveUser ? liveUser.nextPaymentAmount : userProfile.nextPaymentAmount;
  const displayNextPaymentDate = liveUser ? liveUser.nextPaymentDate : userProfile.nextPaymentDate;

  const liveScoreBreakdown = liveUser ? [
    { name: "On-chain Data", score: 92, max: 100 },
    { name: "Financial Behavior", score: Math.round(liveUser.repaymentRate), max: 100 },
    { name: "Social Trust", score: liveUser.socialTrustScore, max: 100 },
    { name: "KYC Level", score: liveUser.kycLevel * 40, max: 100 },
    { name: "AI Prediction", score: liveUser.aiRiskLevel === 'Low' ? 91 : liveUser.aiRiskLevel === 'Medium' ? 65 : 35, max: 100 },
  ] : scoreBreakdown;

  const progressPercent = displayKycLevel === 1 ? 50 : displayKycLevel === 2 ? 75 : 100;
  const progressText = displayKycLevel === 3 ? "Fully Verified" : `Progress to Level ${displayKycLevel + 1}`;

  const txsToDisplay = liveTxs && liveTxs.length > 0 ? liveTxs : txs;

  // Determine urgency color for Next Payment (due Nov 28, 2025)
  // Relative to simulated date Nov 23, 2025: 5 days away. So it is Red!
  const getNextPaymentUrgency = () => {
    // Red if <= 7 days, Amber if <= 14 days, Green otherwise
    return "danger"; // Nov 28 is 5 days after Nov 23
  };

  return (
    <div className="min-h-screen bg-background flex font-sans">
      <Sidebar />

      {/* Main Content Area */}
      <main className="flex-1 pl-16 xl:pl-60 min-h-screen flex flex-col transition-all duration-300">

        {/* Top Header Bar */}
        <header className="h-16 bg-white border-b border-borderCustom px-6 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-text-primary">Good morning, {displayName.split(" ")[0]} 👋</span>
            <span className="text-xs text-text-muted hidden sm:inline-block">· Nov 23, 2025</span>
          </div>

          <div className="flex items-center gap-4">
            {/* Custom Warning Notification Bell */}
            <NotificationBell />

            {/* Wallet Info Chip */}
            {isConnected && walletAddress ? (
              <div className="flex items-center gap-1.5 px-3 py-1.5 border border-emerald-250 bg-emerald-50 text-success rounded-xl font-mono text-xs font-semibold select-none shadow-sm">
                <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
                <span>{truncateWallet(walletAddress)}</span>
              </div>
            ) : (
              <button
                onClick={connectWallet}
                className="flex items-center gap-1.5 px-3 py-1.5 border border-red-200 bg-red-50 hover:bg-red-100 text-danger rounded-xl text-xs font-semibold shadow-sm transition-all"
              >
                <span className="w-2 h-2 rounded-full bg-danger animate-pulse" />
                <span>Connect</span>
              </button>
            )}

            {/* User Avatar */}
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-primary to-accent text-white flex items-center justify-center font-mono text-sm font-semibold shadow-sm">
              {displayName.slice(0, 2).toUpperCase()}
            </div>
          </div>
        </header>

        {/* Dashboard Content Container */}
        <div className="p-6 md:p-8 space-y-8 max-w-7xl w-full mx-auto">

          {/* Warning Banner if wallet disconnected */}
          {(!isConnected || !walletAddress) && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm animate-fade-in">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-danger flex-shrink-0" />
                <p className="text-xs text-danger font-medium">
                  Wallet Disconnected. Please connect your Stellar wallet to view active credits and make transactions.
                </p>
              </div>
              <button
                onClick={connectWallet}
                className="px-4 py-2 bg-danger hover:bg-danger/90 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-md flex-shrink-0"
              >
                <Wallet className="w-3.5 h-3.5" />
                <span>Connect Wallet</span>
              </button>
            </div>
          )}

          {/* Hero: Trust Score Section */}
          <section className="bg-gradient-to-br from-primary-light via-white to-white border border-cardBorder rounded-2xl p-6 shadow-sm flex flex-col lg:flex-row items-center justify-between gap-8 animate-fade-in">

            {/* Left: Trust Score Ring */}
            <div className="flex-shrink-0">
              <TrustScoreRing score={displayTrustScore} size={220} />
            </div>

            {/* Middle: Score Breakdown Bars */}
            <div className="flex-1 w-full max-w-md space-y-4">
              <h3 className="text-sm font-bold text-text-primary">Score Breakdown</h3>
              <div className="space-y-3">
                {liveScoreBreakdown.map((item, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-medium text-text-secondary">
                      <span>{item.name}</span>
                      <span className="font-mono">{item.score} / {item.max}</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${idx % 3 === 0
                          ? "bg-primary"
                          : idx % 3 === 1
                            ? "bg-accent"
                            : "bg-success"
                          }`}
                        style={{ width: `${(item.score / item.max) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Stacked Action Buttons */}
            <div className="flex flex-col gap-3 w-full lg:w-auto">
              <Link
                to="/borrow"
                className="w-full lg:w-48 py-3 bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white font-semibold rounded-xl text-center text-xs shadow-md transition-all flex items-center justify-center gap-1.5"
              >
                <span>Request Loan</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/social"
                className="w-full lg:w-48 py-3 bg-white border border-primary text-primary hover:bg-primary-light font-semibold rounded-xl text-center text-xs transition-all"
              >
                Improve Score
              </Link>
              <Link
                to="/analytics"
                className="w-full lg:w-48 py-2.5 bg-transparent text-text-secondary hover:bg-slate-50 font-semibold rounded-xl text-center text-xs transition-all"
              >
                View Full Report
              </Link>
            </div>

          </section>

          {/* Stat Cards Row */}
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">

            {/* Card 1 — Wallet Balance (PRIMARY - largest visual emphasis) */}
            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white border border-blue-700 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-200 flex flex-col justify-between h-[180px] group relative overflow-hidden">
              <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 w-24 h-24 bg-white/5 rounded-full blur-xl group-hover:scale-110 transition-transform duration-500" />
              <div className="flex items-center justify-between z-10">
                <span className="text-xs font-bold text-blue-100 uppercase tracking-widest">Wallet Balance</span>
                <div className="w-8.5 h-8.5 rounded-xl bg-white/10 flex items-center justify-center">
                  <Wallet className="w-4.5 h-4.5 text-blue-100" />
                </div>
              </div>
              <div className="space-y-1.5 z-10">
                {error === 'UNFUNDED_ACCOUNT' ? (
                  <div className="space-y-1">
                    <span className="font-mono text-xl font-bold block leading-none">Unfunded Account</span>
                    <button
                      onClick={fundAccount}
                      disabled={isFunding}
                      className="text-[10px] bg-white text-blue-700 px-2 py-1 rounded-md font-bold hover:bg-blue-50 transition-all uppercase tracking-wider inline-block disabled:opacity-50"
                    >
                      {isFunding ? "Funding..." : "Fund at Friendbot ⚡"}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-0.5">
                    <span className="font-mono text-2xl font-black tracking-tight block">
                      {isConnected && xlmBalance ? xlmBalance : "0.0000 XLM"}
                    </span>
                    <span className="text-[10.5px] text-blue-100 font-medium block">
                      Stellar Testnet · XLM
                    </span>
                  </div>
                )}
              </div>
              <div className="flex justify-between items-center z-10">
                <span className="text-[9px] text-blue-200 font-medium">Updates every 30s</span>
                {isConnected && (
                  <button
                    onClick={() => setSendModalOpen(true)}
                    className="px-3.5 py-1.5 bg-white text-blue-700 hover:bg-blue-50 font-bold rounded-lg text-[10px] uppercase tracking-wider flex items-center gap-1 shadow transition-all duration-150"
                  >
                    <Send className="w-3 h-3" />
                    <span>Send XLM</span>
                  </button>
                )}
              </div>
            </div>

            {/* Card 2 — Total Borrowed */}
            <div className="bg-white border border-cardBorder rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between h-[180px]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-text-secondary uppercase tracking-wider">Total Borrowed</span>
                <div className="w-8.5 h-8.5 rounded-xl bg-amber-50 border border-amber-100 text-warning flex items-center justify-center">
                  <DollarSign className="w-4.5 h-4.5" />
                </div>
              </div>
              <div className="space-y-2">
                <span className="font-mono text-2xl font-black text-text-primary tracking-tight block">₹{displayActiveDebt.toLocaleString()}</span>
                <div className="space-y-1">
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-warning rounded-full" style={{ width: `${activeLoanState ? activeLoanState.progress : 0}%` }} />
                  </div>
                  <div className="flex justify-between text-[10px] text-text-muted font-bold font-mono">
                    <span>{activeLoanState ? activeLoanState.progress : 0}% repaid</span>
                    <span>₹{(activeLoanState ? activeLoanState.remaining : 0).toLocaleString()} remaining</span>
                  </div>
                </div>
              </div>
              <div className="text-[10px] text-text-muted font-semibold">Amber theme indicator</div>
            </div>

            {/* Card 3 — Available Credit */}
            <div className="bg-white border border-cardBorder rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between h-[180px]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-text-secondary uppercase tracking-wider">Credit Available</span>
                <div className="w-8.5 h-8.5 rounded-xl bg-emerald-50 border border-emerald-100 text-success flex items-center justify-center">
                  <CreditCard className="w-4.5 h-4.5" />
                </div>
              </div>
              <div className="space-y-1">
                <span className="font-mono text-2xl font-black text-text-primary tracking-tight block">₹{displayCreditLimit.toLocaleString()}</span>
                <span className="text-[10px] text-success font-semibold px-2 py-0.5 rounded-full border border-emerald-100 bg-emerald-50 inline-block">
                  KYC Level {displayKycLevel}
                </span>
              </div>
              <div className="text-[10px] text-text-muted font-semibold flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5 text-success" />
                <span>Trust Score {displayTrustScore}</span>
              </div>
            </div>

            {/* Card 4 — Next Payment */}
            <div className="bg-white border border-cardBorder rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between h-[180px]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-text-secondary uppercase tracking-wider">Next Payment</span>
                <div className="w-8.5 h-8.5 rounded-xl bg-red-50 border border-red-100 text-danger flex items-center justify-center">
                  <AlertCircle className="w-4.5 h-4.5" />
                </div>
              </div>
              <div className="space-y-1">
                <span className="font-mono text-2xl font-black text-text-primary tracking-tight block">₹{displayNextPaymentAmount.toLocaleString()}</span>
                <span className="px-2 py-0.5 rounded-full bg-red-50 border border-red-100 text-danger text-[10px] font-bold inline-block">
                  Due {displayNextPaymentDate || "N/A"}
                </span>
              </div>
              <div className="text-[10px] text-danger font-bold uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-danger animate-pulse" />
                <span>Urgent: Due in 5 Days</span>
              </div>
            </div>

          </section>

          {/* Active Loan & Charts Split */}
          <section className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Active Loan Display */}
            <div className="lg:col-span-5 space-y-4">
              <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider">Active Loan</h3>
              {activeLoanState ? (
                <LoanCard loan={activeLoanState} onPay={() => setIsPayModalOpen(true)} />
              ) : (
                <div className="bg-white border border-cardBorder rounded-xl p-6 shadow-sm flex flex-col items-center justify-center text-center h-[280px]">
                  <div className="w-12 h-12 rounded-full bg-slate-50 border border-borderCustom flex items-center justify-center text-text-muted mb-3">
                    <Shield className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-bold text-text-primary">No Active Loan</h4>
                  <p className="text-xs text-text-muted mt-1 max-w-[240px]">
                    You do not have any active loans. Visit the Borrow page to request one.
                  </p>
                  <Link
                    to="/borrow"
                    className="mt-4 px-4 py-2 bg-gradient-to-r from-primary to-accent text-white text-xs font-bold rounded-lg shadow hover:opacity-90 transition-all font-semibold"
                  >
                    Request Loan
                  </Link>
                </div>
              )}
            </div>

            {/* Score History Chart */}
            <div className="lg:col-span-7 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider">Trust Score History</h3>
                <span className="text-xs text-success font-semibold bg-emerald-50 px-2.5 py-1 border border-emerald-100 rounded-lg">
                  +137 points (6 mos)
                </span>
              </div>
              <div className="bg-white border border-cardBorder rounded-xl p-6 shadow-sm">
                <TrustHistoryChart />
              </div>
            </div>
          </section>

          {/* Transactions & Sidebar Widgets Split */}
          <section className="grid grid-cols-1 lg:grid-cols-12 gap-8">

            {/* Recent Transactions Table */}
            <div className="lg:col-span-8 space-y-4">
              <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider">Recent Transactions</h3>
              <DataTable headers={["Type", "Amount", "Date", "Status", "Impact on Score"]}>
                {txsToDisplay.map((tx) => (
                  <TransactionRow key={tx.id} tx={tx} />
                ))}
              </DataTable>
            </div>

            {/* Sidebar Widgets Stacked */}
            <div className="lg:col-span-8 lg:order-2 xl:col-span-4 space-y-6">

              {/* Locked Guarantees Section */}
              <div className="bg-white border border-cardBorder rounded-xl p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-1.5">
                    <Shield className="w-4 h-4 text-primary" />
                    <span>Locked Guarantees</span>
                  </span>
                  <span className="text-[10px] text-text-muted font-bold font-mono">
                    {lockedGuarantees.length} Active
                  </span>
                </div>

                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                  {lockedGuarantees.length > 0 ? (
                    lockedGuarantees.map((guarantee) => (
                      <GuarantorLockCard
                        key={guarantee.id}
                        guarantee={guarantee}
                        onExitSuccess={handleExitGuarantee}
                      />
                    ))
                  ) : (
                    <div className="text-center py-6 text-text-muted text-[11px] font-medium border border-dashed border-slate-200 rounded-xl">
                      No active locked guarantees
                    </div>
                  )}
                </div>
              </div>

              {/* KYC Progress Widget */}
              <div className="bg-white border border-cardBorder rounded-xl p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-text-primary uppercase tracking-wider">KYC Level</span>
                  <KYCLevelBadge level={displayKycLevel} />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-text-secondary font-medium">
                    <span>{progressText}</span>
                    <span>{progressPercent}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-primary" style={{ width: `${progressPercent}%` }} />
                  </div>
                </div>
                <Link
                  to="/kyc"
                  className="block text-center py-2.5 border border-primary hover:bg-primary-light text-primary text-xs font-semibold rounded-xl transition-colors font-bold uppercase tracking-wider"
                >
                  Upgrade Profile →
                </Link>
              </div>

              {/* AI Insights Widget */}
              <div className="bg-violet-50/70 border border-purple-100 rounded-xl p-5 shadow-sm space-y-3 animate-pulse">
                <div className="flex items-center gap-2 text-accent">
                  <BrainCircuit className="w-5 h-5" />
                  <span className="text-xs font-bold uppercase tracking-wider">AI credit Insights</span>
                </div>
                <p className="text-xs text-text-secondary leading-relaxed font-medium">
                  &ldquo;Your positive repayment pattern suggests you qualify for a ₹10,000 credit limit increase.&rdquo;
                </p>
                <Link
                  to="/borrow"
                  className="inline-flex items-center gap-1 text-xs text-accent font-bold hover:text-primary transition-colors"
                >
                  <span>Apply for increase</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

            </div>
          </section>

        </div>

      </main>

      {/* Pay Modal */}
      <Modal isOpen={isPayModalOpen} onClose={() => setIsPayModalOpen(false)} title="Repay Active Loan">
        <form onSubmit={handlePaymentSubmit} className="space-y-4 font-sans">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-text-secondary">Outstanding Amount</label>
            <div className="px-4 py-3 bg-slate-50 border border-borderCustom rounded-xl font-mono text-base font-bold text-text-primary">
              ₹{(activeLoanState?.remaining || 0).toLocaleString()}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-text-secondary" htmlFor="amount-input">Payment Amount (₹)</label>
            <input
              id="amount-input"
              type="number"
              max={activeLoanState?.remaining || 0}
              min={1}
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(Math.min(Number(e.target.value), activeLoanState?.remaining || 0))}
              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-mono focus:ring-2 focus:ring-primary/20 focus:border-primary focus:outline-none"
            />
          </div>

          <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl text-xs text-primary leading-normal flex items-start gap-2">
            <Shield className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>Repayment executes a zero-knowledge signature proof. Funds are debited from your linked wallet directly on Stellar blockchain.</span>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsPayModalOpen(false)}
              className="flex-1 py-2.5 border border-borderCustom hover:bg-slate-50 text-text-secondary text-xs font-semibold rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white text-xs font-semibold rounded-xl shadow transition-all font-bold uppercase tracking-wider"
            >
              Confirm Repayment
            </button>
          </div>
        </form>
      </Modal>

      {/* Global Send Transaction Modal */}
      <SendTransaction isOpen={isSendModalOpen} onClose={() => setSendModalOpen(false)} />

    </div>
  );
}
