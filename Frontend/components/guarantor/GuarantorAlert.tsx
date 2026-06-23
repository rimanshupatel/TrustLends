"use client";

import { Clock, ShieldAlert, Check, X } from "lucide-react";

interface GuarantorAlertProps {
  borrowerName: string;
  borrowerWallet: string;
  borrowerScore: number;
  amount: string;
  duration: string;
  penalty: string;
  timeLeft: string;
  status?: 'pending' | 'accepted' | 'declined';
  onAccept: () => void;
  onDecline: () => void;
}

export default function GuarantorAlert({
  borrowerName,
  borrowerWallet,
  borrowerScore,
  amount,
  duration,
  penalty = "-150 pts",
  timeLeft,
  status = "pending",
  onAccept,
  onDecline
}: GuarantorAlertProps) {
  const truncateWallet = (addr: string) => {
    return addr.length > 12 ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : addr;
  };

  return (
    <div className="bg-slate-50 border border-slate-150 rounded-xl p-4 space-y-3.5 animate-fade-in font-sans text-xs">
      
      {/* Borrower Header */}
      <div className="flex items-start justify-between border-b border-slate-150 pb-2.5">
        <div>
          <p className="font-bold text-text-primary text-xs">{borrowerName}</p>
          <p className="text-[10px] text-text-muted font-mono mt-0.5">{truncateWallet(borrowerWallet)}</p>
        </div>
        <div className="text-right">
          <span className="text-[9px] uppercase font-bold text-text-muted">Trust Score</span>
          <p className="font-mono font-bold text-primary text-sm leading-none mt-0.5">{borrowerScore}</p>
        </div>
      </div>

      {/* Loan Details Grid */}
      <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-[11px] text-text-secondary font-medium">
        <div className="flex justify-between col-span-2">
          <span>Loan Amount:</span>
          <span className="font-mono text-text-primary font-bold">{amount}</span>
        </div>
        <div className="flex justify-between col-span-2">
          <span>Loan Duration:</span>
          <span className="text-text-primary font-semibold">{duration}</span>
        </div>
        <div className="flex justify-between col-span-2 text-danger">
          <span>Max Score Penalty:</span>
          <span className="font-bold">{penalty}</span>
        </div>
      </div>

      {/* Countdown Timer */}
      {status === 'pending' && (
        <div className="flex items-center justify-between bg-white border border-slate-150 px-2.5 py-1.5 rounded-lg text-[10px]">
          <span className="text-text-muted uppercase font-bold tracking-wider flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-warning" />
            <span>Time Remaining:</span>
          </span>
          <span className="font-mono font-bold text-warning">{timeLeft}</span>
        </div>
      )}

      {/* Buttons */}
      {status === 'pending' && (
        <div className="flex gap-2 pt-1">
          <button
            onClick={onAccept}
            className="flex-1 py-2 bg-success text-white font-bold rounded-lg text-[10px] uppercase tracking-wider flex items-center justify-center gap-1 shadow-sm hover:opacity-90 transition-all"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Accept</span>
          </button>
          <button
            onClick={onDecline}
            className="flex-1 py-2 bg-white text-danger border border-red-150 hover:bg-red-50 font-bold rounded-lg text-[10px] uppercase tracking-wider flex items-center justify-center gap-1 transition-all"
          >
            <X className="w-3.5 h-3.5" />
            <span>Decline</span>
          </button>
        </div>
      )}

      {status === 'accepted' && (
        <div className="py-1 text-center text-success font-bold uppercase tracking-wider flex items-center justify-center gap-1 border border-emerald-100 bg-emerald-50 rounded-lg select-none">
          <Check className="w-3.5 h-3.5" />
          <span>Agreement Accepted</span>
        </div>
      )}

      {status === 'declined' && (
        <div className="py-1 text-center text-danger font-bold uppercase tracking-wider flex items-center justify-center gap-1 border border-red-100 bg-red-50 rounded-lg select-none">
          <X className="w-3.5 h-3.5" />
          <span>Agreement Declined</span>
        </div>
      )}

    </div>
  );
}
