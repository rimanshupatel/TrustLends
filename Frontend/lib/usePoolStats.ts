import { useState, useEffect } from 'react';
import { server as horizonServer } from '@/lib/stellar';

export function usePoolStats() {
  const [poolBalance, setPoolBalance] = useState<string | null>(null);
  const [averageApy, setAverageApy] = useState<number | null>(null);
  const [activeBorrowers, setActiveBorrowers] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const treasuryAddress = import.meta.env.VITE_POOL_TREASURY_ADDRESS || 'GDRNUHQGNSDT3FW6BLA7FRL4SXRSOUB2PV6HGPVSMML7FPLOECYWLDOA';

    // Dynamically calculate the API base URL based on environment or current host
    const apiBase = import.meta.env.VITE_API_URL || (typeof window !== 'undefined'
      ? `http://${window.location.hostname}:5001/api`
      : 'http://localhost:5001/api');

    const fetchData = async () => {
      try {
        // 1. Fetch XLM balance of Pool Treasury from Horizon
        const account = await horizonServer.loadAccount(treasuryAddress);
        const nativeBalanceObj = account.balances.find(b => b.asset_type === 'native');
        const balance = nativeBalanceObj ? parseFloat(nativeBalanceObj.balance) : 0;

        // Display formatted as "X,XXX.XXXX XLM"
        const formattedBalance = balance.toLocaleString('en-US', {
          minimumFractionDigits: 4,
          maximumFractionDigits: 4
        }) + " XLM";
        setPoolBalance(formattedBalance);

        // 2. Fetch stats from backend API
        const lendRes = await fetch(`${apiBase}/lend/stats`);
        if (!lendRes.ok) throw new Error("Failed to fetch lending stats");
        const lendData = await lendRes.json();

        // 3. Fetch stats from admin API
        const adminRes = await fetch(`${apiBase}/admin/stats`);
        if (!adminRes.ok) throw new Error("Failed to fetch admin stats");
        const adminData = await adminRes.json();

        setAverageApy(lendData.averageApy || 15.4);
        setActiveBorrowers(adminData.activeBorrowers || lendData.activeBorrowers || 1842);

        setError(null);
      } catch (err: any) {
        console.error("Error fetching pool stats:", err);
        setError(err.message || "Failed to load pool statistics");
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Poll every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  return { poolBalance, averageApy, activeBorrowers, loading, error };
}
