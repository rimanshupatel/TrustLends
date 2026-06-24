import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { WalletProvider, useWallet } from '@/context/WalletContext';

// Page imports
import LandingPage from '@/app/page';
import SignupPage from '@/app/auth/signup/page';
import SigninPage from '@/app/auth/signin/page';
import KYCPage from '@/app/kyc/page';
import Dashboard from '@/app/dashboard/page';
import BorrowPage from '@/app/borrow/page';
import LendPage from '@/app/lend/page';
import SocialTrustPage from '@/app/social/page';
import AnalyticsPage from '@/app/analytics/page';
import AdminPanelPage from '@/app/admin/page';
import EscrowActions from "@/components/EscrowActions";
// Route Guard - Must be signed in
function RequireAuth({ children }: { children: React.ReactNode }) {
  const { isLoggedIn, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin"></div>
          <p className="text-sm font-semibold text-slate-500">Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return <Navigate to="/auth/signin" replace />;
  }
  return <>{children}</>;
}

// Route Guard - Must be signed in + KYC level 1 complete (wallet linked)
function RequireKyc({ children }: { children: React.ReactNode }) {
  const { isLoggedIn, kycLevel, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin"></div>
          <p className="text-sm font-semibold text-slate-500">Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return <Navigate to="/auth/signin" replace />;
  }
  if (kycLevel < 1) {
    return <Navigate to="/kyc" replace />;
  }
  return <>{children}</>;
}

// Route Guard - Must have wallet connected
function RequireWallet({ children }: { children: React.ReactNode }) {
  const { walletAddress } = useWallet();

  if (!walletAddress) {
    return <Navigate to="/" state={{ message: "Please connect your wallet first." }} replace />;
  }
  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <WalletProvider>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route
              path="/auth/signup"
              element={
                <RequireWallet>
                  <SignupPage />
                </RequireWallet>
              }
            />
            <Route
              path="/auth/signin"
              element={
                <RequireWallet>
                  <SigninPage />
                </RequireWallet>
              }
            />

            {/* Protected Routes (Needs sign in) */}
            <Route
              path="/kyc"
              element={
                <RequireAuth>
                  <KYCPage />
                </RequireAuth>
              }
            />

            {/* KYC Gated Routes (Needs sign in + wallet linked) */}
            <Route
              path="/dashboard"
              element={
                <RequireWallet>
                  <RequireKyc>
                    <Dashboard />
                  </RequireKyc>
                </RequireWallet>
              }
            />
            <Route
              path="/borrow"
              element={
                <RequireKyc>
                  <BorrowPage />
                </RequireKyc>
              }
            />
            <Route
              path="/lend"
              element={
                <RequireKyc>
                  <LendPage />
                </RequireKyc>
              }
            />
            <Route
              path="/social"
              element={
                <RequireKyc>
                  <SocialTrustPage />
                </RequireKyc>
              }
            />
            <Route
              path="/analytics"
              element={
                <RequireKyc>
                  <AnalyticsPage />
                </RequireKyc>
              }
            />
            <Route
              path="/escrow"
              element={
                <RequireKyc>
                  <EscrowActions />
                </RequireKyc>
              }
            />
            <Route
              path="/admin"
              element={
                <RequireKyc>
                  <AdminPanelPage />
                </RequireKyc>
              }
            />

            {/* Fallback redirect */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </WalletProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
