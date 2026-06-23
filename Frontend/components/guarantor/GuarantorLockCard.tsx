"use client";

import { useState } from "react";
import Tooltip from "@/components/ui/Tooltip";
import { Lock, Unlock, HelpCircle, CheckCircle, RefreshCw } from "lucide-react";

export interface LockedGuaranteeItem {
  id: string;
  borrowerName: string;
  borrowerScore: number;
  amount: string;
  duration: string;
  status: string;
  repaidProgress: number; // 0 to 100
}

interface GuarantorLockCardProps {
  guarantee: LockedGuaranteeItem;
  onExitSuccess: (id: string) => void;
}

export default function GuarantorLockCard({ guarantee, onExitSuccess }: GuarantorLockCardProps) {
  const [isReleasing, setIsReleasing] = useState(false);
  const [isEarlyRequestSent, setIsEarlyRequestSent] = useState(false);

  const canExit = guarantee.repaidProgress === 100 || guarantee.status === "Replacement Pending";
  const showEarlyRelease = guarantee.repaidProgress >= 80 && guarantee.repaidProgress < 100 && guarantee.status !== "Replacement Pending";

  const handleExit = () => {
    if (!canExit) return;
    setIsReleasing(true);
    setTimeout(() => {
      setIsReleasing(false);
      onExitSuccess(guarantee.id);
      alert(`Success! You have exited the guarantor agreement for ${guarantee.borrowerName}.`);
    }, 1500);
  };

  const handleRequestEarlyRelease = () => {
    setIsEarlyRequestSent(true);
    alert(`Early release request for ${guarantee.borrowerName}'s loan has been submitted to platform admins.`);
  };

  return (
    <div className="bg-white border border-cardBorder rounded-xl p-5 shadow-sm space-y-4 hover:shadow-md transition-shadow animate-fade-in font-sans text-xs">
      
      {/* Header */}
      <div className="flex items-start justify-between border-b border-slate-100 pb-3">
        <div>
          <h4 className="font-bold text-text-primary text-xs">{guarantee.borrowerName}</h4>
          <p className="text-[10px] text-text-muted mt-0.5">Borrower score: {guarantee.borrowerScore}</p>
        </div>

        {guarantee.repaidProgress === 100 ? (
          <span className="px-2 py-0.5 border bg-emerald-50 text-success border-emerald-100 text-[10px] font-bold rounded-full flex items-center gap-1">
            <CheckCircle className="w-3 h-3" />
            <span>Released</span>
          </span>
        ) : guarantee.status === "Replacement Pending" ? (
          <span className="px-2 py-0.5 border bg-blue-50 text-primary border-blue-100 text-[10px] font-bold rounded-full">
            Replacement Pending
          </span>
        ) : (
          <span className="px-2 py-0.5 border bg-amber-50 text-warning border-amber-100 text-[10px] font-bold rounded-full flex items-center gap-1">
            <Lock className="w-3 h-3 text-warning" />
            <span>Active Lock</span>
          </span>
        )}
      </div>

      {/* Progress & Info */}
      <div className="space-y-3">
        <div className="flex justify-between items-center text-text-secondary font-medium">
          <span>Liability Value:</span>
          <span className="font-mono text-text-primary font-bold">{guarantee.amount}</span>
        </div>

        <div className="flex justify-between items-center text-text-secondary font-medium">
          <span>Term Remaining:</span>
          <span className="text-text-primary font-semibold">{guarantee.duration}</span>
        </div>

        {/* Repayment Progress bar */}
        <div className="space-y-1.5 pt-1">
          <div className="flex justify-between text-[10px] text-text-secondary font-semibold">
            <span>Repayment Progress</span>
            <span className="font-mono">{guarantee.repaidProgress}%</span>
          </div>
          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-500 ${
                guarantee.repaidProgress === 100 ? "bg-success" : "bg-primary"
              }`}
              style={{ width: `${guarantee.repaidProgress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Obligation notice */}
      <p className="text-[10px] text-text-muted leading-relaxed pt-1">
        Your obligation remains active regardless of your online status. Smart contract enforces penalties automatically.
      </p>

      {/* Actions */}
      <div className="pt-2 flex items-center gap-2">
        {canExit ? (
          <button
            onClick={handleExit}
            disabled={isReleasing}
            className="w-full py-2 bg-gradient-to-r from-primary to-accent hover:opacity-95 text-white font-bold rounded-lg text-[10px] uppercase tracking-wider shadow-sm flex items-center justify-center gap-1.5 transition-all"
          >
            {isReleasing ? (
              <>
                <RefreshCw className="w-3 h-3 animate-spin" />
                <span>Exiting...</span>
              </>
            ) : (
              <>
                <Unlock className="w-3.5 h-3.5" />
                <span>Exit Agreement</span>
              </>
            )}
          </button>
        ) : showEarlyRelease ? (
          <button
            onClick={handleRequestEarlyRelease}
            disabled={isEarlyRequestSent}
            className="w-full py-2 bg-white border border-primary text-primary hover:bg-primary-light font-bold rounded-lg text-[10px] uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
          >
            <span>{isEarlyRequestSent ? "Request Pending Review" : "Request Early Release"}</span>
          </button>
        ) : (
          <Tooltip content="Cannot exit — loan still active">
            <button
              disabled
              className="w-full py-2 bg-slate-100 text-slate-400 border border-slate-200 font-bold rounded-lg text-[10px] uppercase tracking-wider cursor-not-allowed flex items-center justify-center gap-1.5"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Exit Locked</span>
            </button>
          </Tooltip>
        )}
      </div>

    </div>
  );
}
