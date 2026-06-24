"use client";

import { useState } from "react";
import { useWallet } from "@/context/WalletContext";
import { sendXLMPayment } from "@/lib/stellar";
import { X, Send, CheckCircle, XCircle, RefreshCw, ShieldCheck } from "lucide-react";

interface SendTransactionProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SendTransaction({ isOpen, onClose }: SendTransactionProps) {
  const { walletAddress, xlmBalance, fetchBalance, setError } = useWallet();
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [memo, setMemo] = useState("");

  // Status: 'idle' | 'processing' | 'success' | 'failure'
  const [status, setStatus] = useState<'idle' | 'processing' | 'success' | 'failure'>('idle');
  const [txHash, setTxHash] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  if (!isOpen) return null;

  // Balance calculation
  const currentBalance = xlmBalance ? parseFloat(xlmBalance.split(" ")[0]) : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!walletAddress) {
      setError("Please connect your wallet first.");
      setErrorMessage("Please connect your wallet first.");
      setStatus('failure');
      return;
    }

    // Validate recipient Stellar address format: starts with G, 56 characters
    const stellarAddressRegex = /^G[A-D2-7][A-Z2-7]{54}$/;
    if (!stellarAddressRegex.test(recipient)) {
      setErrorMessage("Invalid Stellar address format. It must start with 'G' and be 56 characters long.");
      setStatus('failure');
      return;
    }

    // Validate amount
    const paymentAmount = parseFloat(amount);
    if (isNaN(paymentAmount) || paymentAmount <= 0) {
      setErrorMessage("Please enter an amount greater than 0.");
      setStatus('failure');
      return;
    }

    // Frontend pre-check: if (parseFloat(amount) > parseFloat(xlmBalance)) before calling sendXLMPayment
    if (!xlmBalance || parseFloat(amount) > parseFloat(xlmBalance)) {
      setErrorMessage("Not enough XLM to complete this transaction.");
      setStatus('failure');
      return;
    }

    // Execute payment on Stellar Testnet
    setStatus('processing');
    try {
      if (!walletAddress) {
        throw new Error("No wallet connected.");
      }
      const hash = await sendXLMPayment(walletAddress, recipient, amount, memo);
      setTxHash(hash);
      setStatus('success');
      // Refresh balance after successful payment
      await fetchBalance();
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to process transaction.");
      setStatus('failure');
    }
  };

  const resetForm = () => {
    setRecipient("");
    setAmount("");
    setMemo("");
    setStatus('idle');
    setTxHash("");
    setErrorMessage("");
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden flex flex-col animate-scale-in">

        {/* Header */}
        <div className="h-14 border-b border-slate-100 px-5 flex items-center justify-between">
          <span className="text-sm font-bold text-text-primary uppercase tracking-wider">Send XLM Assets</span>
          <button
            onClick={handleClose}
            className="p-1 hover:bg-slate-50 text-text-muted hover:text-text-primary rounded-lg transition-colors"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6">
          {status === 'idle' && (
            <form onSubmit={handleSubmit} className="space-y-4">

              {/* Sender Balance Info */}
              <div className="flex justify-between items-center text-xs text-text-muted font-medium bg-slate-50 border border-slate-100 p-3 rounded-xl">
                <span>Available Balance:</span>
                <span className="font-mono text-text-primary font-bold">{currentBalance.toFixed(4)} XLM</span>
              </div>

              {/* Recipient Address */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-text-secondary uppercase tracking-wider block" htmlFor="recipient-input">
                  Recipient Address
                </label>
                <input
                  id="recipient-input"
                  type="text"
                  required
                  placeholder="GB7F3A..."
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-text-secondary"
                />
              </div>

              {/* Amount in XLM */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-text-secondary uppercase tracking-wider block" htmlFor="amount-input">
                  Amount (XLM)
                </label>
                <input
                  id="amount-input"
                  type="number"
                  step="0.0001"
                  required

                  placeholder="0.0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-text-secondary"
                />
              </div>

              {/* Memo */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-text-secondary uppercase tracking-wider block" htmlFor="memo-input">
                  Memo <span className="text-[10px] text-text-muted font-normal">(Optional)</span>
                </label>
                <input
                  id="memo-input"
                  type="text"
                  placeholder="Text memo"
                  value={memo}
                  onChange={(e) => setMemo(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-text-secondary font-medium"
                />
              </div>

              <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl text-[10.5px] text-primary leading-normal flex items-start gap-1.5 font-medium">
                <ShieldCheck className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>Signing via Freighter wallet. Make sure to confirm details in the popup window.</span>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-gradient-to-r from-primary to-accent hover:opacity-95 text-white font-bold rounded-xl text-xs uppercase tracking-wider shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send Payment</span>
              </button>
            </form>
          )}

          {status === 'processing' && (
            <div className="py-8 text-center space-y-4">
              <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin mx-auto" />
              <div className="space-y-1.5">
                <p className="text-sm font-bold text-text-primary">Processing Transaction...</p>
                <p className="text-xs text-text-muted max-w-[280px] mx-auto leading-relaxed">
                  Building transaction, awaiting Freighter wallet signature and Stellar testnet consensus confirmation.
                </p>
              </div>
            </div>
          )}

          {status === 'success' && (
            <div className="py-6 text-center space-y-5 animate-fade-in">
              <div className="w-14 h-14 bg-emerald-50 border border-emerald-100 text-success rounded-full flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle className="w-8 h-8 animate-bounce-short" />
              </div>

              <div className="space-y-2">
                <p className="text-base font-bold text-text-primary">Transaction Successful!</p>
                <p className="text-xs text-text-secondary">
                  Successfully sent <strong className="text-text-primary">{amount} XLM</strong> to recipient.
                </p>
                <div className="px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl font-mono text-[10px] text-text-secondary select-all break-all max-w-[340px] mx-auto">
                  {txHash}
                </div>
              </div>

              <div className="space-y-2.5 pt-2">
                <a
                  href={`https://stellar.expert/explorer/testnet/tx/${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-primary font-bold hover:underline"
                >
                  <span>View on Stellar Explorer →</span>
                </a>
                <button
                  onClick={handleClose}
                  className="w-full py-2.5 border border-slate-200 hover:bg-slate-50 text-text-secondary text-xs font-semibold rounded-xl transition-all"
                >
                  Close
                </button>
              </div>
            </div>
          )}

          {status === 'failure' && (
            <div className="py-6 text-center space-y-5 animate-fade-in">
              <div className="w-14 h-14 bg-red-50 border border-red-100 text-danger rounded-full flex items-center justify-center mx-auto shadow-sm">
                <XCircle className="w-8 h-8" />
              </div>

              <div className="space-y-2">
                <p className="text-base font-bold text-text-primary">Transaction Failed</p>
                <p className="text-xs text-danger leading-relaxed max-w-[320px] mx-auto font-medium">
                  {errorMessage}
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={resetForm}
                  className="flex-1 py-2.5 bg-gradient-to-r from-primary to-accent hover:opacity-95 text-white text-xs font-semibold rounded-xl shadow"
                >
                  Try Again
                </button>
                <button
                  onClick={handleClose}
                  className="flex-1 py-2.5 border border-slate-200 hover:bg-slate-50 text-text-secondary text-xs font-semibold rounded-xl"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
