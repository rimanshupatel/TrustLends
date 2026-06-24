import { Request, Response } from 'express';
import User from '../models/User';
import ActiveLoan from '../models/ActiveLoan';
import LendPosition from '../models/LendPosition';
import Transaction from '../models/Transaction';

export const getAdminStats = async (req: Request, res: Response) => {
  try {
    const dbUserCount = await User.countDocuments();
    const dbActiveLoans = await ActiveLoan.countDocuments();
    const dbLendPositions = await LendPosition.find({});

    const totalLendAmount = dbLendPositions.reduce((sum, pos) => {
      const numericVal = parseFloat(pos.amount.replace(/[^0-9.]/g, ''));
      return sum + (isNaN(numericVal) ? 0 : numericVal);
    }, 0);

    const totalUsers = dbUserCount + 18400; // baseline + db count
    const activeLoans = dbActiveLoans + 4800; // baseline + db count
    const poolLiquidity = totalLendAmount + 2400000; // baseline + db count

    // Dynamic counts
    const activeBorrowers = await User.countDocuments({ activeLoansCount: { $gt: 0 } });
    const totalLoans = await ActiveLoan.countDocuments();
    
    const transactions = await Transaction.find({ type: /repayment/i });
    const totalRepaid = transactions.reduce((sum: number, tx: any) => {
      const numericVal = parseFloat(tx.amount.replace(/[^0-9.]/g, ''));
      return sum + (isNaN(numericVal) ? 0 : numericVal);
    }, 0);

    res.json({
      totalUsers,
      activeLoans,
      poolLiquidity,
      defaultRate: 0.8,
      flaggedAccounts: 2,
      activeBorrowers: activeBorrowers || 1842, // fallback to baseline if 0
      totalLoans: totalLoans || 48,
      totalRepaid: totalRepaid || 15400,
      platformHealth: {
        poolUtilization: 78.4,
        insuranceCoverage: Math.round(poolLiquidity * 0.15),
        avgTrustScore: 712
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getLoanQueue = async (req: Request, res: Response) => {
  try {
    const queue = [
      { id: "LQ-1", name: "Vikram Sen", amount: "₹8,000", score: 680, aiRisk: "Low Risk", purpose: "Business Capital", kycLevel: 2, autoApproved: true },
      { id: "LQ-2", name: "Preeti Singh", amount: "₹5,000", score: 540, aiRisk: "Medium Risk", purpose: "Emergency Loan", kycLevel: 1, autoApproved: false },
      { id: "LQ-3", name: "Kiran Joshi", amount: "₹10,000", score: 480, aiRisk: "High Risk", purpose: "Medical", kycLevel: 1, autoApproved: false },
      { id: "LQ-4", name: "Siddharth Das", amount: "₹22,000", score: 852, aiRisk: "Low Risk", purpose: "Education Fees", kycLevel: 3, autoApproved: true }
    ];
    res.json(queue);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getFraudAlerts = async (req: Request, res: Response) => {
  try {
    const alerts = [
      { id: "ALT-1", type: "⚠️ Suspicious wallet behavior", detail: "3 linked sub-accounts created on same IP within 5 mins.", score: "Avg 490", action: "Flagged" },
      { id: "ALT-2", type: "⚠️ Rapid collateral depletion", detail: "Collateralized balance on-chain fell below 2% of debt limit.", score: "Avg 580", action: "Review" }
    ];
    res.json(alerts);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
