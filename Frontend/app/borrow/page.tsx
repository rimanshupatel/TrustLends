"use client";

import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Bell,
  Wallet,
  Shield,
  HelpCircle,
  Plus,
  X,
  Search,
  Check,
  CheckCircle,
  Clock,
  ChevronRight,
  TrendingDown
} from "lucide-react";

import Sidebar from "@/components/layout/Sidebar";
import KYCLevelBadge from "@/components/ui/KYCLevelBadge";
import DataTable from "@/components/ui/DataTable";
import Tooltip from "@/components/ui/Tooltip";
import { userProfile, loanHistory } from "@/lib/mock-data";
import GuarantorRequest from "@/components/guarantor/GuarantorRequest";
import { useWallet } from "@/context/WalletContext";
import { useUser, useActiveLoan, useTransactions } from "@/hooks/useApi";
import { callCreateEscrow, callReleaseFunds, callRefundFunds } from "@/lib/contract";
import { sendXLMPayment } from "@/lib/stellar";
export default function BorrowPage() {
  const { walletAddress } = useWallet();
  const { user: liveUser, refreshUser } = useUser(walletAddress);
  const { activeLoan: liveLoan, requestLoan: apiRequestLoan } = useActiveLoan(walletAddress);
  const { transactions: liveTxs, refreshTransactions } = useTransactions(walletAddress);
  const [txStatus, setTxStatus] = useState<"idle" | "pending" | "success" | "failed">("idle");
  const [txHash, setTxHash] = useState<string | null>(null);
  // Live form states
  const [loanAmount, setLoanAmount] = useState(15000);
  const [duration, setDuration] = useState(6); // 1, 3, 6, 12 months
  const [purpose, setPurpose] = useState("Medical");
  const [guarantorSearch, setGuarantorSearch] = useState("");
  const [selectedGuarantor, setSelectedGuarantor] = useState<string | null>(null);
  const [searchFocused, setSearchFocused] = useState(false);
  const [requestsList, setRequestsList] = useState<any[]>([]);

  // Mock list of possible guarantors
  const potentialGuarantors = [
    { name: "Rohan Das", wallet: "GB837A...F92B", score: 812 },
    { name: "Priya Patel", wallet: "GB771C...H28A", score: 790 },
    { name: "Neha Roy", wallet: "GB911E...K83B", score: 825 },
  ];

  // Filtered list
  const filteredGuarantors = potentialGuarantors.filter(g =>
    g.name.toLowerCase().includes(guarantorSearch.toLowerCase())
  );

  // Dynamic calculations
  // Base APY depends on the amount bracket
  const getBaseApy = () => {
    if (loanAmount <= 2000) return 10.0; // Starter
    if (loanAmount <= 20000) return 14.2; // Growth
    return 16.5; // Premium
  };

  const baseApy = getBaseApy();
  // If guarantor is added, discount interest rate by 1.5% APY
  const apyDiscount = selectedGuarantor ? 1.5 : 0;
  const netApy = Math.max(baseApy - apyDiscount, 8.5);

  const interestRateDecimal = netApy / 100;
  const interestAmount = loanAmount * interestRateDecimal * (duration / 12);
  const processingFee = Math.max(Math.round(loanAmount * 0.01), 50); // 1% or min 50
  const totalRepayable = Math.round(loanAmount + interestAmount + processingFee);
  const monthlyPayment = Math.round(totalRepayable / duration);

  const displayUserProfile = liveUser || userProfile;
  const displayTrustScore = displayUserProfile.trustScore;
  const displayCreditLimit = displayUserProfile.creditLimit;
  const displayKycLevel = displayUserProfile.kycLevel;
  const displayWalletAge = displayUserProfile.walletAge;
  const displayRepaymentRate = displayUserProfile.repaymentRate;

  // Score threshold check
  const trustScoreRequired = loanAmount <= 2000 ? 500 : loanAmount <= 20000 ? 650 : 800;
  const hasSufficientScore = displayTrustScore >= trustScoreRequired;
  const isWithinCreditLimit = loanAmount <= displayCreditLimit;

  // Handle request submission
  // Replace handleSubmit:
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!walletAddress) {
      alert("Please connect your wallet first.");
      return;
    }
    if (!isWithinCreditLimit) {
      alert(`Amount exceeds credit limit.`);
      return;
    }
    if (!hasSufficientScore) {
      alert(`Trust Score insufficient. Required: ${trustScoreRequired}`);
      return;
    }

    setTxStatus("pending");

    const POOL_TREASURY = import.meta.env.VITE_POOL_TREASURY_ADDRESS || 'GDRNUHQGNSDT3FW6BLA7FRL4SXRSOUB2PV6HGPVSMML7FPLOECYWLDOA';

    try {
      const xlmAmount = (loanAmount / 7).toFixed(7);

      // Step 1: Borrower sends small collateral/fee to pool as loan request signal
      const processingFeeXLM = (parseFloat(xlmAmount) * 0.01).toFixed(7);
      const paymentHash = await sendXLMPayment(
        walletAddress,
        POOL_TREASURY,
        processingFeeXLM,
        'loan-fee'
      );

      // Step 2: Register escrow on chain
      const escrowHash = await callCreateEscrow(
        walletAddress,
        POOL_TREASURY,
        xlmAmount
      );

      setTxHash(escrowHash);
      setTxStatus("success");
      alert(`✅ Loan fee payment successful!\nFee TX: ${paymentHash}\nEscrow Created: ${escrowHash}`);

      // Step 3: Save to DB
      if (liveUser) {
        await apiRequestLoan({
          amount: loanAmount,
          purpose,
          duration,
          interestRate: netApy,
          txHash: escrowHash
        });
        refreshUser();
        refreshTransactions();
      } else {
        const newRequest = {
          id: `LN-${Math.floor(1000 + Math.random() * 9000)}`,
          amount: `₹${loanAmount.toLocaleString()}`,
          purpose,
          rate: `${netApy.toFixed(1)}% APY`,
          status: "Approved ⚡",
          date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
          duration: `${duration} Months`,
        };
        setRequestsList([newRequest, ...requestsList]);
      }

    } catch (err: any) {
      setTxStatus("failed");
      console.error("Loan submit error:", err);
    }
  };

  const truncateWallet = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const liveLoanHistory = liveTxs ? liveTxs.filter((tx: any) => tx.type.toLowerCase().includes("loan")).map((tx: any) => ({
    id: tx.id,
    amount: tx.amount,
    purpose: tx.type,
    rate: "14.2% APY",
    status: tx.status === "Active" ? "Active" : "Repaid",
    date: tx.date,
    duration: "6 Months"
  })) : [];

  const historyToDisplay = liveLoanHistory.length > 0 ? liveLoanHistory : loanHistory;

  return (
    <div className="min-h-screen bg-background flex font-sans">
      <Sidebar />

      <main className="flex-1 pl-16 xl:pl-60 min-h-screen flex flex-col transition-all duration-300">

        {/* Top Header Bar */}
        <header className="h-16 bg-white border-b border-borderCustom px-6 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-text-primary">Borrow Capital</span>
            <span className="text-xs text-text-muted hidden sm:inline-block">· Request non-collateral assets</span>
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

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

            {/* Left side form */}
            <div className="lg:col-span-7 bg-white border border-cardBorder rounded-xl p-6 shadow-sm space-y-6">
              <div>
                <h2 className="text-base font-bold text-text-primary">Request a Loan</h2>
                <p className="text-xs text-text-muted mt-0.5">Configure your terms to generate a zero-knowledge borrow request.</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">

                {/* Amount Slider */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-text-secondary">Loan Amount (INR)</span>
                    <span className="font-mono text-xl font-bold text-primary">₹{loanAmount.toLocaleString()}</span>
                  </div>
                  <input
                    type="range"
                    min="500"
                    max="50000"
                    step="500"
                    value={loanAmount}
                    onChange={(e) => setLoanAmount(Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-primary border border-slate-200"
                  />
                  <div className="flex justify-between text-[10px] text-text-muted font-mono font-medium">
                    <span>₹500</span>
                    <span>Credit limit: ₹{displayCreditLimit.toLocaleString()}</span>
                    <span>₹50,000</span>
                  </div>
                  {!isWithinCreditLimit && (
                    <div className="p-2.5 bg-red-50 border border-red-100 rounded-lg text-[11px] text-danger leading-normal flex items-start gap-1.5">
                      <Shield className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                      <span>Warning: Amount exceeds your active credit limit. Upgrade your KYC level to unlock higher borrowing limits.</span>
                    </div>
                  )}
                </div>

                {/* Duration selectors */}
                <div className="space-y-2">
                  <span className="text-xs font-semibold text-text-secondary block">Duration</span>
                  <div className="grid grid-cols-4 gap-3">
                    {[1, 3, 6, 12].map((m) => (
                      <button
                        type="button"
                        key={m}
                        onClick={() => setDuration(m)}
                        className={`py-3 text-xs font-semibold rounded-xl border transition-all ${duration === m
                          ? "bg-primary border-primary text-white shadow-sm"
                          : "bg-white border-borderCustom text-text-secondary hover:bg-slate-50"
                          }`}
                      >
                        {m === 1 ? "1 Month" : `${m} Months`}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Purpose and Guarantor split */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">

                  {/* Purpose Selector */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-text-secondary block" htmlFor="purpose-select">Loan Purpose</label>
                    <select
                      id="purpose-select"
                      value={purpose}
                      onChange={(e) => setPurpose(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary focus:outline-none text-text-secondary font-medium"
                    >
                      <option value="Medical">Medical Emergency</option>
                      <option value="Education">Education Fees</option>
                      <option value="Business">Business Capital</option>
                      <option value="Emergency">Emergency Funds</option>
                      <option value="Other">Other Expenses</option>
                    </select>
                  </div>

                  {/* Guarantor input search */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-text-secondary block">
                      Social Guarantor Verification
                    </label>
                    <GuarantorRequest
                      onSuccess={(name, amount) => {
                        setSelectedGuarantor(name);
                      }}
                    />
                  </div>

                </div>

                {/* Live calculation panel */}
                <div className="p-5 bg-slate-50 border border-borderCustom rounded-xl space-y-4 font-sans text-xs">
                  <span className="font-bold text-text-primary uppercase tracking-wider block border-b border-slate-200 pb-2">
                    Live Calculation Preview
                  </span>

                  <div className="grid grid-cols-2 gap-y-3 gap-x-6 text-text-secondary font-medium">
                    <div className="flex items-center justify-between">
                      <span>Interest Rate:</span>
                      <span className="font-mono text-text-primary font-bold">{netApy.toFixed(1)}% APY</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Processing Fee (1%):</span>
                      <span className="font-mono text-text-primary font-bold">₹{processingFee}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Monthly Payment:</span>
                      <span className="font-mono text-text-primary font-bold">₹{monthlyPayment.toLocaleString()} / mo</span>
                    </div>
                    <div className="flex items-center justify-between col-span-2 pt-2 border-t border-dashed border-slate-200">
                      <span className="text-sm font-bold text-text-primary">Total Repayable:</span>
                      <span className="font-mono text-base font-extrabold text-primary">₹{totalRepayable.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-[10px] text-text-muted font-semibold">
                    <div className="flex items-center gap-1.5">
                      <CheckCircle className="w-3.5 h-3.5 text-success" />
                      <span>Required Score: {trustScoreRequired} (You: {displayTrustScore})</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <CheckCircle className="w-3.5 h-3.5 text-success" />
                      <span>AI Assessment: Low Risk</span>
                    </div>
                  </div>
                </div>
                {txStatus === "pending" && (
                  <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl text-xs text-warning font-medium flex items-center gap-2">
                    <span className="animate-spin">⏳</span> Processing on Stellar blockchain...
                  </div>
                )}
                {txStatus === "success" && txHash && (
                  <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-xs text-success font-medium">
                    ✅ Loan approved and disbursed!{" "}
                    <a href={`https://stellar.expert/explorer/testnet/tx/${txHash}`} target="_blank" className="underline font-bold">View tx ↗</a>
                  </div>
                )}
                {txStatus === "failed" && (
                  <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-xs text-danger font-medium">
                    ❌ Trust score too low or transaction failed. Loan rejected.
                  </div>
                )}
                {/* Submit button */}
                <button
                  type="submit"
                  disabled={!isWithinCreditLimit || !hasSufficientScore}
                  className="w-full py-4 bg-gradient-to-r from-primary to-accent hover:opacity-90 disabled:opacity-50 text-white font-bold rounded-xl shadow-md transition-all text-sm uppercase tracking-wider"
                >
                  Submit Loan Request
                </button>

                <p className="text-[10px] text-text-muted text-center leading-relaxed">
                  ⚡ Approved funds are locked in Stellar smart covenants and disbursed to your wallet in 60s.
                </p>

              </form>
            </div>

            {/* Right side check panel */}
            <div className="lg:col-span-5 bg-white border border-cardBorder rounded-xl p-6 shadow-sm space-y-6">

              <div className="text-center flex flex-col items-center pb-4 border-b border-borderCustom">
                <div className="relative w-32 h-32 flex items-center justify-center">
                  <svg className="absolute inset-0 w-full h-full transform -rotate-90">
                    <circle cx="64" cy="64" r="45" className="stroke-slate-100 fill-none" strokeWidth="8" />
                    <circle
                      cx="64"
                      cy="64"
                      r="45"
                      className="stroke-primary fill-none"
                      strokeWidth="8"
                      strokeDasharray="283"
                      strokeDashoffset={283 - (283 * displayTrustScore) / 1000}
                    />
                  </svg>
                  <span className="font-mono text-2xl font-black text-text-primary">{displayTrustScore}</span>
                </div>
                <span className="text-xs uppercase tracking-widest text-text-muted font-bold mt-2">Your Trust Score</span>
              </div>

              {/* Eligibility Checklist */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider">Eligibility Checklist</h3>

                <div className="space-y-3 text-xs text-text-secondary font-medium">

                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-success text-[10px]">✓</span>
                      <span>Trust Score (Threshold: {trustScoreRequired})</span>
                    </div>
                    <span className="font-mono font-bold text-text-primary">{displayTrustScore}</span>
                  </div>

                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-success text-[10px]">✓</span>
                      <span>KYC Level (Required: Level 1)</span>
                    </div>
                    <span className="font-mono font-bold text-text-primary">Level {displayKycLevel}</span>
                  </div>

                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-success text-[10px]">✓</span>
                      <span>Account Age (Required: &gt;1.0 yr)</span>
                    </div>
                    <span className="font-mono font-bold text-text-primary">{displayWalletAge}</span>
                  </div>

                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-success text-[10px]">✓</span>
                      <span>Repayment logs</span>
                    </div>
                    <span className="font-mono font-bold text-text-primary">{displayRepaymentRate}% Rate</span>
                  </div>

                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-success text-[10px]">✓</span>
                      <span>Zero defaults record</span>
                    </div>
                    <span className="font-bold text-success">Clean</span>
                  </div>

                </div>

                <div className="p-4 bg-slate-50 border border-borderCustom rounded-xl flex items-center justify-between text-xs">
                  <span className="font-semibold text-text-secondary">Max Borrow Capacity:</span>
                  <span className="font-mono font-extrabold text-primary">₹{displayCreditLimit.toLocaleString()}</span>
                </div>
              </div>

            </div>

          </div>

          {/* Loan History Table */}
          <section className="space-y-4">
            <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider">Loan History</h3>
            <DataTable headers={["Loan ID", "Amount", "Purpose", "Duration", "Interest Rate", "Date", "Status"]}>
              {requestsList.map((req, idx) => (
                <tr key={idx} className="border-b border-borderCustom hover:bg-slate-50/50">
                  <td className="py-4 px-4 text-sm font-mono font-bold text-text-primary">{req.id}</td>
                  <td className="py-4 px-4 text-sm font-mono text-text-secondary">{req.amount}</td>
                  <td className="py-4 px-4 text-sm font-semibold text-text-primary">{req.purpose}</td>
                  <td className="py-4 px-4 text-xs text-text-secondary">{req.duration}</td>
                  <td className="py-4 px-4 text-sm font-mono text-text-secondary">{req.rate}</td>
                  <td className="py-4 px-4 text-xs text-text-muted">{req.date}</td>
                  <td className="py-4 px-4">
                    <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold border bg-blue-50 text-primary border-blue-100">
                      {req.status}
                    </span>
                  </td>
                </tr>
              ))}
              {historyToDisplay.map((lh: any) => (
                <tr key={lh.id} className="border-b border-borderCustom hover:bg-slate-50/50">
                  <td className="py-4 px-4 text-sm font-mono font-bold text-text-primary">{lh.id}</td>
                  <td className="py-4 px-4 text-sm font-mono text-text-secondary">{lh.amount}</td>
                  <td className="py-4 px-4 text-sm font-semibold text-text-primary">{lh.purpose}</td>
                  <td className="py-4 px-4 text-xs text-text-secondary">{lh.duration}</td>
                  <td className="py-4 px-4 text-sm font-mono text-text-secondary">{lh.rate}</td>
                  <td className="py-4 px-4 text-xs text-text-muted">{lh.date}</td>
                  <td className="py-4 px-4">
                    <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold border bg-emerald-50 text-success border-emerald-100">
                      {lh.status}
                    </span>
                  </td>
                </tr>
              ))}
            </DataTable>
          </section>

        </div>

      </main>
    </div>
  );
}
