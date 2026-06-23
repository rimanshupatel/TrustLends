// TrustLend X Mock Data Store

export interface UserProfile {
  name: string;
  walletAddress: string;
  trustScore: number;
  kycLevel: number;
  walletAge: string;
  repaymentRate: number;
  socialTrustScore: number;
  aiRiskLevel: 'Low' | 'Medium' | 'High';
  creditLimit: number;
  activeLoansCount: number;
  totalActiveDebt: number;
  nextPaymentDate: string;
  nextPaymentAmount: number;
}

export const userProfile: UserProfile = {
  name: "Arjun Sharma",
  walletAddress: "GB7F3A8F92B7C52A019D384FE572B683E91122B29C", // Stellar style address format
  trustScore: 847,
  kycLevel: 2,
  walletAge: "2.4 yrs",
  repaymentRate: 98.2,
  socialTrustScore: 94,
  aiRiskLevel: "Low",
  creditLimit: 45000,
  activeLoansCount: 1,
  totalActiveDebt: 12000,
  nextPaymentDate: "Nov 28, 2025",
  nextPaymentAmount: 2400,
};

export const scoreBreakdown = [
  { name: "On-chain Data", score: 92, max: 100 },
  { name: "Financial Behavior", score: 88, max: 100 },
  { name: "Social Trust", score: 94, max: 100 },
  { name: "KYC Level", score: 80, max: 100 },
  { name: "AI Prediction", score: 91, max: 100 },
];

export interface ActiveLoan {
  id: string;
  amount: number;
  repaid: number;
  remaining: number;
  progress: number;
  purpose: string;
  interestRate: number; // in APY %
  dueDate: string;
  status: 'On Track' | 'Delayed' | 'Grace Period';
}

export const activeLoan: ActiveLoan = {
  id: "LN-8374",
  amount: 12000,
  repaid: 7200,
  remaining: 4800,
  progress: 60,
  purpose: "Emergency Medical",
  interestRate: 14.2,
  dueDate: "Dec 15, 2025",
  status: "On Track",
};

export const scoreHistory = [
  { month: "Jun", score: 710, avgScore: 640, top10Percent: 820 },
  { month: "Jul", score: 730, avgScore: 645, top10Percent: 830 },
  { month: "Aug", score: 755, avgScore: 650, top10Percent: 835 },
  { month: "Sep", score: 780, avgScore: 655, top10Percent: 840 },
  { month: "Oct", score: 810, avgScore: 660, top10Percent: 845 },
  { month: "Nov", score: 847, avgScore: 665, top10Percent: 850 },
];

export interface Transaction {
  id: string;
  type: string;
  amount: string;
  date: string;
  status: 'Completed' | 'Active' | 'Pending';
  impact: string;
}

export const recentTransactions: Transaction[] = [
  { id: "TX-9021", type: "Loan repayment", amount: "₹2,400", date: "Nov 15, 2025", status: "Completed", impact: "+3 pts" },
  { id: "TX-8910", type: "Loan disbursed", amount: "₹12,000", date: "Oct 2, 2025", status: "Active", impact: "—" },
  { id: "TX-8802", type: "Social endorsement received", amount: "—", date: "Sep 28, 2025", status: "Completed", impact: "+8 pts" },
  { id: "TX-8749", type: "KYC Level 2 completed", amount: "—", date: "Sep 20, 2025", status: "Completed", impact: "+15 pts" },
  { id: "TX-8650", type: "Loan repayment", amount: "₹2,400", date: "Sep 15, 2025", status: "Completed", impact: "+3 pts" },
  { id: "TX-8501", type: "First wallet link verified", amount: "—", date: "Sep 10, 2025", status: "Completed", impact: "+10 pts" },
];

