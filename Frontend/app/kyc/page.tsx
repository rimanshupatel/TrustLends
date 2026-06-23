"use client";

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useWallet } from "@/context/WalletContext";
import WalletConnect from "@/components/ui/WalletConnect";
import {
  Wallet,
  Shield,
  FileText,
  Lock,
  UploadCloud,
  CheckCircle,
  Clock,
  ArrowRight,
  AlertCircle,
  Check,
  AlertTriangle
} from "lucide-react";

import Sidebar from "@/components/layout/Sidebar";
import KYCLevelBadge from "@/components/ui/KYCLevelBadge";

interface TimelineEvent {
  event: string;
  date: string;
  impact: string;
  status: 'success' | 'warning' | 'info';
}

const INITIAL_TIMELINE: TimelineEvent[] = [
  { event: "Account creation initialized", date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }), impact: "Verified", status: "success" }
];

export default function KYCPage() {
  const navigate = useNavigate();
  const { kycLevel, updateKycLevel } = useAuth();
  const { isConnected, walletAddress } = useWallet();

  const [level2State, setLevel2State] = useState<'not_started' | 'uploading' | 'analyzing' | 'completed'>('not_started');
  const [level3State, setLevel3State] = useState<'not_started' | 'uploading' | 'analyzing' | 'completed' | 'skipped'>('not_started');
  const [timeline, setTimeline] = useState<TimelineEvent[]>(INITIAL_TIMELINE);
  const [dragActiveLvl2, setDragActiveLvl2] = useState(false);
  const [dragActiveLvl3, setDragActiveLvl3] = useState(false);
  const [fileErrorLvl2, setFileErrorLvl2] = useState("");
  const [fileErrorLvl3, setFileErrorLvl3] = useState("");

  // Sync Level 1 status (Wallet connected)
  useEffect(() => {
    if (isConnected && kycLevel < 1) {
      updateKycLevel(1);
      
      const newEvent: TimelineEvent = {
        event: "Level 1 wallet connected",
        date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
        impact: "+10 pts",
        status: "success"
      };
      setTimeline(prev => [newEvent, ...prev]);
    } else if (!isConnected && kycLevel >= 1) {
      // If user disconnects wallet, reset KYC to 0
      updateKycLevel(0);
    }
  }, [isConnected, kycLevel, updateKycLevel]);

  // Sync completed level 2 and level 3 states if user already has it in mock profile
  useEffect(() => {
    if (kycLevel >= 2 && level2State === 'not_started') {
      setLevel2State('completed');
      setTimeline(prev => [
        {
          event: "Level 2 identity verified",
          date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
          impact: "+15 pts",
          status: "success"
        },
        ...prev
      ]);
    }
    if (kycLevel >= 3 && level3State === 'not_started') {
      setLevel3State('completed');
      setTimeline(prev => [
        {
          event: "Level 3 income verified",
          date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
          impact: "+25 pts",
          status: "success"
        },
        ...prev
      ]);
    }
  }, [kycLevel, level2State, level3State]);

  // Helper to validate file (PDF or image, max 5MB)
  const validateFile = (file: File): string | null => {
    const validTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      return "Only PDF, PNG, and JPEG files are allowed.";
    }
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return "File size exceeds the 5MB limit.";
    }
    return null;
  };

  // Simulate Level 2 Upload & Mock Verify
  const startLevel2Verification = (file: File) => {
    setFileErrorLvl2("");
    const error = validateFile(file);
    if (error) {
      setFileErrorLvl2(error);
      return;
    }

    setLevel2State('uploading');
    
    // Simulate 1.5 seconds upload
    setTimeout(() => {
      setLevel2State('analyzing');
      
      // Simulate 1.5 seconds AI checks
      setTimeout(() => {
        setLevel2State('completed');
        updateKycLevel(2);
        
        const newEvent: TimelineEvent = {
          event: "Level 2 identity verified",
          date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
          impact: "+15 pts",
          status: "success"
        };
        setTimeline(prev => [newEvent, ...prev]);
      }, 1500);

    }, 1500);
  };

  // Simulate Level 3 Upload & Mock Verify
  const startLevel3Verification = (file: File) => {
    setFileErrorLvl3("");
    const error = validateFile(file);
    if (error) {
      setFileErrorLvl3(error);
      return;
    }

    setLevel3State('uploading');
    
    setTimeout(() => {
      setLevel3State('analyzing');
      
      setTimeout(() => {
        setLevel3State('completed');
        updateKycLevel(3);
        
        const newEvent: TimelineEvent = {
          event: "Level 3 income verified",
          date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
          impact: "+25 pts",
          status: "success"
        };
        setTimeline(prev => [newEvent, ...prev]);
      }, 1500);

    }, 1500);
  };

  const handleDragLvl2 = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActiveLvl2(true);
    } else if (e.type === "dragleave") {
      setDragActiveLvl2(false);
    }
  };

  const handleDropLvl2 = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActiveLvl2(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      startLevel2Verification(e.dataTransfer.files[0]);
    }
  };

  const handleFileChangeLvl2 = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      startLevel2Verification(e.target.files[0]);
    }
  };

  const handleDragLvl3 = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActiveLvl3(true);
    } else if (e.type === "dragleave") {
      setDragActiveLvl3(false);
    }
  };

  const handleDropLvl3 = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActiveLvl3(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      startLevel3Verification(e.dataTransfer.files[0]);
    }
  };

  const handleFileChangeLvl3 = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      startLevel3Verification(e.target.files[0]);
    }
  };

  const handleSkipLvl3 = () => {
    setLevel3State('skipped');
    // If skipped, we stay at level 2, which is fine
    navigate('/dashboard');
  };

  const truncateWallet = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <div className="min-h-screen bg-background flex font-sans">
      <Sidebar />

      <main className="flex-1 pl-16 xl:pl-60 min-h-screen flex flex-col transition-all duration-300 relative">
        
        {/* Blocking overlay if Level 1 (Wallet Connect) is not complete */}
        {!isConnected && (
          <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-md z-50 flex items-center justify-center p-6 transition-all duration-300">
            <div className="w-full max-w-md bg-white border border-slate-100 shadow-2xl rounded-3xl p-8 space-y-6 text-center animate-scale-in">
              <div className="w-16 h-16 bg-primary-light border border-blue-150 text-primary rounded-2xl flex items-center justify-center mx-auto shadow-sm">
                <Lock className="w-8 h-8" />
              </div>
              <div className="space-y-2">
                <h2 className="text-lg font-bold text-text-primary">Complete KYC to continue</h2>
                <p className="text-xs text-text-muted max-w-[280px] mx-auto leading-relaxed font-medium">
                  To access the TrustLend X platform, you must link your Freighter Stellar Wallet (KYC Level 1).
                </p>
              </div>

              <div className="pt-2">
                <WalletConnect showDisconnect={false} />
              </div>
            </div>
          </div>
        )}

        {/* Top Header Bar */}
        <header className="h-16 bg-white border-b border-borderCustom px-6 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-text-primary">Identity & KYC Verification</span>
            <span className="text-xs text-text-muted hidden sm:inline-block">· Secure your profile credentials</span>
          </div>

          <div className="flex items-center gap-4">
            {/* Go to Dashboard button if Level 1 is complete */}
            {isConnected && (
              <button
                onClick={() => navigate('/dashboard')}
                className="px-4 py-2 bg-gradient-to-r from-primary to-accent hover:opacity-95 text-white font-bold rounded-xl text-xs uppercase tracking-wider shadow flex items-center gap-1 animate-fade-in"
              >
                <span>Go to Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}

            {isConnected && walletAddress && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 border border-borderCustom bg-slate-50 rounded-xl font-mono text-xs text-text-secondary select-none">
                <Wallet className="w-3.5 h-3.5 text-text-muted" />
                <span>{truncateWallet(walletAddress)}</span>
              </div>
            )}
          </div>
        </header>

        {/* Page Content */}
        <div className="p-6 md:p-8 space-y-8 max-w-7xl w-full mx-auto">
          
          {/* Progress Stepper Header */}
          <section className="bg-white border border-cardBorder rounded-xl p-6 shadow-sm">
            <h2 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-6">Verification Progress</h2>
            
            <div className="max-w-xl mx-auto flex items-center justify-between relative select-none">
              {/* Connector lines */}
              <div className="absolute left-[8%] right-[8%] top-[14px] h-1 bg-slate-200 z-0">
                <div 
                  className="h-full bg-primary transition-all duration-500" 
                  style={{ width: kycLevel === 3 ? "100%" : kycLevel === 2 ? "50%" : "0%" }} 
                />
              </div>

              {/* Step 1 */}
              <div className="flex flex-col items-center gap-2 relative z-10">
                <div className={`w-8.5 h-8.5 rounded-full border-4 border-white shadow flex items-center justify-center text-xs font-bold font-mono transition-all duration-300 ${
                  kycLevel >= 1 ? "bg-primary text-white" : "bg-slate-200 text-text-secondary"
                }`}>
                  {kycLevel >= 1 ? <Check className="w-4 h-4" /> : "1"}
                </div>
                <span className="text-[11px] font-bold text-text-primary">Wallet Linked</span>
              </div>

              {/* Step 2 */}
              <div className="flex flex-col items-center gap-2 relative z-10">
                <div className={`w-8.5 h-8.5 rounded-full border-4 border-white shadow flex items-center justify-center text-xs font-bold font-mono transition-all duration-300 ${
                  kycLevel >= 2 ? "bg-primary text-white" : "bg-slate-250 text-text-secondary"
                }`}>
                  {kycLevel >= 2 ? <Check className="w-4 h-4" /> : "2"}
                </div>
                <span className={`text-[11px] font-bold ${kycLevel >= 2 ? "text-text-primary" : "text-text-secondary"}`}>Identity Verified</span>
              </div>

              {/* Step 3 */}
              <div className="flex flex-col items-center gap-2 relative z-10">
                <div className={`w-8.5 h-8.5 rounded-full border-4 border-white shadow flex items-center justify-center text-xs font-bold font-mono transition-all duration-300 ${
                  level3State === 'completed' ? "bg-primary text-white" : "bg-slate-200 text-text-secondary"
                }`}>
                  {level3State === 'completed' ? <Check className="w-4 h-4" /> : "3"}
                </div>
                <span className={`text-[11px] font-bold ${level3State === 'completed' ? "text-text-primary" : "text-text-secondary"}`}>Income Proof</span>
              </div>
            </div>
          </section>

          {/* Verification Level Cards */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Level 1 Card */}
            <div className="bg-white border border-cardBorder rounded-xl p-6 shadow-sm flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-text-muted uppercase tracking-wider">Level 1</span>
                  {isConnected ? (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-100 text-success text-[10px] font-bold">
                      Completed
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full bg-red-50 border border-red-100 text-danger text-[10px] font-bold">
                      Required
                    </span>
                  )}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-text-primary">Wallet Verification</h3>
                  <p className="text-xs text-text-secondary mt-1">Stellar account binding & blockchain age confirmation.</p>
                </div>
                <ul className="text-xs text-text-secondary space-y-2 font-medium">
                  <li className="flex items-center gap-1.5 text-success">✓ Wallet Linked</li>
                  <li className="flex items-center gap-1.5 text-success">✓ Account Age validated</li>
                  <li className="flex items-center gap-1.5 text-text-primary">✦ Micro-limits access: ₹500–₹2,000</li>
                </ul>
              </div>
              <div className="pt-2">
                <div className="w-full text-center py-2.5 bg-slate-50 border border-borderCustom text-text-muted text-xs font-semibold rounded-lg font-mono">
                  {isConnected && walletAddress ? truncateWallet(walletAddress) : "Not Connected"}
                </div>
              </div>
            </div>

            {/* Level 2 Card */}
            <div className="bg-white border border-cardBorder rounded-xl p-6 shadow-sm flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-text-muted uppercase tracking-wider">Level 2</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                    level2State === 'completed'
                      ? "bg-emerald-50 text-success border-emerald-100"
                      : level2State === 'not_started'
                      ? "bg-slate-50 text-text-secondary border-slate-150"
                      : "bg-amber-50 text-warning border-amber-100"
                  }`}>
                    {level2State === 'completed' ? "Completed" : level2State === 'not_started' ? "Locked" : "Under Review"}
                  </span>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-text-primary">Identity Verification</h3>
                  <p className="text-xs text-text-secondary mt-1">Government-issued credential checks & biometric matches.</p>
                </div>
                <ul className="text-xs text-text-secondary space-y-2 font-medium">
                  <li className={`flex items-center gap-1.5 ${level2State === 'completed' ? "text-success" : ""}`}>
                    {level2State === 'completed' ? "✓" : "✦"} Aadhaar / Government ID
                  </li>
                  <li className={`flex items-center gap-1.5 ${level2State === 'completed' ? "text-success" : ""}`}>
                    {level2State === 'completed' ? "✓" : "✦"} Face ID verification
                  </li>
                  <li className="flex items-center gap-1.5 text-text-primary">✦ Medium-limits access: ₹5,000–₹20,000</li>
                </ul>
              </div>

              {/* Upload Drop Zone / Progress */}
              <div className="pt-2">
                {level2State === 'not_started' && (
                  <div className="relative">
                    <label
                      onDragEnter={handleDragLvl2}
                      onDragOver={handleDragLvl2}
                      onDragLeave={handleDragLvl2}
                      onDrop={handleDropLvl2}
                      className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all flex flex-col justify-center items-center h-[96px] ${
                        dragActiveLvl2 ? "border-primary bg-primary-light" : "border-slate-200 hover:border-primary hover:bg-slate-50"
                      }`}
                    >
                      <UploadCloud className="w-6 h-6 text-text-muted mb-1" />
                      <p className="text-[10px] font-bold text-text-primary">Drag & drop ID slip here</p>
                      <p className="text-[8px] text-text-muted mt-0.5 font-medium">PDF or Image up to 5MB</p>
                      <input
                        type="file"
                        accept="application/pdf,image/*"
                        onChange={handleFileChangeLvl2}
                        className="hidden"
                      />
                    </label>
                    {fileErrorLvl2 && (
                      <p className="text-[9px] text-danger font-medium mt-1.5 text-center leading-tight">
                        {fileErrorLvl2}
                      </p>
                    )}
                  </div>
                )}

                {level2State === 'uploading' && (
                  <div className="bg-slate-50 border border-borderCustom rounded-xl p-4 text-center space-y-2 h-[96px] flex flex-col justify-center">
                    <div className="w-5 h-5 rounded-full border-2 border-primary border-t-transparent animate-spin mx-auto" />
                    <p className="text-[9.5px] font-bold text-text-primary">Uploading documents to ZK node...</p>
                  </div>
                )}

                {level2State === 'analyzing' && (
                  <div className="bg-slate-50 border border-borderCustom rounded-xl p-4 text-center space-y-2 h-[96px] flex flex-col justify-center">
                    <div className="w-5 h-5 rounded-full border-2 border-accent border-t-transparent animate-spin mx-auto" />
                    <p className="text-[9.5px] font-bold text-text-primary">Running AI OCR verification checks...</p>
                  </div>
                )}

                {level2State === 'completed' && (
                  <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 text-center flex items-center justify-center gap-1.5 text-success text-[11px] font-bold h-[96px] animate-scale-in">
                    <CheckCircle className="w-5 h-5 flex-shrink-0" />
                    <span>Identity Verified Successfully</span>
                  </div>
                )}
              </div>
            </div>

            {/* Level 3 Card */}
            <div className="bg-white border-2 border-primary/20 rounded-xl p-6 shadow-sm flex flex-col justify-between space-y-6 relative">
              {level3State === 'completed' && (
                <div className="absolute top-0 right-1/2 translate-x-1/2 -translate-y-1/2 px-2.5 py-0.5 bg-success text-white text-[9px] uppercase font-black tracking-wider rounded-full shadow">
                  Fully Verified
                </div>
              )}

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-text-muted uppercase tracking-wider">Level 3</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                    level3State === 'completed'
                      ? "bg-emerald-50 text-success border-emerald-100"
                      : level3State === 'skipped'
                      ? "bg-slate-100 text-text-muted border-slate-200"
                      : level3State === 'not_started'
                      ? "bg-slate-50 text-text-secondary border-slate-150"
                      : "bg-amber-50 text-warning border-amber-100"
                  }`}>
                    {level3State === 'completed' ? "Verified" : level3State === 'skipped' ? "Skipped" : level3State === 'not_started' ? "Locked" : "Under Review"}
                  </span>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-text-primary">Income Verification</h3>
                  <p className="text-xs text-text-secondary mt-1">Salary slips, student enrollment logs, or cash flow history.</p>
                </div>
                <ul className="text-xs text-text-secondary space-y-2 font-medium">
                  <li className={`flex items-center gap-1.5 ${level3State === 'completed' ? "text-success" : ""}`}>
                    {level3State === 'completed' ? "✓" : "✦"} Proof of regular income
                  </li>
                  <li className={`flex items-center gap-1.5 ${level3State === 'completed' ? "text-success" : ""}`}>
                    {level3State === 'completed' ? "✓" : "✦"} Direct salary link authorization
                  </li>
                  <li className="flex items-center gap-1.5 text-text-primary">✦ Premium-limits access: ₹20,000+</li>
                </ul>
              </div>

              {/* Upload Drop Zone / Progress */}
              <div className="pt-2 space-y-2">
                {level3State === 'not_started' && (
                  <div className="relative">
                    <label
                      onDragEnter={handleDragLvl3}
                      onDragOver={handleDragLvl3}
                      onDragLeave={handleDragLvl3}
                      onDrop={handleDropLvl3}
                      className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all flex flex-col justify-center items-center h-[96px] ${
                        dragActiveLvl3 ? "border-primary bg-primary-light" : "border-slate-200 hover:border-primary hover:bg-slate-50"
                      } ${kycLevel < 2 ? "opacity-50 pointer-events-none cursor-not-allowed" : ""}`}
                    >
                      <UploadCloud className="w-6 h-6 text-text-muted mb-1" />
                      <p className="text-[10px] font-bold text-text-primary">Drag & drop bank slip here</p>
                      <p className="text-[8px] text-text-muted mt-0.5 font-medium">PDF or Image up to 5MB</p>
                      <input
                        type="file"
                        accept="application/pdf,image/*"
                        disabled={kycLevel < 2}
                        onChange={handleFileChangeLvl3}
                        className="hidden"
                      />
                    </label>
                    {fileErrorLvl3 && (
                      <p className="text-[9px] text-danger font-medium mt-1.5 text-center leading-tight">
                        {fileErrorLvl3}
                      </p>
                    )}
                    
                    {kycLevel >= 2 && (
                      <div className="text-center">
                        <button
                          onClick={handleSkipLvl3}
                          className="text-[10px] text-text-muted hover:text-primary underline font-semibold transition-colors"
                        >
                          Skip for now
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {level3State === 'uploading' && (
                  <div className="bg-slate-50 border border-borderCustom rounded-xl p-4 text-center space-y-2 h-[96px] flex flex-col justify-center">
                    <div className="w-5 h-5 rounded-full border-2 border-primary border-t-transparent animate-spin mx-auto" />
                    <p className="text-[9.5px] font-bold text-text-primary">Uploading documents to ZK node...</p>
                  </div>
                )}

                {level3State === 'analyzing' && (
                  <div className="bg-slate-50 border border-borderCustom rounded-xl p-4 text-center space-y-2 h-[96px] flex flex-col justify-center">
                    <div className="w-5 h-5 rounded-full border-2 border-accent border-t-transparent animate-spin mx-auto" />
                    <p className="text-[9.5px] font-bold text-text-primary">Running AI OCR verification checks...</p>
                  </div>
                )}

                {level3State === 'completed' && (
                  <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 text-center flex items-center justify-center gap-1.5 text-success text-[11px] font-bold h-[96px] animate-scale-in">
                    <CheckCircle className="w-5 h-5 flex-shrink-0" />
                    <span>Premium Borrow Capacity Unlocked</span>
                  </div>
                )}
              </div>
            </div>

          </section>

          {/* ZK Privacy Notice & Timeline Split */}
          <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Zero-knowledge Privacy Notice */}
            <div className="lg:col-span-6 bg-slate-900 text-white rounded-xl p-6 shadow-sm flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-primary-light flex-shrink-0">
                <Lock className="w-5 h-5" />
              </div>
              <div className="space-y-2">
                <h3 className="text-sm font-bold text-slate-100">Zero-Knowledge Privacy Architecture</h3>
                <p className="text-xs text-slate-350 leading-relaxed font-medium">
                  Your KYC data is encrypted locally and submitted as cryptographic commitments. Lenders can only verify that you meet their eligibility criteria (e.g. &ldquo;Trust Score &gt; 650&rdquo;) without ever accessing your document archives.
                </p>
                <div className="pt-1.5 flex items-center gap-1.5 text-[10px] text-success font-semibold">
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>Stellar network ZK-Contract approved</span>
                </div>
              </div>
            </div>

            {/* Verification History Timeline */}
            <div className="lg:col-span-6 bg-white border border-cardBorder rounded-xl p-6 shadow-sm space-y-6">
              <div>
                <h3 className="text-sm font-bold text-text-primary">Verification Logs</h3>
                <p className="text-xs text-text-muted mt-0.5">Chronological record of verified credential credentials.</p>
              </div>

              <div className="space-y-6 relative pl-4 before:absolute before:left-1 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100">
                {timeline.map((event, idx) => (
                  <div key={idx} className="relative space-y-1">
                    {/* Circle marker */}
                    <span className={`absolute -left-[16px] top-1.5 w-2.5 h-2.5 rounded-full ring-4 ring-white ${
                      event.status === "success" ? "bg-success" : "bg-warning"
                    }`} />
                    
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-text-primary">{event.event}</span>
                      <span className={`font-mono text-[10px] font-bold ${
                        event.status === "success" ? "text-success" : "text-warning"
                      }`}>
                        {event.impact}
                      </span>
                    </div>
                    <p className="text-[10px] text-text-muted font-medium">{event.date}</p>
                  </div>
                ))}
              </div>
            </div>

          </section>

        </div>

      </main>
    </div>
  );
}
