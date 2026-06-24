import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import User from './models/User';
import Transaction from './models/Transaction';
import ActiveLoan from './models/ActiveLoan';
import LendPosition from './models/LendPosition';
import Endorsement from './models/Endorsement';
import Guarantor from './models/Guarantor';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI || process.env.DATABASE_URL || 'mongodb://localhost:27017/trustlend';

export const connectDB = async (): Promise<void> => {
  try {
    const conn = await mongoose.connect(MONGODB_URI);
    console.log(`MongoDB connected successfully: ${conn.connection.host}/${conn.connection.name}`);
    
    // Seed initial data if empty
    await seedDatabase();
  } catch (error) {
    console.error('MongoDB connection failed:', error);
    process.exit(1);
  }
};

const seedDatabase = async () => {
  const userCount = await User.countDocuments();
  if (userCount > 0) {
    console.log('Database already populated. Skipping seeding.');
    return;
  }

  console.log('Seeding initial mock data to MongoDB...');

  // 1. Seed Users
  const seedUsers = [
    {
      walletAddress: "GB7F3A8F92B7C52A019D384FE572B683E91122B29C", // Arjun (main user)
      name: "Arjun Sharma",
      email: "arjun@stellar.org",
      trustScore: 847,
      kycLevel: 2,
      walletAge: "2.4 yrs",
      repaymentRate: 98.2,
      socialTrustScore: 94,
      aiRiskLevel: "Low" as const,
      creditLimit: 45000,
      activeLoansCount: 1,
      totalActiveDebt: 12000,
      nextPaymentDate: "Nov 28, 2025",
      nextPaymentAmount: 2400
    },
    {
      walletAddress: "GB837A8F92B7C52A019D384FE572B683E91122B29B",
      name: "Rohan Das",
      trustScore: 812,
      kycLevel: 2,
      walletAge: "1.8 yrs",
      repaymentRate: 97.5,
      socialTrustScore: 88,
      aiRiskLevel: "Low" as const,
      creditLimit: 30000
    },
    {
      walletAddress: "GB771C8F92B7C52A019D384FE572B683E91122B29C",
      name: "Priya Patel",
      trustScore: 790,
      kycLevel: 2,
      walletAge: "1.5 yrs",
      repaymentRate: 96.8,
      socialTrustScore: 85,
      aiRiskLevel: "Low" as const,
      creditLimit: 25000
    },
    {
      walletAddress: "GB911E8F92B7C52A019D384FE572B683E91122B29D",
      name: "Neha Roy",
      trustScore: 825,
      kycLevel: 2,
      walletAge: "2.0 yrs",
      repaymentRate: 99.0,
      socialTrustScore: 90,
      aiRiskLevel: "Low" as const,
      creditLimit: 35000
    },
    {
      walletAddress: "GB111A8F92B7C52A019D384FE572B683E91122B29E",
      name: "Vikram Sen",
      trustScore: 580,
      kycLevel: 2,
      walletAge: "0.8 yrs",
      repaymentRate: 85.0,
      socialTrustScore: 60,
      aiRiskLevel: "Medium" as const,
      creditLimit: 5000
    },
    {
      walletAddress: "GB222B8F92B7C52A019D384FE572B683E91122B29F",
      name: "Suresh Nair",
      trustScore: 712,
      kycLevel: 1,
      walletAge: "1.1 yrs",
      repaymentRate: 94.2,
      socialTrustScore: 75,
      aiRiskLevel: "Low" as const,
      creditLimit: 15000
    },
    {
      walletAddress: "GB333C8F92B7C52A019D384FE572B683E91122B29G",
      name: "Tanya Sharma",
      trustScore: 892,
      kycLevel: 3,
      walletAge: "3.2 yrs",
      repaymentRate: 100.0,
      socialTrustScore: 98,
      aiRiskLevel: "Low" as const,
      creditLimit: 75000
    },
    // Leaderboard entries without specific actions in existing screens
    { walletAddress: "GB444D8F92B7C52A019D384FE572B683E91122B29H", name: "Aarav Mehta", trustScore: 968, kycLevel: 3, walletAge: "4.1 yrs", repaymentRate: 100, socialTrustScore: 100, aiRiskLevel: "Low" as const, creditLimit: 100000 },
    { walletAddress: "GB555E8F92B7C52A019D384FE572B683E91122B29I", name: "Zara Sheikh", trustScore: 942, kycLevel: 3, walletAge: "3.5 yrs", repaymentRate: 99.8, socialTrustScore: 97, aiRiskLevel: "Low" as const, creditLimit: 90000 },
    { walletAddress: "GB666F8F92B7C52A019D384FE572B683E91122B29J", name: "Devansh Bhatia", trustScore: 915, kycLevel: 3, walletAge: "3.0 yrs", repaymentRate: 99.1, socialTrustScore: 95, aiRiskLevel: "Low" as const, creditLimit: 80000 },
    { walletAddress: "GB777G8F92B7C52A019D384FE572B683E91122B29K", name: "Ananya Iyer", trustScore: 898, kycLevel: 2, walletAge: "2.8 yrs", repaymentRate: 98.9, socialTrustScore: 92, aiRiskLevel: "Low" as const, creditLimit: 60000 },
    { walletAddress: "GB888H8F92B7C52A019D384FE572B683E91122B29L", name: "Kunal Kapoor", trustScore: 885, kycLevel: 2, walletAge: "2.2 yrs", repaymentRate: 98.4, socialTrustScore: 89, aiRiskLevel: "Low" as const, creditLimit: 50000 },
    { walletAddress: "GB999I8F92B7C52A019D384FE572B683E91122B29M", name: "Riya Verma", trustScore: 860, kycLevel: 2, walletAge: "2.1 yrs", repaymentRate: 98.0, socialTrustScore: 91, aiRiskLevel: "Low" as const, creditLimit: 48000 },
    { walletAddress: "GB444D8F92B7C52A019D384FE572B683E91122B29AA", name: "Amit Kumar", trustScore: 821, kycLevel: 3, walletAge: "2.0 yrs", repaymentRate: 98.2, socialTrustScore: 80, aiRiskLevel: "Low" as const, creditLimit: 40000 },
    { walletAddress: "GB555E8F92B7C52A019D384FE572B683E91122B29BB", name: "Preeti Singh", trustScore: 540, kycLevel: 1, walletAge: "0.6 yrs", repaymentRate: 80.0, socialTrustScore: 40, aiRiskLevel: "Medium" as const, creditLimit: 4000 },
    { walletAddress: "GB666F8F92B7C52A019D384FE572B683E91122B29CC", name: "Kiran Joshi", trustScore: 480, kycLevel: 1, walletAge: "0.5 yrs", repaymentRate: 75.0, socialTrustScore: 30, aiRiskLevel: "High" as const, creditLimit: 2500 }
  ];

  const hashedPassword = await bcrypt.hash('password123', 12);
  const seedUsersWithPasswords = seedUsers.map(u => ({ ...u, password: hashedPassword }));
  await User.insertMany(seedUsersWithPasswords);
  console.log('Seeded users with hashed passwords.');

  // 2. Seed active loan for Arjun
  const seedActiveLoan = new ActiveLoan({
    id: "LN-8374",
    walletAddress: "GB7F3A8F92B7C52A019D384FE572B683E91122B29C",
    amount: 12000,
    repaid: 7200,
    remaining: 4800,
    progress: 60,
    purpose: "Emergency Medical",
    interestRate: 14.2,
    dueDate: "Dec 15, 2025",
    status: "On Track"
  });

  await seedActiveLoan.save();
  console.log('Seeded active loan.');

  // 3. Seed Transactions
  const seedTransactions = [
    { id: "TX-9021", walletAddress: "GB7F3A8F92B7C52A019D384FE572B683E91122B29C", type: "Loan repayment", amount: "₹2,400", date: "Nov 15, 2025", status: "Completed" as const, impact: "+3 pts" },
    { id: "TX-8910", walletAddress: "GB7F3A8F92B7C52A019D384FE572B683E91122B29C", type: "Loan disbursed", amount: "₹12,000", date: "Oct 2, 2025", status: "Active" as const, impact: "—" },
    { id: "TX-8802", walletAddress: "GB7F3A8F92B7C52A019D384FE572B683E91122B29C", type: "Social endorsement received", amount: "—", date: "Sep 28, 2025", status: "Completed" as const, impact: "+8 pts" },
    { id: "TX-8749", walletAddress: "GB7F3A8F92B7C52A019D384FE572B683E91122B29C", type: "KYC Level 2 completed", amount: "—", date: "Sep 20, 2025", status: "Completed" as const, impact: "+15 pts" },
    { id: "TX-8650", walletAddress: "GB7F3A8F92B7C52A019D384FE572B683E91122B29C", type: "Loan repayment", amount: "₹2,400", date: "Sep 15, 2025", status: "Completed" as const, impact: "+3 pts" },
    { id: "TX-8501", walletAddress: "GB7F3A8F92B7C52A019D384FE572B683E91122B29C", type: "First wallet link verified", amount: "—", date: "Sep 10, 2025", status: "Completed" as const, impact: "+10 pts" }
  ];

  await Transaction.insertMany(seedTransactions);
  console.log('Seeded transactions.');

  // 4. Seed Lend Positions for Arjun
  const seedLendPositions = [
    { id: "DP-4921", walletAddress: "GB7F3A8F92B7C52A019D384FE572B683E91122B29C", amount: "$5,000", lockPeriod: "6 Months", apy: "16%", earned: "$142.50", status: "Active" },
    { id: "DP-3821", walletAddress: "GB7F3A8F92B7C52A019D384FE572B683E91122B29C", amount: "$1,200", lockPeriod: "Flexible", apy: "12%", earned: "$18.40", status: "Active" }
  ];

  await LendPosition.insertMany(seedLendPositions);
  console.log('Seeded lend positions.');

  // 5. Seed Endorsements for Arjun
  const seedEndorsements = [
    { id: "END-1", walletAddress: "GB7F3A8F92B7C52A019D384FE572B683E91122B29C", name: "Priya Patel", score: 790, date: "Nov 14, 2025", impact: "+5 pts", comment: "Outstanding repayment record in local lending circles." },
    { id: "END-2", walletAddress: "GB7F3A8F92B7C52A019D384FE572B683E91122B29C", name: "Rohan Das", score: 812, date: "Nov 10, 2025", impact: "+4 pts", comment: "Trusted community developer and stellar node builder." },
    { id: "END-3", walletAddress: "GB7F3A8F92B7C52A019D384FE572B683E91122B29C", name: "Stellar India DAO", score: 890, date: "Oct 28, 2025", impact: "+12 pts", comment: "Active DAO participant with verified on-chain contributions." }
  ];

  await Endorsement.insertMany(seedEndorsements);
  console.log('Seeded endorsements.');

  // 6. Seed Guarantors for Arjun
  const seedGuarantors = [
    { id: "GUR-1", walletAddress: "GB7F3A8F92B7C52A019D384FE572B683E91122B29C", name: "Rohan Das", wallet: "GB837A8F92B7C52A019D384FE572B683E91122B29B", amount: "₹12,000", status: "Active" }
  ];
  await Guarantor.insertMany(seedGuarantors);
  console.log('Seeded guarantors.');

  console.log('Database seeding completed successfully.');
};
