"use client";

import { useState } from "react";
import { useWallet } from "@/context/WalletContext";
import {
  callCreateEscrow,
  callReleaseFunds,
  callRefundFunds
} from "@/lib/contract";
import {
  Shield,
  Send,
  CheckCircle,
  AlertCircle,
  Loader2,
  Lock,
  Unlock,
  CornerDownLeft,
  Coins
} from "lucide-react";

export type TxState = "idle" | "pending" | "success" | "failed";

export function useTransactionStatus() {
  const [state, setState] = useState<TxState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  const setPending = () => {
    setState("pending");
    setError(null);
    setTxHash(null);
  };

  const setSuccess = (hash: string) => {
    setState("success");
    setTxHash(hash);
    setError(null);
  };

  const setFailed = (err: string) => {
    setState("failed");
    setError(err);
    setTxHash(null);
  };

  const reset = () => {
    setState("idle");
    setError(null);
    setTxHash(null);
  };

  return {
    state,
    error,
    txHash,
    setPending,
    setSuccess,
    setFailed,
    reset
  };
}

export default function EscrowActions() {
  const { walletAddress, isConnected, connectWallet } = useWallet();
  const txStatus = useTransactionStatus();

  const [activeTab, setActiveTab] = useState<"create" | "release" | "refund">("create");

  const [receiver, setReceiver] = useState("GDRNUHQGNSDT3FW6BLA7FRL4SXRSOUB2PV6HGPVSMML7FPLOECYWLDOA");

  const [amount, setAmount] = useState("10");
  const [escrowId, setEscrowId] = useState("");
  const [stepMessage, setStepMessage] = useState("");

  const handleCreateEscrow = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConnected || !walletAddress) {
      txStatus.setFailed("Please connect your wallet first.");
      return;
    }
    if (!receiver || !amount) {
      txStatus.setFailed("Please fill out all fields.");
      return;
    }

    txStatus.setPending();
    try {
      setStepMessage("Step 1/2: Sending XLM to escrow contract...");
      const hash = await callCreateEscrow(walletAddress, receiver, amount);
      txStatus.setSuccess(hash);
      setStepMessage("");
    } catch (err: any) {
      txStatus.setFailed(err.message || "Failed to create escrow.");
      setStepMessage("");
    }
  };

  const handleReleaseFunds = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConnected || !walletAddress) {
      txStatus.setFailed("Please connect your wallet first.");
      return;
    }
    if (!escrowId) {
      txStatus.setFailed("Please specify the Escrow ID.");
      return;
    }

    txStatus.setPending();
    try {
      const hash = await callReleaseFunds(escrowId, walletAddress);
      txStatus.setSuccess(hash);
    } catch (err: any) {
      txStatus.setFailed(err.message || "Failed to release funds.");
    }
  };

  const handleRefundFunds = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConnected || !walletAddress) {
      txStatus.setFailed("Please connect your wallet first.");
      return;
    }
    if (!escrowId) {
      txStatus.setFailed("Please specify the Escrow ID.");
      return;
    }

    txStatus.setPending();
    try {
      const hash = await callRefundFunds(escrowId, walletAddress);
      txStatus.setSuccess(hash);
    } catch (err: any) {
      txStatus.setFailed(err.message || "Failed to refund funds.");
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto bg-white border border-cardBorder rounded-3xl p-6 md:p-8 shadow-sm space-y-6 font-sans">

      {/* Title */}
      <div className="flex items-center justify-between pb-4 border-b border-borderCustom">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-primary" />
          <span className="text-sm font-black text-text-primary uppercase tracking-wider">
            Stellar Escrow Manager
          </span>
        </div>
        <div className="text-[10px] bg-slate-50 border border-borderCustom px-2.5 py-1 rounded-md text-text-muted font-bold font-mono">
          TESTNET
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="grid grid-cols-3 gap-2 bg-slate-50 p-1.5 rounded-2xl">
        <button
          onClick={() => { setActiveTab("create"); txStatus.reset(); }}
          className={`py-2 px-3 rounded-xl text-xs font-bold transition-all uppercase tracking-wider ${activeTab === "create"
            ? "bg-white text-primary shadow-sm"
            : "text-text-muted hover:text-text-secondary"
            }`}
        >
          Create
        </button>
        <button
          onClick={() => { setActiveTab("release"); txStatus.reset(); }}
          className={`py-2 px-3 rounded-xl text-xs font-bold transition-all uppercase tracking-wider ${activeTab === "release"
            ? "bg-white text-success shadow-sm"
            : "text-text-muted hover:text-text-secondary"
            }`}
        >
          Release
        </button>
        <button
          onClick={() => { setActiveTab("refund"); txStatus.reset(); }}
          className={`py-2 px-3 rounded-xl text-xs font-bold transition-all uppercase tracking-wider ${activeTab === "refund"
            ? "bg-white text-danger shadow-sm"
            : "text-text-muted hover:text-text-secondary"
            }`}
        >
          Refund
        </button>
      </div>

      {/* Content Form depending on Active Tab */}
      <div>
        {activeTab === "create" && (
          <form onSubmit={handleCreateEscrow} className="space-y-4">

            {/* Receiver Address */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-text-secondary uppercase tracking-wider block" htmlFor="receiver-input">
                Receiver Wallet Address (Lender / Vendor)
              </label>
              <input
                id="receiver-input"
                type="text"
                required
                placeholder="G..."
                value={receiver}
                onChange={(e) => setReceiver(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-text-secondary"
              />
            </div>



            {/* Amount */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-text-secondary uppercase tracking-wider block" htmlFor="amount-input">
                Amount to Deposit (e.g. XLM)
              </label>
              <div className="relative">
                <input
                  id="amount-input"
                  type="number"
                  step="0.0001"
                  required
                  min="0.0001"
                  placeholder="0.0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-4 pr-12 py-2.5 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-text-secondary font-bold"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] text-text-muted font-bold tracking-wider">
                  UNITS
                </span>
              </div>
            </div>

            {/* Submit Action */}
            {isConnected ? (
              <button
                type="submit"
                disabled={txStatus.state === "pending"}
                className="w-full py-3 bg-gradient-to-r from-primary to-accent hover:opacity-95 text-white font-bold rounded-xl text-xs uppercase tracking-wider shadow-sm hover:shadow transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {txStatus.state === "pending" ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Deploying Escrow...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>Create Escrow Deposit</span>
                  </>
                )}
              </button>
            ) : (
              <button
                type="button"
                onClick={connectWallet}
                className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-text-secondary font-bold rounded-xl text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5"
              >
                <Coins className="w-4 h-4 text-text-muted" />
                <span>Connect Wallet to Deposit</span>
              </button>
            )}

          </form>
        )}

        {activeTab === "release" && (
          <form onSubmit={handleReleaseFunds} className="space-y-4">

            {/* Escrow ID */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-text-secondary uppercase tracking-wider block" htmlFor="escrow-id-release">
                Escrow ID (Integer)
              </label>
              <input
                id="escrow-id-release"
                type="number"
                required
                min="1"
                placeholder="1"
                value={escrowId}
                onChange={(e) => setEscrowId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-text-secondary"
              />
            </div>

            <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-[10.5px] text-success leading-normal flex items-start gap-2">
              <CheckCircle className="w-4.5 h-4.5 text-success flex-shrink-0 mt-0.5" />
              <span>Only the designated receiver address can invoke fund release. The smart contract transfers the escrowed amount from its balance to the receiver.</span>
            </div>

            {/* Submit Action */}
            {isConnected ? (
              <button
                type="submit"
                disabled={txStatus.state === "pending"}
                className="w-full py-3 bg-success hover:opacity-95 text-white font-bold rounded-xl text-xs uppercase tracking-wider shadow-sm hover:shadow transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {txStatus.state === "pending" ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Releasing Funds...</span>
                  </>
                ) : (
                  <>
                    <Unlock className="w-4 h-4" />
                    <span>Release Escrow to Receiver</span>
                  </>
                )}
              </button>
            ) : (
              <button
                type="button"
                onClick={connectWallet}
                className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-text-secondary font-bold rounded-xl text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5"
              >
                <Coins className="w-4 h-4 text-text-muted" />
                <span>Connect Wallet to Release</span>
              </button>
            )}

          </form>
        )}

        {activeTab === "refund" && (
          <form onSubmit={handleRefundFunds} className="space-y-4">

            {/* Escrow ID */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-text-secondary uppercase tracking-wider block" htmlFor="escrow-id-refund">
                Escrow ID (Integer)
              </label>
              <input
                id="escrow-id-refund"
                type="number"
                required
                min="1"
                placeholder="1"
                value={escrowId}
                onChange={(e) => setEscrowId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-text-secondary"
              />
            </div>

            <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-[10.5px] text-danger leading-normal flex items-start gap-2">
              <AlertCircle className="w-4.5 h-4.5 text-danger flex-shrink-0 mt-0.5" />
              <span>Only the original depositor/sender address can invoke a refund. The smart contract returns the locked amount from its balance back to the sender.</span>
            </div>

            {/* Submit Action */}
            {isConnected ? (
              <button
                type="submit"
                disabled={txStatus.state === "pending"}
                className="w-full py-3 bg-danger hover:opacity-95 text-white font-bold rounded-xl text-xs uppercase tracking-wider shadow-sm hover:shadow transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {txStatus.state === "pending" ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Refunding Funds...</span>
                  </>
                ) : (
                  <>
                    <CornerDownLeft className="w-4 h-4" />
                    <span>Refund Escrow back to Sender</span>
                  </>
                )}
              </button>
            ) : (
              <button
                type="button"
                onClick={connectWallet}
                className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-text-secondary font-bold rounded-xl text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5"
              >
                <Coins className="w-4 h-4 text-text-muted" />
                <span>Connect Wallet to Refund</span>
              </button>
            )}

          </form>
        )}
      </div>

      {/* Transaction status card */}
      {txStatus.state !== "idle" && (
        <div className="mt-4 pt-4 border-t border-borderCustom space-y-2">

          {txStatus.state === "pending" && (
            <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl flex items-center gap-3">
              <Loader2 className="w-5 h-5 text-warning animate-spin flex-shrink-0" />
              <div className="space-y-0.5">
                <p className="text-xs font-bold text-warning uppercase tracking-wider">
                  ⏳ Transaction Pending
                </p>
                <p className="text-[10px] text-warning/90 font-medium">
                  {stepMessage || "Please approve inside Freighter popup and wait for ledger consensus commit."}
                </p>
              </div>
            </div>
          )}

          {txStatus.state === "success" && txStatus.txHash && (
            <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex flex-col gap-2">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-success flex-shrink-0" />
                <div className="space-y-0.5">
                  <p className="text-xs font-bold text-success uppercase tracking-wider">
                    ✅ Transaction Success!
                  </p>
                  <p className="text-[10px] text-success/90 font-medium">
                    State successfully written and processed by Soroban smart contract.
                  </p>
                </div>
              </div>
              <div className="text-[10.5px] font-mono text-text-secondary pl-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-t border-emerald-100/50 pt-2 mt-1">
                <span>Hash: {`${txStatus.txHash.slice(0, 8)}...${txStatus.txHash.slice(-8)}`}</span>
                <a
                  href={`https://stellar.expert/explorer/testnet/tx/${txStatus.txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary font-bold hover:underline inline-flex items-center gap-0.5"
                >
                  View on Stellar.expert ↗
                </a>
              </div>
            </div>
          )}

          {txStatus.state === "failed" && txStatus.error && (
            <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-danger flex-shrink-0" />
              <div className="space-y-0.5">
                <p className="text-xs font-bold text-danger uppercase tracking-wider">
                  ❌ Transaction Failed
                </p>
                <p className="text-[10px] text-danger/90 font-medium">
                  {txStatus.error}
                </p>
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
}
