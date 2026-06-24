import { useState, useEffect, useCallback } from 'react';

const API_BASE = import.meta.env.VITE_API_URL || (typeof window !== 'undefined' ? `http://${window.location.hostname}:5001/api` : 'http://localhost:5001/api');

// Generic Fetch Wrapper
async function fetchJson(url: string, options?: RequestInit) {
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers || {})
    }
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP error! status: ${res.status}`);
  }
  return res.json();
}

export function useUser(walletAddress: string | null) {
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUser = useCallback(async () => {
    if (!walletAddress) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchJson(`${API_BASE}/users/${walletAddress}`);
      setUser(data);
    } catch (err: any) {
      console.error("fetchUser error:", err);
      setError(err.message || "Failed to load user profile");
    } finally {
      setLoading(false);
    }
  }, [walletAddress]);

  const updateKycLevel = useCallback(async (kycLevel: number) => {
    if (!walletAddress) return;
    try {
      const data = await fetchJson(`${API_BASE}/users/${walletAddress}/kyc`, {
        method: 'PATCH',
        body: JSON.stringify({ kycLevel })
      });
      setUser(data);
      return data;
    } catch (err: any) {
      console.error("updateKycLevel error:", err);
      throw err;
    }
  }, [walletAddress]);

  const createProfile = useCallback(async (name?: string, email?: string) => {
    if (!walletAddress) return;
    try {
      const data = await fetchJson(`${API_BASE}/users`, {
        method: 'POST',
        body: JSON.stringify({ walletAddress, name, email })
      });
      setUser(data);
      return data;
    } catch (err: any) {
      console.error("createProfile error:", err);
      throw err;
    }
  }, [walletAddress]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  return { user, loading, error, refreshUser: fetchUser, updateKycLevel, createProfile };
}

export function useTransactions(walletAddress: string | null) {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTransactions = useCallback(async () => {
    if (!walletAddress) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchJson(`${API_BASE}/transactions/${walletAddress}`);
      setTransactions(data);
    } catch (err: any) {
      console.error("fetchTransactions error:", err);
      setError(err.message || "Failed to load transactions");
    } finally {
      setLoading(false);
    }
  }, [walletAddress]);

  const addTransaction = useCallback(async (txData: {
    type: string;
    amount?: string;
    status?: string;
    impact?: string;
    txHash?: string;
  }) => {
    if (!walletAddress) return;
    try {
      const newTx = await fetchJson(`${API_BASE}/transactions`, {
        method: 'POST',
        body: JSON.stringify({ walletAddress, ...txData })
      });
      setTransactions(prev => [newTx, ...prev]);
      return newTx;
    } catch (err: any) {
      console.error("addTransaction error:", err);
      throw err;
    }
  }, [walletAddress]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  return { transactions, loading, error, refreshTransactions: fetchTransactions, addTransaction };
}

export function useActiveLoan(walletAddress: string | null) {
  const [activeLoan, setActiveLoan] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchActiveLoan = useCallback(async () => {
    if (!walletAddress) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchJson(`${API_BASE}/loans/active/${walletAddress}`);
      setActiveLoan(data);
    } catch (err: any) {
      console.error("fetchActiveLoan error:", err);
      setError(err.message || "Failed to load active loan details");
    } finally {
      setLoading(false);
    }
  }, [walletAddress]);

  const requestLoan = useCallback(async (loanData: {
    amount: number;
    purpose: string;
    duration: number;
    interestRate?: number;
  }) => {
    if (!walletAddress) return;
    try {
      const data = await fetchJson(`${API_BASE}/loans/request`, {
        method: 'POST',
        body: JSON.stringify({ walletAddress, ...loanData })
      });
      setActiveLoan(data);
      return data;
    } catch (err: any) {
      console.error("requestLoan error:", err);
      throw err;
    }
  }, [walletAddress]);

  const repayLoan = useCallback(async (repayData: {
    amount: number;
    txHash?: string;
  }) => {
    if (!walletAddress) return;
    try {
      const data = await fetchJson(`${API_BASE}/loans/repay`, {
        method: 'POST',
        body: JSON.stringify({ walletAddress, ...repayData })
      });
      setActiveLoan(data.loan);
      return data;
    } catch (err: any) {
      console.error("repayLoan error:", err);
      throw err;
    }
  }, [walletAddress]);

  useEffect(() => {
    fetchActiveLoan();
  }, [fetchActiveLoan]);

  return { activeLoan, loading, error, refreshActiveLoan: fetchActiveLoan, requestLoan, repayLoan };
}

export function useLendPositions(walletAddress: string | null) {
  const [positions, setPositions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPositions = useCallback(async () => {
    if (!walletAddress) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchJson(`${API_BASE}/lend/positions/${walletAddress}`);
      setPositions(data);
    } catch (err: any) {
      console.error("fetchPositions error:", err);
      setError(err.message || "Failed to load lending positions");
    } finally {
      setLoading(false);
    }
  }, [walletAddress]);

  const createPosition = useCallback(async (posData: {
    amount: number;
    lockPeriod: string;
    apy: number;
  }) => {
    if (!walletAddress) return;
    try {
      const newPos = await fetchJson(`${API_BASE}/lend/positions`, {
        method: 'POST',
        body: JSON.stringify({ walletAddress, ...posData })
      });
      setPositions(prev => [newPos, ...prev]);
      return newPos;
    } catch (err: any) {
      console.error("createPosition error:", err);
      throw err;
    }
  }, [walletAddress]);

  const withdrawPosition = useCallback(async (positionId: string) => {
    if (!walletAddress) return;
    try {
      await fetchJson(`${API_BASE}/lend/positions/withdraw`, {
        method: 'POST',
        body: JSON.stringify({ walletAddress, positionId })
      });
      setPositions(prev => prev.filter(pos => pos.id !== positionId));
    } catch (err: any) {
      console.error("withdrawPosition error:", err);
      throw err;
    }
  }, [walletAddress]);

  useEffect(() => {
    fetchPositions();
  }, [fetchPositions]);

  return { positions, loading, error, refreshPositions: fetchPositions, createPosition, withdrawPosition };
}

export function useEndorsements(walletAddress: string | null) {
  const [endorsements, setEndorsements] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEndorsements = useCallback(async () => {
    if (!walletAddress) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchJson(`${API_BASE}/endorsements/${walletAddress}`);
      setEndorsements(data);
    } catch (err: any) {
      console.error("fetchEndorsements error:", err);
      setError(err.message || "Failed to load endorsements");
    } finally {
      setLoading(false);
    }
  }, [walletAddress]);

  const addEndorsement = useCallback(async (endorsementData: {
    name: string;
    comment: string;
    score?: number;
  }) => {
    if (!walletAddress) return;
    try {
      const newEnd = await fetchJson(`${API_BASE}/endorsements`, {
        method: 'POST',
        body: JSON.stringify({ walletAddress, ...endorsementData })
      });
      setEndorsements(prev => [newEnd, ...prev]);
      return newEnd;
    } catch (err: any) {
      console.error("addEndorsement error:", err);
      throw err;
    }
  }, [walletAddress]);

  useEffect(() => {
    fetchEndorsements();
  }, [fetchEndorsements]);

  return { endorsements, loading, error, refreshEndorsements: fetchEndorsements, addEndorsement };
}

export function useGuarantors(walletAddress: string | null) {
  const [guarantors, setGuarantors] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchGuarantors = useCallback(async () => {
    if (!walletAddress) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchJson(`${API_BASE}/guarantors/${walletAddress}`);
      setGuarantors(data);
    } catch (err: any) {
      console.error("fetchGuarantors error:", err);
      setError(err.message || "Failed to load guarantors");
    } finally {
      setLoading(false);
    }
  }, [walletAddress]);

  const addGuarantor = useCallback(async (guarantorData: {
    name: string;
    wallet: string;
    amount: number;
  }) => {
    if (!walletAddress) return;
    try {
      const newGur = await fetchJson(`${API_BASE}/guarantors`, {
        method: 'POST',
        body: JSON.stringify({ walletAddress, ...guarantorData })
      });
      setGuarantors(prev => [newGur, ...prev]);
      return newGur;
    } catch (err: any) {
      console.error("addGuarantor error:", err);
      throw err;
    }
  }, [walletAddress]);

  useEffect(() => {
    fetchGuarantors();
  }, [fetchGuarantors]);

  return { guarantors, loading, error, refreshGuarantors: fetchGuarantors, addGuarantor };
}

export function useLeaderboard() {
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLeaderboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchJson(`${API_BASE}/leaderboard`);
      setLeaderboard(data);
    } catch (err: any) {
      console.error("fetchLeaderboard error:", err);
      setError(err.message || "Failed to load leaderboard");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  return { leaderboard, loading, error, refreshLeaderboard: fetchLeaderboard };
}

export function useAdmin() {
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [queue, setQueue] = useState<any[]>([]);
  const [fraud, setFraud] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAdminData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsData, usersData, queueData, fraudData] = await Promise.all([
        fetchJson(`${API_BASE}/admin/stats`).catch(() => null),
        fetchJson(`${API_BASE}/users`).catch(() => []),
        fetchJson(`${API_BASE}/admin/queue`).catch(() => []),
        fetchJson(`${API_BASE}/admin/fraud`).catch(() => [])
      ]);
      setStats(statsData);
      setUsers(usersData);
      setQueue(queueData);
      setFraud(fraudData);
    } catch (err: any) {
      console.error("fetchAdminData error:", err);
      setError(err.message || "Failed to load admin data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAdminData();
  }, [fetchAdminData]);

  return {
    stats,
    users,
    queue,
    fraud,
    loading,
    error,
    refreshAdminData: fetchAdminData,
    setQueue,
    setUsers
  };
}

