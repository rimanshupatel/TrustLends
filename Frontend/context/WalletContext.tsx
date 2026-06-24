"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  checkFreighterInstalled,
  getConnectedWalletAddress,
  checkNetworkIsTestnet,
  fetchXLMBalance
} from '@contracts/stellar';

interface WalletContextType {
  walletAddress: string | null;
  isConnected: boolean;
  xlmBalance: string | null;
  error: string | null;
  setError: React.Dispatch<React.SetStateAction<string | null>>;
  isConnecting: boolean;
  isFunding: boolean;
  isSendModalOpen: boolean;
  setSendModalOpen: (isOpen: boolean) => void;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  fetchBalance: () => Promise<void>;
  fundAccount: () => Promise<void>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const { logout } = useAuth();
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [xlmBalance, setXlmBalance] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [isFunding, setIsFunding] = useState<boolean>(false);

  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Load wallet from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedAddress = localStorage.getItem('trustlend_wallet');
      if (savedAddress) {
        setWalletAddress(savedAddress);
        setIsConnected(true);
      }
    }
  }, []);

  const fetchBalance = useCallback(async () => {
    if (!walletAddress) return;
    try {
      // Clear network or fetch errors before retry
      if (error && error !== 'UNFUNDED_ACCOUNT' && error !== 'INSTALL_FREIGHTER' && error !== 'WRONG_NETWORK') {
        setError(null);
      }

      const balance = await fetchXLMBalance(walletAddress);
      setXlmBalance(`${balance} XLM`);

      // If we previously had an unfunded error, clear it
      if (error === 'UNFUNDED_ACCOUNT') {
        setError(null);
      }
    } catch (err: any) {
      if (err.message === 'UNFUNDED_ACCOUNT') {
        setXlmBalance('0.0000 XLM');
        setError('UNFUNDED_ACCOUNT');
      } else {
        setError('NETWORK_ERROR');
      }
    }
  }, [walletAddress, error]);

  const connectWallet = async () => {
    setIsConnecting(true);
    setError(null);
    try {
      // 1. Check if Freighter is installed
      const installed = await checkFreighterInstalled();
      if (!installed) {
        setError('INSTALL_FREIGHTER');
        setIsConnecting(false);
        return;
      }

      // 2. Check if Freighter is on Testnet
      const isTestnet = await checkNetworkIsTestnet();
      if (!isTestnet) {
        setError('WRONG_NETWORK');
        setIsConnecting(false);
        return;
      }

      // 3. Request address
      const address = await getConnectedWalletAddress();

      // Fetch or Create user profile in MongoDB Atlas
      const apiBase = import.meta.env.VITE_API_URL || (typeof window !== 'undefined' ? `http://${window.location.hostname}:5001/api` : 'http://localhost:5001/api');
      const userRes = await fetch(`${apiBase}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress: address
        })
      });

      if (!userRes.ok) {
        throw new Error(`Server profile sync failed with status ${userRes.status}`);
      }

      const userData = await userRes.json();
      const finalKyc = userData.kycLevel !== undefined ? userData.kycLevel : 1;

      if (typeof window !== 'undefined') {
        localStorage.setItem('trustlend_wallet', address);
        localStorage.setItem('trustlend_user', JSON.stringify({ name: userData.name, email: userData.email }));
        // Sync to cookies for KYC Level Check
        document.cookie = `kyc_level=${finalKyc}; path=/`;
        // Also update local storage KYC level
        localStorage.setItem('trustlend_kyc_level', finalKyc.toString());
      }

      // 4. Update React state only after successful sync and storage
      setWalletAddress(address);
      setIsConnected(true);
    } catch (err: any) {
      console.error("Wallet connection failed:", err);
      setError(err.message || "Failed to connect wallet.");
      // Clear out state on failure to ensure consistency
      setWalletAddress(null);
      setIsConnected(false);
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectWallet = () => {
    setWalletAddress(null);
    setIsConnected(false);
    setXlmBalance(null);
    setError(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('trustlend_wallet');
      // If logging out, clear KYC cookies
      document.cookie = "kyc_level=0; path=/";
      const localKyc = localStorage.getItem('trustlend_kyc_level');
      if (localKyc && parseInt(localKyc, 10) === 1) {
        localStorage.setItem('trustlend_kyc_level', '0');
      }
    }
    logout();
  };

  const [isSendModalOpen, setSendModalOpen] = useState<boolean>(false);

  // Fund account at friendbot (useful for testing on Testnet)
  const fundAccount = async () => {
    if (!walletAddress) return;
    setIsFunding(true);
    setError(null);
    try {
      const response = await fetch(`https://friendbot.stellar.org/?addr=${walletAddress}`);
      if (response.ok) {
        // Success funding! Refresh balance immediately
        await fetchBalance();
      } else {
        throw new Error("Friendbot failed to disburse funds. Please try again later.");
      }
    } catch (err: any) {
      setError("Friendbot funding failed: " + err.message);
    } finally {
      setIsFunding(false);
    }
  };

  // Trigger balance fetch on connect or address changes
  useEffect(() => {
    if (isConnected && walletAddress) {
      fetchBalance();

      // Poll every 30 seconds
      pollIntervalRef.current = setInterval(() => {
        fetchBalance();
      }, 30000);
    } else {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    }

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [isConnected, walletAddress, fetchBalance]);

  return (
    <WalletContext.Provider value={{
      walletAddress,
      isConnected,
      xlmBalance,
      error,
      setError,
      isConnecting,
      isFunding,
      isSendModalOpen,
      setSendModalOpen,
      connectWallet,
      disconnectWallet,
      fetchBalance,
      fundAccount
    }}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
}
