import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { LogOut } from "lucide-react";

import { useAuth } from "@/context/AuthContext";
import { useWallet } from "@/context/WalletContext";
import WalletConnect from "@/components/ui/WalletConnect";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const { pathname } = useLocation();
  const { isLoggedIn } = useAuth();
  const { isConnected, walletAddress, disconnectWallet } = useWallet();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const isLandingPage = pathname === "/";

  const truncateWallet = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-all duration-200 ${
        scrolled
          ? "bg-white/80 backdrop-blur-md border-b border-borderCustom shadow-sm"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-1 font-sans text-xl font-bold text-text-primary group">
          <span>TrustLend</span>
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-gradient-to-r from-primary to-accent animate-pulse"></span>
          <span className="text-text-primary group-hover:text-primary transition-colors">X</span>
        </Link>

        {/* Nav Links */}
        {isLandingPage ? (
          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm font-medium text-text-secondary hover:text-primary transition-colors">
              Features
            </a>
            <a href="#how-it-works" className="text-sm font-medium text-text-secondary hover:text-primary transition-colors">
              How it works
            </a>
            <Link to="/lend" className="text-sm font-medium text-text-secondary hover:text-primary transition-colors">
              Lend
            </Link>
            <a href="#docs" className="text-sm font-medium text-text-secondary hover:text-primary transition-colors">
              Docs
            </a>
          </nav>
        ) : (
          <nav className="hidden md:flex items-center gap-8">
            <Link to="/" className="text-sm font-medium text-text-secondary hover:text-primary transition-colors">
              Home
            </Link>
            <Link to="/dashboard" className="text-sm font-medium text-text-secondary hover:text-primary transition-colors">
              Dashboard
            </Link>
            <Link to="/lend" className="text-sm font-medium text-text-secondary hover:text-primary transition-colors">
              Lend Marketplace
            </Link>
            <Link to="/borrow" className="text-sm font-medium text-text-secondary hover:text-primary transition-colors">
              Borrow Capital
            </Link>
          </nav>
        )}

        {/* Actions */}
        <div className="flex items-center gap-4">
          {isConnected && walletAddress ? (
            <div className="flex items-center gap-3">
              {/* Wallet Pill */}
              <div className="flex items-center gap-1.5 px-3 py-1.5 border border-emerald-250 bg-emerald-50 text-success rounded-xl font-mono text-xs font-semibold select-none shadow-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                <span>{truncateWallet(walletAddress)}</span>
              </div>
              {/* Disconnect button */}
              <button
                onClick={disconnectWallet}
                title="Disconnect Wallet"
                className="p-1.5 border border-slate-200 hover:bg-red-50 hover:text-danger rounded-xl transition-all duration-150 text-text-muted"
              >
                <LogOut className="w-4 h-4" />
              </button>
              <Link
                to="/dashboard"
                className="px-5 py-2.5 bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white font-bold rounded-xl text-xs uppercase tracking-wider shadow-sm hover:shadow-md transition-all duration-150"
              >
                Go to App
              </Link>
            </div>
          ) : (
            <>
              <div className="hidden sm:block">
                <WalletConnect showDisconnect={false} className="border-primary text-primary hover:bg-primary-light font-semibold px-4 py-2 text-xs" />
              </div>
              <Link
                to={isLoggedIn ? "/dashboard" : "/auth/signup"}
                className="px-5 py-2.5 bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white font-bold rounded-xl text-xs uppercase tracking-wider shadow-sm hover:shadow-md transition-all duration-150"
              >
                Launch App
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