export const loanHistory = [
  { id: "LN-5290", amount: "₹5,000", purpose: "Education Books", rate: "12.5% APY", status: "Repaid", date: "Aug 15, 2025", duration: "3 Months" },
  { id: "LN-3829", amount: "₹1,500", purpose: "Grocery Purchase", rate: "10.0% APY", status: "Repaid", date: "Jun 12, 2025", duration: "1 Month" },
];

// Lend page mock data
export const lendMarket = {
  totalPoolLiquidity: 847200,
  averageApy: 15.4,
  activeBorrowers: 1842,
  utilizationRate: 78.4,
  insuranceCoverage: 15,
  averageTrustScore: 724,
  activePositions: [
    { id: "DP-4921", amount: "$5,000", lockPeriod: "6 Months", apy: "16%", earned: "$142.50", status: "Active", action: "Withdraw" },
    { id: "DP-3821", amount: "$1,200", lockPeriod: "Flexible", apy: "12%", earned: "$18.40", status: "Active", action: "Withdraw" },
  ],
  riskDistribution: [
    { tier: "Low Risk (Score 750+)", percentage: 60, color: "#059669" },
    { tier: "Medium Risk (Score 600-750)", percentage: 25, color: "#D97706" },
    { tier: "High Risk (Score <600)", percentage: 15, color: "#DC2626" },
  ]
};

// Social page mock data
export interface SocialNode {
  id: string;
  name: string;
  score: number;
  role: 'friend' | 'dao' | 'you';
  x: number;
  y: number;
}

export interface SocialEdge {
  source: string;
  target: string;
  weight: number;
}

export const socialNetwork = {
  nodes: [
    { id: "You", name: "Arjun (You)", score: 847, role: "you" as const, x: 200, y: 200 },
    { id: "F1", name: "Priya Patel", score: 790, role: "friend" as const, x: 80, y: 100 },
    { id: "F2", name: "Rohan Das", score: 812, role: "friend" as const, x: 320, y: 110 },
    { id: "F3", name: "Vikram Sen", score: 680, role: "friend" as const, x: 100, y: 310 },
    { id: "F4", name: "Neha Roy", score: 825, role: "friend" as const, x: 300, y: 300 },
    { id: "DAO1", name: "Stellar India DAO", score: 890, role: "dao" as const, x: 200, y: 50 },
    { id: "DAO2", name: "TrustLend Alpha", score: 915, role: "dao" as const, x: 200, y: 350 },
  ],
  edges: [
    { source: "You", target: "F1", weight: 3 },
    { source: "You", target: "F2", weight: 4 },
    { source: "You", target: "F3", weight: 2 },
    { source: "You", target: "F4", weight: 4 },
    { source: "You", target: "DAO1", weight: 5 },
    { source: "You", target: "DAO2", weight: 5 },
    { source: "F1", target: "DAO1", weight: 2 },
    { source: "F2", target: "DAO1", weight: 3 },
  ]
};

export const endorsements = [
  { id: "END-1", name: "Priya Patel", score: 790, date: "Nov 14, 2025", impact: "+5 pts", comment: "Outstanding repayment record in local lending circles." },
  { id: "END-2", name: "Rohan Das", score: 812, date: "Nov 10, 2025", impact: "+4 pts", comment: "Trusted community developer and stellar node builder." },
  { id: "END-3", name: "Stellar India DAO", score: 890, date: "Oct 28, 2025", impact: "+12 pts", comment: "Active DAO participant with verified on-chain contributions." },
];

export const guarantors = [
  { id: "GUR-1", name: "Rohan Das", wallet: "GB837A...F92B", amount: "₹12,000", status: "Active" }
];

export const daoMemberships = [
  { id: "DAO-M1", name: "Stellar India DAO", members: 1420, joinedDate: "Jan 12, 2025", points: 40 },
  { id: "DAO-M2", name: "TrustLend Alpha Club", members: 350, joinedDate: "Mar 18, 2025", points: 25 },
];

