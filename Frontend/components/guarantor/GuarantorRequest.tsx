"use client";

import { useState, useEffect, useRef } from "react";
import { Search, ShieldAlert, CheckCircle, Clock, X, AlertTriangle } from "lucide-react";

interface MockGuarantor {
  id: string;
  name: string;
  wallet: string;
  score: number;
  kycLevel: number;
  activeGuarantees: number;
}

const REGISTRY: MockGuarantor[] = [
  { id: "rohan_das", name: "Rohan Das", wallet: "GB837A8F92B7C52A019D384FE572B683E91122B29B", score: 812, kycLevel: 2, activeGuarantees: 0 },
  { id: "priya_patel", name: "Priya Patel", wallet: "GB771C8F92B7C52A019D384FE572B683E91122B29C", score: 790, kycLevel: 2, activeGuarantees: 1 },
  { id: "neha_roy", name: "Neha Roy", wallet: "GB911E8F92B7C52A019D384FE572B683E91122B29D", score: 825, kycLevel: 2, activeGuarantees: 0 },
  { id: "vikram_sen", name: "Vikram Sen", wallet: "GB111A8F92B7C52A019D384FE572B683E91122B29E", score: 580, kycLevel: 2, activeGuarantees: 0 },
  { id: "suresh_nair", name: "Suresh Nair", wallet: "GB222B8F92B7C52A019D384FE572B683E91122B29F", score: 712, kycLevel: 1, activeGuarantees: 0 },
  { id: "tanya_sharma", name: "Tanya Sharma", wallet: "GB333C8F92B7C52A019D384FE572B683E91122B29G", score: 892, kycLevel: 3, activeGuarantees: 2 },
  { id: "arjun_sharma", name: "Arjun Sharma", wallet: "GB7F3A8F92B7C52A019D384FE572B683E91122B29C", score: 847, kycLevel: 2, activeGuarantees: 0 }
];

interface GuarantorRequestProps {
  onSuccess: (guarantorName: string, amount: number) => void;
}

export default function GuarantorRequest({ onSuccess }: GuarantorRequestProps) {
  const [query, setQuery] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [countdown, setCountdown] = useState(172800); // 48 hours in seconds
  const [isPending, setIsPending] = useState(false);
  const [requestedName, setRequestedName] = useState("");
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // If request is pending, countdown ticks
    if (isPending) {
      timerRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            setIsPending(false);
            setErrorMsg("Request expired. Please request a new guarantor.");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPending]);

  const formatCountdown = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${h}h ${m}m ${s}s`;
  };

  const handleCheckAndSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!query.trim()) {
      setErrorMsg("Please enter a username or Stellar address.");
      return;
    }

    // Match by ID (username) or Wallet Address
    const normalizedQuery = query.trim().toLowerCase();
    const match = REGISTRY.find(
      g => g.id.toLowerCase() === normalizedQuery || g.wallet.toLowerCase() === normalizedQuery
    );

    if (!match) {
      setErrorMsg("User not found in TrustLend X directory.");
      return;
    }

    // ELIGIBILITY CHECKS
    // 1. Cannot act as own guarantor
    if (match.id === "arjun_sharma" || match.wallet === "GB7F3A8F92B7C52A019D384FE572B683E91122B29C") {
      setErrorMsg("You cannot act as your own guarantor. Please search for a distinct user.");
      return;
    }

    // 2. Trust Score must be 600+
    if (match.score < 600) {
      setErrorMsg(`This user's Trust Score is too low to be a guarantor (${match.score} < 600).`);
      return;
    }

    // 3. KYC Level 2 required
    if (match.kycLevel < 2) {
      setErrorMsg("This user has not completed KYC Level 2 verification (Identity verification is required).");
      return;
    }

    // 4. Cannot already be guarantor for 2+ active loans
    if (match.activeGuarantees >= 2) {
      setErrorMsg("This user is already guaranteeing 2 active loans (maximum limit reached).");
      return;
    }

    // If eligible -> send consent request
    setIsPending(true);
    setRequestedName(match.name);
    setSuccessMsg(`Request Sent — Waiting for approval from ${match.name}`);
    
    // Callback to parent component
    onSuccess(match.name, 10000); // mock amount
  };

  const cancelRequest = () => {
    setIsPending(false);
    setQuery("");
    setSuccessMsg("");
    setErrorMsg("");
    setCountdown(172800);
  };

  return (
    <div className="space-y-4">
      {isPending ? (
        <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl space-y-3.5 animate-fade-in">
          <div className="flex items-start gap-2.5">
            <Clock className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-xs font-bold text-text-primary">Guarantor Verification Pending</p>
              <p className="text-[11px] text-text-secondary leading-normal font-medium">
                Sent verification request to <strong>{requestedName}</strong>. They have 48 hours to confirm the credit risk lock.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-amber-100/50 pt-2.5">
            <span className="text-[10px] text-warning uppercase font-bold tracking-wider">Time Remaining:</span>
            <span className="font-mono text-xs font-black text-warning bg-white border border-amber-100 px-2 py-0.5 rounded-lg">
              {formatCountdown(countdown)}
            </span>
          </div>

          <button
            type="button"
            onClick={cancelRequest}
            className="w-full py-1.5 border border-amber-250 text-warning hover:bg-white text-[10px] uppercase font-bold tracking-wider rounded-lg transition-all"
          >
            Cancel Request
          </button>
        </div>
      ) : (
        <form onSubmit={handleCheckAndSubmit} className="space-y-3">
          <div className="relative">
            <Search className="w-4.5 h-4.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              placeholder="Enter ID (e.g. rohan_das) or G-Wallet Address..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs focus:ring-2 focus:ring-primary/20 focus:border-primary focus:outline-none text-text-secondary font-medium transition-all"
            />
          </div>

          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-xs text-danger font-medium flex items-start gap-2 animate-shake leading-normal">
              <ShieldAlert className="w-4 h-4 flex-shrink-0 mt-0.5 text-danger" />
              <span>{errorMsg}</span>
            </div>
          )}

          <button
            type="submit"
            className="w-full py-2.5 bg-gradient-to-r from-primary to-accent hover:opacity-95 text-white font-bold rounded-xl text-xs uppercase tracking-wider shadow-sm transition-all"
          >
            Verify & Request Guarantor
          </button>
        </form>
      )}

      {/* Directory Hint */}
      {!isPending && (
        <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-[10px] text-text-secondary leading-normal space-y-1 font-medium">
          <div className="flex items-center gap-1 font-bold text-text-primary uppercase tracking-wider text-[9px]">
            <AlertTriangle className="w-3.5 h-3.5 text-text-muted" />
            <span>Test Eligibility Directory Quick-list</span>
          </div>
          <p>Eligible: <span className="font-mono">rohan_das</span>, <span className="font-mono">priya_patel</span>, <span className="font-mono">neha_roy</span></p>
          <p>Low Score (&lt;600): <span className="font-mono">vikram_sen</span> (580)</p>
          <p>Low KYC (&lt;Lvl 2): <span className="font-mono">suresh_nair</span> (Level 1)</p>
          <p>Guarantees Maxed (2/2): <span className="font-mono">tanya_sharma</span></p>
        </div>
      )}
    </div>
  );
}
