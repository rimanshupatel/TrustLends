"use client";

import { useWallet } from "@/context/WalletContext";
import { Wallet, LogOut, ArrowRight, ShieldAlert, Download, RefreshCw } from "lucide-react";

interface WalletConnectProps {
  className?: string;
  showDisconnect?: boolean;
}

export default function WalletConnect({ className = "", showDisconnect = true }: WalletConnectProps) {
  const { 
    walletAddress, 
    isConnected, 
    isConnecting, 
    error, 
    connectWallet, 
    disconnectWallet 
  } = useWallet();

  const truncateWallet = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  if (isConnected && walletAddress) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        {/* Connected Badge Pill */}
        <div className="flex items-center gap-2 px-3 py-1.5 border border-emerald-250 bg-emerald-50 text-success rounded-full text-xs font-semibold select-none shadow-sm animate-fade-in">
          <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
          <span className="font-mono">{truncateWallet(walletAddress)}</span>
        </div>
        {showDisconnect && (
          <button
            onClick={disconnectWallet}
            title="Disconnect Wallet"
            className="p-1.5 border border-slate-200 hover:bg-red-50 hover:text-danger rounded-xl transition-all duration-150 text-text-muted"
          >
            <LogOut className="w-4 h-4" />
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2.5 w-full">
      <button
        type="button"
        disabled={isConnecting}
        onClick={connectWallet}
        className={`w-full px-5 py-2.5 border-2 border-primary text-primary hover:bg-primary-light font-bold rounded-xl text-sm transition-all duration-150 flex items-center justify-center gap-2 shadow-sm hover:shadow ${className}`}
      >
        {isConnecting ? (
          <>
            <RefreshCw className="w-4.5 h-4.5 animate-spin" />
            <span>Connecting Freighter...</span>
          </>
        ) : (
          <>
            <Wallet className="w-4.5 h-4.5" />
            <span>Connect Stellar Wallet</span>
          </>
        )}
      </button>

      {/* Error handling inline alerts */}
      {error === 'INSTALL_FREIGHTER' && (
        <div className="p-3 bg-red-50 border border-red-100 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-danger shadow-sm animate-shake">
          <div className="flex items-center gap-2 font-medium">
            <ShieldAlert className="w-4.5 h-4.5 flex-shrink-0" />
            <span>Freighter Wallet extension is not installed.</span>
          </div>
          <a
            href="https://www.freighter.app"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 bg-danger text-white font-bold rounded-lg hover:opacity-90 transition-all flex items-center gap-1 text-[11px] uppercase tracking-wider"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Install</span>
          </a>
        </div>
      )}

      {error === 'WRONG_NETWORK' && (
        <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl flex items-start gap-2 text-xs text-warning shadow-sm animate-fade-in font-medium">
          <ShieldAlert className="w-4.5 h-4.5 text-warning flex-shrink-0 mt-0.5" />
          <span>Please switch network to <strong>Stellar Testnet</strong> in Freighter wallet and try again.</span>
        </div>
      )}

      {error && error !== 'INSTALL_FREIGHTER' && error !== 'WRONG_NETWORK' && error !== 'UNFUNDED_ACCOUNT' && (
        <div className="p-3 bg-red-50 border border-red-100 rounded-xl flex items-start gap-2 text-xs text-danger shadow-sm font-medium">
          <ShieldAlert className="w-4.5 h-4.5 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