export const leaderboard = [
  { rank: 1, name: "Aarav Mehta", score: 968, trend: "up", avatar: "AM" },
  { rank: 2, name: "Zara Sheikh", score: 942, trend: "up", avatar: "ZS" },
  { rank: 3, name: "Devansh Bhatia", score: 915, trend: "flat", avatar: "DB" },
  { rank: 4, name: "Ananya Iyer", score: 898, trend: "down", avatar: "AI" },
  { rank: 5, name: "Kunal Kapoor", score: 885, trend: "up", avatar: "KK" },
  { rank: 6, name: "Riya Verma", score: 860, trend: "up", avatar: "RV" },
  { rank: 7, name: "Arjun Sharma", score: 847, trend: "up", avatar: "AS", isCurrent: true },
  { rank: 8, name: "Neha Roy", score: 825, trend: "flat", avatar: "NR" },
  { rank: 9, name: "Rohan Das", score: 812, trend: "up", avatar: "RD" },
  { rank: 10, name: "Priya Patel", score: 790, trend: "down", avatar: "PP" },
];

// KYC timeline events
export const kycTimeline = [
  { event: "Level 1 completed", date: "Sep 10, 2025", impact: "+10 pts", status: "success" },
  { event: "Level 2 completed", date: "Sep 20, 2025", impact: "+15 pts", status: "success" },
  { event: "Level 3 submitted", date: "Nov 18, 2025", impact: "Pending", status: "warning" },
];

// Admin stats
export const adminStats = {
  totalUsers: 18432,
  activeLoans: 4891,
  poolLiquidity: 2400000,
  defaultRate: 0.8,
  flaggedAccounts: 23,
  platformHealth: {
    poolUtilization: 78.4,
    insuranceCoverage: 360000, // 15% of pool
    avgTrustScore: 712,
  }
};

export const adminUserManagement = [
  { id: "U-1", name: "Amit Kumar", score: 821, kycLevel: 3, activeLoans: 1, debt: "₹15,000", riskFlag: "None", status: "Active" },
  { id: "U-2", name: "Preeti Singh", score: 540, kycLevel: 1, activeLoans: 2, debt: "₹4,000", riskFlag: "High Default", status: "Flagged" },
  { id: "U-3", name: "Suresh Nair", score: 712, kycLevel: 2, activeLoans: 0, debt: "—", riskFlag: "None", status: "Active" },
  { id: "U-4", name: "Kiran Joshi", score: 480, kycLevel: 1, activeLoans: 1, debt: "₹2,500", riskFlag: "Suspicious Activity", status: "Frozen" },
  { id: "U-5", name: "Tanya Sharma", score: 892, kycLevel: 3, activeLoans: 0, debt: "—", riskFlag: "None", status: "Active" },
];

export const loanQueue = [
  { id: "LQ-1", name: "Vikram Sen", amount: "₹8,000", score: 680, aiRisk: "Low Risk", purpose: "Business Capital", kycLevel: 2, autoApproved: true },
  { id: "LQ-2", name: "Preeti Singh", amount: "₹5,000", score: 540, aiRisk: "Medium Risk", purpose: "Emergency Loan", kycLevel: 1, autoApproved: false },
  { id: "LQ-3", name: "Kiran Joshi", amount: "₹10,000", score: 480, aiRisk: "High Risk", purpose: "Medical", kycLevel: 1, autoApproved: false },
  { id: "LQ-4", name: "Siddharth Das", amount: "₹22,000", score: 852, aiRisk: "Low Risk", purpose: "Education Fees", kycLevel: 3, autoApproved: true },
];

export const fraudAlerts = [
  { id: "ALT-1", type: "⚠️ Suspicious wallet behavior", detail: "3 linked sub-accounts created on same IP within 5 mins.", score: "Avg 490", action: "Flagged" },
  { id: "ALT-2", type: "⚠️ Rapid collateral depletion", detail: "Collateralized balance on-chain fell below 2% of debt limit.", score: "Avg 580", action: "Review" },
];
