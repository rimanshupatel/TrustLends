"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface User {
  name: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  isLoggedIn: boolean;
  kycLevel: number;
  loading: boolean;
  login: (email: string, password?: string) => Promise<void>;
  signup: (name: string, email: string, password?: string) => Promise<void>;
  logout: () => void;
  updateKycLevel: (level: number) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const setCookie = (name: string, value: string, days = 7) => {
  if (typeof window === 'undefined') return;
  const date = new Date();
  date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
  const expires = "; expires=" + date.toUTCString();
  document.cookie = name + "=" + (value || "") + expires + "; path=/";
};

const deleteCookie = (name: string) => {
  if (typeof window === 'undefined') return;
  document.cookie = name + '=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [kycLevel, setKycLevel] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const navigate = useNavigate();

  // Load auth state from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedUser = localStorage.getItem('trustlend_user');
      const storedKyc = localStorage.getItem('trustlend_kyc_level');
      const hasToken = document.cookie.includes('auth_token=');

      if (storedUser && hasToken) {
        setUser(JSON.parse(storedUser));
        setIsLoggedIn(true);
        const level = storedKyc ? parseInt(storedKyc, 10) : 0;
        setKycLevel(level);
        setCookie('kyc_level', level.toString());
      } else {
        // Clear cookies if localStorage is empty
        deleteCookie('auth_token');
        deleteCookie('kyc_level');
      }
      setLoading(false);
    }
  }, []);

  const login = async (email: string, password?: string) => {
    const walletAddress = typeof window !== 'undefined' ? localStorage.getItem('trustlend_wallet') : null;
    
    if (!walletAddress) {
      throw new Error("Please connect your Stellar Wallet first.");
    }

    const apiBase = import.meta.env.VITE_API_URL || (typeof window !== 'undefined' ? `http://${window.location.hostname}:5001/api` : 'http://localhost:5001/api');
    
    const payload = {
      walletAddress,
      email,
      password: password || 'password123'
    };

    const response = await fetch(`${apiBase.replace(/\/api$/, '')}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || "Failed to log in.");
    }

    const data = await response.json();
    const userData = data.user;
    const token = data.token;
    const finalKyc = userData.kycLevel !== undefined ? userData.kycLevel : 1;

    const userDataObj = { name: userData.name, email: userData.email };
    setUser(userDataObj);
    setIsLoggedIn(true);
    setKycLevel(finalKyc);

    localStorage.setItem('trustlend_user', JSON.stringify(userDataObj));
    localStorage.setItem('trustlend_kyc_level', finalKyc.toString());

    setCookie('auth_token', token);
    setCookie('kyc_level', finalKyc.toString());

    if (finalKyc >= 1) {
      navigate('/dashboard');
    } else {
      navigate('/kyc');
    }
  };

  const signup = async (name: string, email: string, password?: string) => {
    const walletAddress = typeof window !== 'undefined' ? localStorage.getItem('trustlend_wallet') : null;
    
    if (!walletAddress) {
      throw new Error("Please connect your Stellar Wallet first to associate it with your new profile.");
    }

    const apiBase = import.meta.env.VITE_API_URL || (typeof window !== 'undefined' ? `http://${window.location.hostname}:5001/api` : 'http://localhost:5001/api');
    
    const payload = {
      walletAddress,
      name,
      email,
      password: password || 'password123'
    };

    const response = await fetch(`${apiBase.replace(/\/api$/, '')}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || "Failed to create user profile in database.");
    }

    const data = await response.json();
    const userData = data.user;
    const token = data.token;
    const finalKyc = userData.kycLevel !== undefined ? userData.kycLevel : 1;

    const userDataObj = { name: userData.name, email: userData.email };
    setUser(userDataObj);
    setIsLoggedIn(true);
    setKycLevel(finalKyc);

    localStorage.setItem('trustlend_user', JSON.stringify(userDataObj));
    localStorage.setItem('trustlend_kyc_level', finalKyc.toString());

    setCookie('auth_token', token);
    setCookie('kyc_level', finalKyc.toString());

    if (finalKyc >= 1) {
      navigate('/dashboard');
    } else {
      navigate('/kyc');
    }
  };

  const logout = () => {
    setUser(null);
    setIsLoggedIn(false);
    setKycLevel(0);

    localStorage.removeItem('trustlend_user');
    localStorage.removeItem('trustlend_kyc_level');
    // Keep wallet state inside localStorage if connected, or clear it? 
    // The prompt says: "Sign Out button in sidebar bottom that clears auth state and redirects to /"
    // So we clear cookies and auth state
    deleteCookie('auth_token');
    deleteCookie('kyc_level');

    navigate('/');
  };

  const updateKycLevel = (level: number) => {
    setKycLevel(level);
    localStorage.setItem('trustlend_kyc_level', level.toString());
    setCookie('kyc_level', level.toString());
  };

  return (
    <AuthContext.Provider value={{ user, isLoggedIn, kycLevel, loading, login, signup, logout, updateKycLevel }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
