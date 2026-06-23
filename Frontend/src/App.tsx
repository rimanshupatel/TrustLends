import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { WalletProvider } from '@/context/WalletContext';

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

// Route Guard - Must be signed in
function RequireAuth({ children }: { children: React.ReactNode }) {
  const { isLoggedIn } = useAuth();
  
  if (!isLoggedIn) {
    return <Navigate to="/auth/signin" replace />;
  }
  return <>{children}</>;
}

// Route Guard - Must be signed in + KYC level 1 complete (wallet linked)
function RequireKyc({ children }: { children: React.ReactNode }) {
  const { isLoggedIn, kycLevel } = useAuth();

  if (!isLoggedIn) {
    return <Navigate to="/auth/signin" replace />;
  }
  if (kycLevel < 1) {
    return <Navigate to="/kyc" replace />;
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
            <Route path="/auth/signup" element={<SignupPage />} />
            <Route path="/auth/signin" element={<SigninPage />} />

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
                <RequireKyc>
                  <Dashboard />
                </RequireKyc>
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
