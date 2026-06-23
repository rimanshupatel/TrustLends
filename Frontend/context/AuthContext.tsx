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
  login: (email: string, name?: string) => Promise<void>;
  signup: (name: string, email: string) => Promise<void>;
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
    }
  }, []);

  const login = async (email: string, name = "Arjun Sharma") => {
    // Standard mock login
    const userData = { name, email };
    setUser(userData);
    setIsLoggedIn(true);
    
    // Check if there is an existing kyc level, default to 2 for Arjun, or 0 for new signups
    const defaultKyc = email.toLowerCase().includes("arjun") ? 2 : 0;
    const currentKyc = localStorage.getItem('trustlend_kyc_level') 
      ? parseInt(localStorage.getItem('trustlend_kyc_level')!, 10) 
      : defaultKyc;
      
    setKycLevel(currentKyc);
    localStorage.setItem('trustlend_user', JSON.stringify(userData));
    localStorage.setItem('trustlend_kyc_level', currentKyc.toString());

    setCookie('auth_token', 'true');
    setCookie('kyc_level', currentKyc.toString());

    if (currentKyc >= 1) {
      navigate('/dashboard');
    } else {
      navigate('/kyc');
    }
  };

  const signup = async (name: string, email: string) => {
    const userData = { name, email };
    setUser(userData);
    setIsLoggedIn(true);
    setKycLevel(0);

    localStorage.setItem('trustlend_user', JSON.stringify(userData));
    localStorage.setItem('trustlend_kyc_level', '0');

    setCookie('auth_token', 'true');
    setCookie('kyc_level', '0');

    // After signup -> auto redirect to kyc
    navigate('/kyc');
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
    <AuthContext.Provider value={{ user, isLoggedIn, kycLevel, login, signup, logout, updateKycLevel }}>
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
