"use client";

import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useWallet } from "@/context/WalletContext";
import WalletConnect from "@/components/ui/WalletConnect";
import { ArrowRight, UserPlus, Mail, Lock, ShieldCheck, Eye, EyeOff } from "lucide-react";

export default function SignupPage() {
  const { signup } = useAuth();
  const { walletAddress, isConnected } = useWallet();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) {
      setError("Please fill out all fields.");
      return;
    }
    setError("");
    setIsSubmitting(true);
    try {
      await signup(name, email, password);
    } catch (err: any) {
      setError(err.message || "Failed to create account.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans">
      <div className="w-full max-w-[440px] bg-white shadow-xl border border-slate-100 rounded-3xl p-8 space-y-7 animate-fade-in">
        
        {/* Logo and Header */}
        <div className="text-center space-y-2">
          <Link to="/" className="inline-flex items-center gap-1.5 text-2xl font-black text-text-primary tracking-tight">
            <span className="flex items-center justify-center w-9 h-9 rounded-xl bg-primary text-white font-mono text-xl font-black shadow-md shadow-primary/20">T</span>
            <span>TrustLend</span>
            <span className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-primary to-accent animate-pulse" />
            <span className="text-primary">X</span>
          </Link>
          <p className="text-xs text-text-muted font-medium pt-1">
            Create your decentralized AI-powered credit profile
          </p>
        </div>

        {/* Wallet Connection Status Badge */}
        <div className="flex justify-center -mt-2">
          {isConnected && walletAddress ? (
            <div className="flex items-center gap-2 px-3 py-1.5 border border-emerald-250 bg-emerald-50 text-success rounded-full text-xs font-semibold select-none shadow-sm">
              <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
              <span className="font-mono">{`${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`}</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1.5 border border-red-200 bg-red-50 text-danger rounded-full text-xs font-semibold select-none shadow-sm">
              <span className="w-2 h-2 rounded-full bg-danger" />
              <span>No wallet connected</span>
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-xs text-danger font-medium flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-danger" />
            <span>{error}</span>
          </div>
        )}

        {/* Signup Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Full Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-text-secondary uppercase tracking-wider block" htmlFor="name-input">
              Full Name
            </label>
            <div className="relative">
              <UserPlus className="w-4 h-4 text-text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="name-input"
                type="text"
                required
                placeholder="Arjun Sharma"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-text-secondary font-medium transition-all"
              />
            </div>
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-text-secondary uppercase tracking-wider block" htmlFor="email-input">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="email-input"
                type="email"
                required
                placeholder="arjun@stellar.org"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-text-secondary font-medium transition-all"
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-text-secondary uppercase tracking-wider block" htmlFor="password-input">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="password-input"
                type={showPassword ? "text" : "password"}
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-10 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-text-secondary font-medium transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary focus:outline-none"
              >
                {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
              </button>
            </div>
          </div>

          {/* Wallet Connect Section */}
          <div className="space-y-1.5 pt-2">
            <label className="text-xs font-bold text-text-secondary uppercase tracking-wider block">
              Stellar Wallet Association
            </label>
            <WalletConnect showDisconnect={false} />
          </div>

          {/* ZK Privacy Shield Label */}
          <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-xl text-[10.5px] text-primary leading-normal flex items-start gap-2 font-medium">
            <ShieldCheck className="w-4.5 h-4.5 text-primary flex-shrink-0 mt-0.5" />
            <span>Registration creates a zero-knowledge commitment profile. Your passwords and private files remain fully encrypted locally.</span>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 bg-gradient-to-r from-primary to-accent hover:opacity-95 text-white font-bold rounded-xl text-xs uppercase tracking-wider shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-1.5"
          >
            <span>Create Profile</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Navigation to Sign In */}
        <div className="text-center pt-2">
          <p className="text-xs text-text-secondary font-medium">
            Already have an account?{" "}
            <Link to="/auth/signin" className="text-primary hover:underline font-bold">
              Sign In
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
}
