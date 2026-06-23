import { Link, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useWallet } from "@/context/WalletContext";
import {
  LayoutDashboard,
  CreditCard,
  TrendingUp,
  Users,
  ShieldCheck,
  BarChart2,
  Settings,
  Wallet,
  Menu,
  ChevronLeft,
  ChevronRight,
  LogOut,
  AlertTriangle
} from "lucide-react";
import { userProfile } from "@/lib/mock-data";

export default function Sidebar() {
  const { pathname } = useLocation();
  const { user, logout } = useAuth();
  const { walletAddress, disconnectWallet } = useWallet();
  const [activeGuaranteesCount, setActiveGuaranteesCount] = useState(0);

  // Sync active guarantees count
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const checkGuarantees = () => {
        const stored = localStorage.getItem("locked_guarantees");
        if (stored) {
          const list = JSON.parse(stored);
          const activeList = list.filter((g: any) => g.status === "Active Loan");
          setActiveGuaranteesCount(activeList.length);
        }
      };
      checkGuarantees();
      window.addEventListener("guarantees_updated", checkGuarantees);
      return () => window.removeEventListener("guarantees_updated", checkGuarantees);
    }
  }, []);

  const navItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Borrow", href: "/borrow", icon: CreditCard },
    { name: "Lend", href: "/lend", icon: TrendingUp },
    { name: "Social Trust", href: "/social", icon: Users },
    { name: "KYC", href: "/kyc", icon: ShieldCheck },
    { name: "Analytics", href: "/analytics", icon: BarChart2 },
    { name: "Admin Panel", href: "/admin", icon: Settings },
  ];

  // Helper to truncate wallet address
  const truncateWallet = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const displayName = user?.name || userProfile.name;
  const displayWallet = walletAddress || userProfile.walletAddress;

  const handleSignOut = () => {
    disconnectWallet();
    logout();
  };

  return (
    <aside className="fixed top-0 left-0 h-screen bg-white border-r border-borderCustom flex flex-col z-40 transition-all duration-300 w-16 xl:w-60">
      {/* Sidebar Header / Logo */}
      <div className="h-16 flex items-center px-4 xl:px-6 border-b border-borderCustom gap-2 overflow-hidden">
        <Link to="/" className="flex items-center gap-1 font-bold text-lg text-text-primary whitespace-nowrap">
          <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary text-white font-mono text-xl font-black">T</span>
          <span className="hidden xl:inline-block">TrustLend</span>
          <span className="w-2 h-2 rounded-full bg-gradient-to-r from-primary to-accent animate-pulse hidden xl:inline-block"></span>
          <span className="text-primary hidden xl:inline-block">X</span>
        </Link>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 py-6 space-y-1 px-2 xl:px-3 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.name}
              to={item.href}
              className={`flex items-center gap-4 px-3 py-3 rounded-xl transition-all duration-150 group relative ${
                isActive
                  ? "bg-primary-light text-primary font-semibold border-l-2 border-accent"
                  : "text-text-secondary hover:bg-slate-50 hover:text-text-primary"
              }`}
            >
              <Icon className={`w-5 h-5 flex-shrink-0 transition-colors ${isActive ? "text-primary" : "text-text-secondary group-hover:text-text-primary"}`} />
              <span className="hidden xl:block text-sm whitespace-nowrap">{item.name}</span>

              {/* Tooltip for collapsed states */}
              <div className="absolute left-full ml-3 px-2 py-1 bg-slate-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none whitespace-nowrap z-50 xl:hidden">
                {item.name}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Active Guarantees Alert Warning */}
      {activeGuaranteesCount > 0 && (
        <div className="px-3 py-2 bg-amber-50 border-t border-b border-amber-100 text-[10px] text-warning font-semibold leading-normal flex items-start gap-1.5 overflow-hidden flex-shrink-0">
          <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-warning" />
          <span className="hidden xl:block">
            You have {activeGuaranteesCount} active guarantee{activeGuaranteesCount > 1 ? "s" : ""}. Resolve before account changes.
          </span>
        </div>
      )}

      {/* Bottom User Area */}
      <div className="p-3 xl:p-4 border-t border-borderCustom bg-slate-50 flex items-center justify-between gap-2 overflow-hidden flex-shrink-0">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-primary to-accent text-white flex items-center justify-center font-mono text-sm font-semibold flex-shrink-0 shadow-sm">
            {displayName.slice(0, 2).toUpperCase()}
          </div>
          <div className="hidden xl:block min-w-0 flex-1">
            <p className="text-xs font-bold text-text-primary truncate">{displayName}</p>
            <div className="flex items-center gap-1 text-[10px] font-mono text-text-muted">
              <Wallet className="w-3 h-3 text-text-muted flex-shrink-0" />
              <span className="truncate">{truncateWallet(displayWallet)}</span>
            </div>
          </div>
        </div>
        
        {/* Sign Out Button */}
        <button
          onClick={handleSignOut}
          title="Sign Out"
          className="p-1.5 hover:bg-red-50 hover:text-danger rounded-lg transition-colors text-text-muted"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
}
