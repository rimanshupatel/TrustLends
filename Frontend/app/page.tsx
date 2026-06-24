"use client";

import { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  ShieldCheck,
  DollarSign,
  TrendingUp,
  Award,
  Users,
  ChevronRight,
  Layers,
  ArrowRight,
  Calculator
} from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import TrustScoreRing from "@/components/ui/TrustScoreRing";
import ProgressBar from "@/components/ui/ProgressBar";

import { useAuth } from "@/context/AuthContext";
import { useWallet } from "@/context/WalletContext";

export default function LandingPage() {
  const { isLoggedIn } = useAuth();
  const { isConnected, walletAddress } = useWallet();
  const navigate = useNavigate();
  const location = useLocation();
  const [showWalletAlert, setShowWalletAlert] = useState(false);

  useEffect(() => {
    if (location.state?.message) {
      setShowWalletAlert(true);
    }
  }, [location.state]);
  // Metric counts animation values
  const [disbursed, setDisbursed] = useState(0);
  const [borrowers, setBorrowers] = useState(0);
  const [repayment, setRepayment] = useState(0);
  const [defaultRate, setDefaultRate] = useState(0);

  // Lend calculator state
  const [calcAmount, setCalcAmount] = useState(5000);
  const [calcDuration, setCalcDuration] = useState(6); // months

  useEffect(() => {
    // Basic numerical load animation
    const duration = 1000;
    const steps = 30;
    const stepTime = duration / steps;
    let currentStep = 0;

    const interval = setInterval(() => {
      currentStep++;
      setDisbursed(Math.min(Math.floor((2.4 / steps) * currentStep * 10) / 10, 2.4));
      setBorrowers(Math.min(Math.floor((18400 / steps) * currentStep), 18400));
      setRepayment(Math.min(Math.floor((94.7 / steps) * currentStep * 10) / 10, 94.7));
      setDefaultRate(Math.min(Math.floor((0.8 / steps) * currentStep * 10) / 10, 0.8));

      if (currentStep >= steps) {
        clearInterval(interval);
      }
    }, stepTime);

    return () => clearInterval(interval);
  }, []);

  // Calculate yield
  const getEstimatedYield = () => {
    // 12% to 18% APY depending on duration
    const apy = calcDuration === 1 ? 0.12 : calcDuration === 3 ? 0.14 : calcDuration === 6 ? 0.16 : 0.18;
    const interest = calcAmount * apy * (calcDuration / 12);
    return {
      interest: Math.round(interest),
      total: Math.round(calcAmount + interest),
      apy: apy * 100,
    };
  };

  const yieldResult = getEstimatedYield();

  const handleStartBorrowing = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!isConnected || !walletAddress) {
      setShowWalletAlert(true);
      return;
    }
    setShowWalletAlert(false);
    navigate(isLoggedIn ? "/borrow" : "/auth/signup");
  };

  const handleEarnAsLender = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!isConnected || !walletAddress) {
      setShowWalletAlert(true);
      return;
    }
    setShowWalletAlert(false);
    navigate(isLoggedIn ? "/lend" : "/auth/signup");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans">
      <Navbar />

      {/* Hero Section */}
      <section className="relative py-16 lg:py-24 max-w-7xl mx-auto px-6 w-full grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
        {/* Left Side Info */}
        <div className="lg:col-span-7 space-y-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-light text-primary font-semibold text-xs border border-blue-100">
            <span>⚡ Built on Stellar Blockchain</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-text-primary tracking-tight leading-none">
            Your Trust Score is <br />
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Your Credit
            </span>
          </h1>

          <p className="text-base sm:text-lg text-text-secondary max-w-lg leading-relaxed">
            Borrow without collateral. Your on-chain reputation, social trust, and AI risk score unlock real capital — no banks, no gatekeepers.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-4">
            <button
              onClick={handleStartBorrowing}
              className="w-full sm:w-auto px-7 py-3.5 bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white font-semibold rounded-xl text-center shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
            >
              <span>Start Borrowing</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={handleEarnAsLender}
              className="w-full sm:w-auto px-7 py-3.5 bg-white border-2 border-primary text-primary hover:bg-primary-light font-semibold rounded-xl text-center transition-all"
            >
              Earn as Lender
            </button>
          </div>

          {showWalletAlert && (
            <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-xs text-danger font-medium flex items-center gap-1.5 max-w-sm mt-3 animate-fade-in">
              <span className="w-1.5 h-1.5 rounded-full bg-danger animate-pulse" />
              <span>Please connect your wallet first.</span>
            </div>
          )}

          {/* Mini Trust Badges */}
          <div className="flex flex-wrap items-center gap-6 pt-2 text-sm text-text-secondary font-medium">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4.5 h-4.5 text-success" />
              <span>No Collateral</span>
            </div>
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4.5 h-4.5 text-success" />
              <span>KYC Protected</span>
            </div>
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4.5 h-4.5 text-success" />
              <span>AI-Powered</span>
            </div>
          </div>
        </div>

        {/* Right Side - Ring and Floaters */}
        <div className="lg:col-span-5 relative flex items-center justify-center min-h-[360px]">
          {/* Trust Score Ring */}
          <div className="relative z-10 transition-transform duration-500 hover:scale-105">
            <TrustScoreRing score={847} size={250} />
          </div>

          {/* Floating Metric Cards */}
          <div className="absolute top-2 left-0 sm:left-4 z-20 animate-float" style={{ animationDelay: "0s" }}>
            <div className="bg-white border border-cardBorder shadow-md rounded-xl p-3.5 flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-blue-50 text-primary flex items-center justify-center font-bold text-xs">
                Yr
              </div>
              <div>
                <p className="text-[10px] text-text-muted font-bold uppercase">Wallet Age</p>
                <p className="text-xs font-mono font-bold text-text-primary">2.4 yrs</p>
              </div>
            </div>
          </div>

          <div className="absolute top-8 right-0 sm:right-4 z-20 animate-float" style={{ animationDelay: "0.5s" }}>
            <div className="bg-white border border-cardBorder shadow-md rounded-xl p-3.5 flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-emerald-50 text-success flex items-center justify-center font-bold text-xs">
                %
              </div>
              <div>
                <p className="text-[10px] text-text-muted font-bold uppercase">Repayment Rate</p>
                <p className="text-xs font-mono font-bold text-text-primary">98.2%</p>
              </div>
            </div>
          </div>

          <div className="absolute bottom-6 left-0 sm:left-2 z-20 animate-float" style={{ animationDelay: "1s" }}>
            <div className="bg-white border border-cardBorder shadow-md rounded-xl p-3.5 flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-violet-50 text-accent flex items-center justify-center font-bold text-xs">
                ★
              </div>
              <div>
                <p className="text-[10px] text-text-muted font-bold uppercase">Social Trust</p>
                <p className="text-xs font-mono font-bold text-text-primary">94/100</p>
              </div>
            </div>
          </div>

          <div className="absolute bottom-2 right-0 sm:right-2 z-20 animate-float" style={{ animationDelay: "1.5s" }}>
            <div className="bg-white border border-cardBorder shadow-md rounded-xl p-3.5 flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-amber-50 text-warning flex items-center justify-center font-bold text-xs">
                AI
              </div>
              <div>
                <p className="text-[10px] text-text-muted font-bold uppercase">AI Risk Score</p>
                <p className="text-xs font-bold text-text-primary">Low Risk</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="bg-primary-light border-y border-blue-100 py-8 my-10">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <div className="space-y-1">
            <p className="font-mono text-2xl sm:text-3xl font-extrabold text-primary">${disbursed}M+</p>
            <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Total Disbursed</p>
          </div>
          <div className="space-y-1">
            <p className="font-mono text-2xl sm:text-3xl font-extrabold text-primary">
              {borrowers.toLocaleString()}+
            </p>
            <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Active Borrowers</p>
          </div>
          <div className="space-y-1">
            <p className="font-mono text-2xl sm:text-3xl font-extrabold text-primary">{repayment}%</p>
            <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Repayment Rate</p>
          </div>
          <div className="space-y-1">
            <p className="font-mono text-2xl sm:text-3xl font-extrabold text-primary">{defaultRate}%</p>
            <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Default Rate</p>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section id="how-it-works" className="py-20 max-w-7xl mx-auto px-6 w-full space-y-16">
        <div className="text-center max-w-xl mx-auto space-y-3">
          <h2 className="text-2xl sm:text-3xl font-bold text-text-primary tracking-tight">
            From Trust to Capital in 3 Steps
          </h2>
          <p className="text-sm text-text-secondary">
            TrustLend X uses ZK-proofs and smart covenants to disburse capital safely and instantly.
          </p>
        </div>

        <div className="relative grid grid-cols-1 md:grid-cols-3 gap-10">
          {/* Horizontal Line connecting steps */}
          <div className="hidden md:block absolute top-1/4 left-1/6 right-1/6 h-0.5 border-t-2 border-dashed border-slate-200 z-0 w-2/3 mx-auto" />

          {/* Step 1 */}
          <div className="bg-white border border-cardBorder rounded-2xl p-8 shadow-sm hover:shadow-md transition-all relative z-10 space-y-5">
            <span className="font-mono text-3xl font-extrabold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              01
            </span>
            <div className="w-11 h-11 bg-primary-light text-primary rounded-xl flex items-center justify-center border border-blue-150">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div className="space-y-2">
              <h3 className="text-base font-bold text-text-primary">Build Your Trust Score</h3>
              <p className="text-xs text-text-secondary leading-relaxed">
                Connect your Stellar wallet and link verified identities. The platform analyzes transaction frequency, account age, and community endorsements.
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="bg-white border border-cardBorder rounded-2xl p-8 shadow-sm hover:shadow-md transition-all relative z-10 space-y-5">
            <span className="font-mono text-3xl font-extrabold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              02
            </span>
            <div className="w-11 h-11 bg-purple-50 text-accent rounded-xl flex items-center justify-center border border-purple-100">
              <DollarSign className="w-6 h-6" />
            </div>
            <div className="space-y-2">
              <h3 className="text-base font-bold text-text-primary">Request a Loan</h3>
              <p className="text-xs text-text-secondary leading-relaxed">
                Configure your borrow requirements. Choose a duration tier and submit the request. AI assesses credit risk instantaneously.
              </p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="bg-white border border-cardBorder rounded-2xl p-8 shadow-sm hover:shadow-md transition-all relative z-10 space-y-5">
            <span className="font-mono text-3xl font-extrabold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              03
            </span>
            <div className="w-11 h-11 bg-emerald-50 text-success rounded-xl flex items-center justify-center border border-emerald-100">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div className="space-y-2">
              <h3 className="text-base font-bold text-text-primary">Repay & Grow</h3>
              <p className="text-xs text-text-secondary leading-relaxed">
                Complete automated micro-repayments. Successful transactions raise your score bracket, unlocking higher credit boundaries.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Score Breakdown */}
      <section id="features" className="py-20 bg-white border-y border-borderCustom">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
          
          {/* Left Side: SVG Donut Chart */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center space-y-6">
            <div className="relative w-64 h-64">
              <svg className="w-full h-full transform -rotate-90">
                {/* 40% On-chain (blue) - dasharray ~ 251 (2*pi*r, r=40 is ~251) */}
                {/* Let's use radius=60: Circumference ~ 377 */}
                <circle cx="128" cy="128" r="60" className="fill-none stroke-slate-100" strokeWidth="18" />
                
                {/* On-chain Data 40%: offset=0, length=377 * 0.40 = 150.8 */}
                <circle cx="128" cy="128" r="60" className="fill-none stroke-primary" strokeWidth="18"
                  strokeDasharray="377" strokeDashoffset={377 - 150.8} />

                {/* Financial Behavior 25%: length=94.25, offset=150.8 */}
                <circle cx="128" cy="128" r="60" className="fill-none stroke-accent" strokeWidth="18"
                  strokeDasharray="377" strokeDashoffset={377 - 94.25} style={{ transform: "rotate(144deg)", transformOrigin: "center" }} />

                {/* Social Trust 15%: length=56.55 */}
                <circle cx="128" cy="128" r="60" className="fill-none stroke-success" strokeWidth="18"
                  strokeDasharray="377" strokeDashoffset={377 - 56.55} style={{ transform: "rotate(234deg)", transformOrigin: "center" }} />

                {/* KYC 10%: length=37.7 */}
                <circle cx="128" cy="128" r="60" className="fill-none stroke-warning" strokeWidth="18"
                  strokeDasharray="377" strokeDashoffset={377 - 37.7} style={{ transform: "rotate(288deg)", transformOrigin: "center" }} />

                {/* AI Prediction 10%: length=37.7 */}
                <circle cx="128" cy="128" r="60" className="fill-none stroke-slate-450 text-slate-400 stroke-slate-400" strokeWidth="18"
                  strokeDasharray="377" strokeDashoffset={377 - 37.7} style={{ transform: "rotate(324deg)", transformOrigin: "center" }} />
              </svg>

              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-2xl font-black text-text-primary">100%</span>
                <span className="text-[10px] text-text-muted uppercase tracking-wider font-bold">Score Weights</span>
              </div>
            </div>

            <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 text-[10px] font-bold text-text-secondary">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-primary" /> On-chain (40%)</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-accent" /> Financial (25%)</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-success" /> Social (15%)</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-warning" /> KYC (10%)</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-slate-400" /> AI (10%)</span>
            </div>
          </div>

          {/* Right Side: List and Progress Bars */}
          <div className="lg:col-span-7 space-y-6">
            <div className="space-y-2">
              <h2 className="text-2xl sm:text-3xl font-bold text-text-primary tracking-tight">
                Deep Scoring Mechanics
              </h2>
              <p className="text-sm text-text-secondary">
                Our AI engine synthesizes heterogeneous signals, generating real-time algorithmic credit profiles on-chain.
              </p>
            </div>

            <div className="space-y-4">
              <ProgressBar value={92} max={100} label="On-chain Transaction History" subLabel="92 / 100 (40% Weight)" colorClass="bg-primary" />
              <ProgressBar value={88} max={100} label="Financial Repayment Logs" subLabel="88 / 100 (25% Weight)" colorClass="bg-accent" />
              <ProgressBar value={94} max={100} label="Social Network Endorsements" subLabel="94 / 100 (15% Weight)" colorClass="bg-success" />
              <ProgressBar value={80} max={100} label="Zero-Knowledge KYC Level" subLabel="80 / 100 (10% Weight)" colorClass="bg-warning" />
              <ProgressBar value={91} max={100} label="AI Repayment Prediction Model" subLabel="91 / 100 (10% Weight)" colorClass="bg-slate-400" />
            </div>
          </div>

        </div>
      </section>

      {/* Loan Tiers Section */}
      <section className="py-20 max-w-7xl mx-auto px-6 w-full space-y-12">
        <div className="text-center max-w-xl mx-auto space-y-3">
          <h2 className="text-2xl sm:text-3xl font-bold text-text-primary tracking-tight">
            Flexible Non-Collateral Credit Limits
          </h2>
          <p className="text-sm text-text-secondary">
            Find the right capital tier based on your verified credit rating history.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Card 1 */}
          <div className="bg-white border border-cardBorder rounded-xl p-8 flex flex-col justify-between space-y-6 shadow-sm hover:shadow-md transition-all">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="px-3 py-1 bg-emerald-50 text-success border border-emerald-100 rounded-full text-xs font-semibold">
                  Starter
                </span>
                <span className="text-xs font-semibold text-text-muted">Tier 1</span>
              </div>
              <div>
                <p className="text-[10px] text-text-muted uppercase font-bold">Loan Capacity</p>
                <h4 className="text-2xl font-extrabold text-text-primary mt-0.5">₹500 – ₹2,000</h4>
              </div>
              <ul className="text-xs text-text-secondary space-y-2.5 pt-2">
                <li className="flex items-center gap-2">✓ Minimum Trust Score: <strong className="text-text-primary">500+</strong></li>
                <li className="flex items-center gap-2">✓ KYC verification: <strong className="text-text-primary">Not Required</strong></li>
                <li className="flex items-center gap-2">✓ Interest rate: <strong className="text-text-primary">10% APY</strong></li>
                <li className="flex items-center gap-2">✓ Instant Stellar payout</li>
              </ul>
            </div>
            <Link
              to="/borrow"
              className="w-full py-2.5 border border-primary hover:bg-primary-light text-primary text-xs font-semibold rounded-xl text-center transition-colors"
            >
              Get Started
            </Link>
          </div>

          {/* Card 2 - Most Popular */}
          <div className="bg-white border-2 border-primary rounded-xl p-8 flex flex-col justify-between space-y-6 shadow-md relative scale-105 z-10">
            <div className="absolute top-0 right-1/2 translate-x-1/2 -translate-y-1/2 px-3 py-1 bg-primary text-white text-[10px] uppercase font-bold tracking-wider rounded-full shadow-sm">
              Most Popular
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="px-3 py-1 bg-blue-50 text-primary border border-blue-100 rounded-full text-xs font-semibold">
                  Growth
                </span>
                <span className="text-xs font-semibold text-text-muted">Tier 2</span>
              </div>
              <div>
                <p className="text-[10px] text-text-muted uppercase font-bold">Loan Capacity</p>
                <h4 className="text-2xl font-extrabold text-text-primary mt-0.5">₹5,000 – ₹20,000</h4>
              </div>
              <ul className="text-xs text-text-secondary space-y-2.5 pt-2">
                <li className="flex items-center gap-2">✓ Minimum Trust Score: <strong className="text-text-primary">650+</strong></li>
                <li className="flex items-center gap-2">✓ KYC verification: <strong className="text-text-primary">Level 2 Required</strong></li>
                <li className="flex items-center gap-2">✓ Interest rate: <strong className="text-text-primary">14.2% APY</strong></li>
                <li className="flex items-center gap-2">✓ Score impact reporting</li>
              </ul>
            </div>
            <Link
              to="/borrow"
              className="w-full py-3 bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white text-xs font-semibold rounded-xl text-center shadow transition-all"
            >
              Apply For Growth
            </Link>
          </div>

          {/* Card 3 */}
          <div className="bg-white border border-cardBorder rounded-xl p-8 flex flex-col justify-between space-y-6 shadow-sm hover:shadow-md transition-all">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="px-3 py-1 bg-violet-50 text-accent border border-violet-100 rounded-full text-xs font-semibold">
                  Premium
                </span>
                <span className="text-xs font-semibold text-text-muted">Tier 3</span>
              </div>
              <div>
                <p className="text-[10px] text-text-muted uppercase font-bold">Loan Capacity</p>
                <h4 className="text-2xl font-extrabold text-text-primary mt-0.5">₹20,000+</h4>
              </div>
              <ul className="text-xs text-text-secondary space-y-2.5 pt-2">
                <li className="flex items-center gap-2">✓ Minimum Trust Score: <strong className="text-text-primary">800+</strong></li>
                <li className="flex items-center gap-2">✓ KYC verification: <strong className="text-text-primary">Level 3 Required</strong></li>
                <li className="flex items-center gap-2">✓ Interest rate: <strong className="text-text-primary">16.5% APY</strong></li>
                <li className="flex items-center gap-2">✓ Assigned risk coverage</li>
              </ul>
            </div>
            <Link
              to="/borrow"
              className="w-full py-2.5 border border-primary hover:bg-primary-light text-primary text-xs font-semibold rounded-xl text-center transition-colors"
            >
              Apply For Premium
            </Link>
          </div>
        </div>
      </section>

      {/* Social Trust Network Preview */}
      <section className="bg-slate-50 border-y border-borderCustom py-20">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
          
          {/* Left info */}
          <div className="lg:col-span-5 space-y-6">
            <div className="w-11 h-11 bg-primary-light text-primary rounded-xl flex items-center justify-center border border-blue-150">
              <Users className="w-5 h-5" />
            </div>
            <div className="space-y-3">
              <h2 className="text-2xl sm:text-3xl font-bold text-text-primary tracking-tight">
                Decentralized Social Endorsement
              </h2>
              <p className="text-sm text-text-secondary leading-relaxed">
                Connect with verified peers, DAO networks, and validators. Mutual staking and social endorsements decrease interest rates and boost borrow ceilings dynamically.
              </p>
            </div>
            <Link
              to="/social"
              className="inline-flex items-center gap-1.5 text-sm text-primary font-semibold hover:text-accent transition-colors"
            >
              <span>Explore Social Trust Graph</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Right SVG Network visualization */}
          <div className="lg:col-span-7 bg-white border border-cardBorder rounded-2xl p-6 shadow-sm flex items-center justify-center relative min-h-[300px]">
            <svg className="w-full max-w-[500px] h-[280px]" viewBox="0 0 500 280">
              {/* Lines (Edges) */}
              <line x1="250" y1="140" x2="110" y2="70" stroke="#E2E8F0" strokeWidth="2" />
              <line x1="250" y1="140" x2="390" y2="80" stroke="#E2E8F0" strokeWidth="3.5" />
              <line x1="250" y1="140" x2="130" y2="210" stroke="#E2E8F0" strokeWidth="2" />
              <line x1="250" y1="140" x2="370" y2="200" stroke="#E2E8F0" strokeWidth="3" />
              
              {/* Core Nodes */}
              {/* Center - You */}
              <g className="cursor-pointer group">
                <circle cx="250" cy="140" r="30" className="fill-primary stroke-white" strokeWidth="4" />
                <text x="250" y="144" textAnchor="middle" fill="white" className="font-sans text-xs font-bold pointer-events-none">AS (847)</text>
              </g>

              {/* Node 1 */}
              <g className="cursor-pointer">
                <circle cx="110" cy="70" r="22" className="fill-accent stroke-white" strokeWidth="3" />
                <text x="110" y="73" textAnchor="middle" fill="white" className="font-sans text-[10px] font-bold">PP (790)</text>
              </g>

              {/* Node 2 */}
              <g className="cursor-pointer">
                <circle cx="390" cy="80" r="24" className="fill-accent stroke-white" strokeWidth="3" />
                <text x="390" y="83" textAnchor="middle" fill="white" className="font-sans text-[10px] font-bold">RD (812)</text>
              </g>

              {/* Node 3 */}
              <g className="cursor-pointer">
                <circle cx="130" cy="210" r="20" className="fill-amber-500 stroke-white" strokeWidth="3" />
                <text x="130" y="213" textAnchor="middle" fill="white" className="font-sans text-[9px] font-bold">VS (680)</text>
              </g>

              {/* Node 4 */}
              <g className="cursor-pointer">
                <circle cx="370" cy="200" r="22" className="fill-accent stroke-white" strokeWidth="3" />
                <text x="370" y="203" textAnchor="middle" fill="white" className="font-sans text-[10px] font-bold">NR (825)</text>
              </g>
            </svg>
            <div className="absolute bottom-4 right-6 text-[10px] font-mono text-text-muted">
              Nodes colored by risk factor (Blue = You, Violet = Low Risk, Yellow = Good)
            </div>
          </div>

        </div>
      </section>

      {/* Lender Slate Card Section */}
      <section className="py-20 max-w-7xl mx-auto px-6 w-full">
        <div className="bg-slate-900 text-white rounded-3xl p-8 md:p-12 lg:p-16 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center shadow-lg relative overflow-hidden">
          {/* Subtle geometric grid background overlay */}
          <div className="absolute inset-0 opacity-10 bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

          {/* Left Description */}
          <div className="lg:col-span-7 space-y-6 relative z-10">
            <h3 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight">
              Earn 12–18% APY as a Lender
            </h3>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-lg">
              Your capital is AI-distributed across verified borrowers on the Stellar blockchain. Smart risk pooling, automated repayments, and daily accrued interest.
            </p>
            <div className="pt-2">
              <Link
                to="/lend"
                className="inline-flex px-6 py-3.5 bg-white text-slate-900 font-bold rounded-xl text-sm hover:bg-slate-100 transition-colors shadow-sm"
              >
                Start Earning →
              </Link>
            </div>
          </div>

          {/* Right Yield Calculator */}
          <div className="lg:col-span-5 bg-slate-800/80 border border-slate-700/60 rounded-2xl p-6 relative z-10 space-y-5">
            <div className="flex items-center gap-2 text-primary-light">
              <Calculator className="w-5 h-5" />
              <h4 className="text-sm font-bold">Stellar Yield Estimator</h4>
            </div>

            <div className="space-y-4">
              {/* Deposit Slider */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs text-slate-350">
                  <span className="text-slate-300">Principal Deposit</span>
                  <span className="font-mono text-white font-bold">${calcAmount.toLocaleString()}</span>
                </div>
                <input
                  type="range"
                  min="500"
                  max="20000"
                  step="500"
                  value={calcAmount}
                  onChange={(e) => setCalcAmount(Number(e.target.value))}
                  className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-primary"
                />
              </div>

              {/* Term buttons */}
              <div className="space-y-1.5">
                <span className="text-xs text-slate-350 text-slate-300">Lock Duration</span>
                <div className="grid grid-cols-4 gap-2">
                  {[1, 3, 6, 12].map((dur) => (
                    <button
                      key={dur}
                      onClick={() => setCalcDuration(dur)}
                      className={`py-1.5 text-xs font-semibold rounded-lg transition-all border ${
                        calcDuration === dur
                          ? "bg-primary border-primary text-white"
                          : "bg-slate-700/50 border-slate-600 text-slate-300 hover:bg-slate-700"
                      }`}
                    >
                      {dur === 1 ? "1 Mo" : `${dur} Mos`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Live Yield computation grid */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-700/50 text-center bg-slate-900/50 p-4 rounded-xl">
                <div>
                  <p className="text-[10px] text-slate-400 uppercase font-bold">Estimated Returns</p>
                  <p className="text-lg font-mono font-bold text-success mt-0.5">+${yieldResult.interest}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 uppercase font-bold">APY Rate</p>
                  <p className="text-lg font-mono font-bold text-primary-light mt-0.5">{yieldResult.apy}%</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
