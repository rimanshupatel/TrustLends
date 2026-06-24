import { Request, Response } from 'express';
import ActiveLoan from '../models/ActiveLoan';
import User from '../models/User';
import Transaction from '../models/Transaction';

export const getActiveLoan = async (req: Request, res: Response) => {
  try {
    const { walletAddress } = req.params;
    const loan = await ActiveLoan.findOne({ walletAddress });
    res.json(loan);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const requestLoan = async (req: Request, res: Response) => {
  try {
    const { walletAddress, amount, purpose, duration, interestRate } = req.body;

    if (!walletAddress || !amount || !purpose || !duration) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const user = await User.findOne({ walletAddress });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check credit limit
    if (amount > user.creditLimit) {
      return res.status(400).json({ error: 'Loan request exceeds credit limit' });
    }

    // Check if user already has an active loan
    const existingLoan = await ActiveLoan.findOne({ walletAddress });
    if (existingLoan) {
      return res.status(400).json({ error: 'User already has an active loan' });
    }

    const loanId = `LN-${Math.floor(1000 + Math.random() * 9000)}`;
    const dueTime = new Date();
    dueTime.setMonth(dueTime.getMonth() + Number(duration));
    const dueDateStr = dueTime.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

    // 1. Create Active Loan
    const newLoan = new ActiveLoan({
      id: loanId,
      walletAddress,
      amount,
      repaid: 0,
      remaining: amount,
      progress: 0,
      purpose,
      interestRate: interestRate || 14.2,
      dueDate: dueDateStr,
      status: 'On Track'
    });

    await newLoan.save();

    // 2. Update User Profile debt
    user.activeLoansCount = 1;
    user.totalActiveDebt = amount;
    user.nextPaymentAmount = Math.round(amount / duration);
    
    const nextPayDate = new Date();
    nextPayDate.setMonth(nextPayDate.getMonth() + 1);
    user.nextPaymentDate = nextPayDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

    await user.save();

    // 3. Log Disbursement Transaction
    const txId = `TX-${Math.floor(1000 + Math.random() * 9000)}`;
    const txDateStr = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    const disbursementTx = new Transaction({
      id: txId,
      walletAddress,
      type: "Loan disbursed",
      amount: `₹${amount.toLocaleString()}`,
      date: txDateStr,
      status: "Active",
      impact: "—"
    });

    await disbursementTx.save();

    try {
      const { sendXLMPayment } = require('../stellar');
      const xlmAmount = (Number(amount) / 7).toFixed(7);
      const txHash = await sendXLMPayment(walletAddress, xlmAmount, `disburse-${loanId}`);
      newLoan.txHash = txHash;
      await newLoan.save();

      // Deduct from pool balance in DB
      const LendPosition = require('../models/LendPosition').default || require('../models/LendPosition');
      const position = await LendPosition.findOne({});
      if (position) {
        const currentVal = parseFloat(position.amount.replace(/[^0-9.]/g, ''));
        const newVal = Math.max(currentVal - Number(amount), 0);
        position.amount = `$${newVal.toLocaleString()}`;
        await position.save();
      }
    } catch (blockchainErr: any) {
      console.error("Blockchain disburse failed on request:", blockchainErr);
    }

    res.json(newLoan);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const repayLoan = async (req: Request, res: Response) => {
  try {
    const { walletAddress, amount, txHash } = req.body;

    if (!walletAddress || !amount) {
      return res.status(400).json({ error: 'Wallet address and amount are required' });
    }

    const loan = await ActiveLoan.findOne({ walletAddress });
    if (!loan) {
      return res.status(404).json({ error: 'No active loan found for this wallet address' });
    }

    const user = await User.findOne({ walletAddress });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Update Loan Repayment Stats
    const repaid = loan.repaid + amount;
    const remaining = Math.max(loan.amount - repaid, 0);
    const progress = Math.round((repaid / loan.amount) * 100);

    loan.repaid = repaid;
    loan.remaining = remaining;
    loan.progress = progress;

    let isFullyRepaid = remaining <= 0;

    if (isFullyRepaid) {
      await loan.deleteOne();
      
      // Update User Profile
      user.activeLoansCount = 0;
      user.totalActiveDebt = 0;
      user.nextPaymentAmount = 0;
      user.nextPaymentDate = "";
    } else {
      await loan.save();

      // Update User Debt
      user.totalActiveDebt = remaining;
    }

    // User gets a trust score bump on repayment
    user.trustScore = Math.min(user.trustScore + 3, 1000);
    await user.save();

    // Log Transaction
    const txId = `TX-${Math.floor(1000 + Math.random() * 9000)}`;
    const txDateStr = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    const repaymentTx = new Transaction({
      id: txId,
      walletAddress,
      type: isFullyRepaid ? "Loan fully repaid (Simulated)" : "Loan repayment (Simulated)",
      amount: `₹${amount.toLocaleString()}`,
      date: txDateStr,
      status: "Completed",
      impact: "+3 pts",
      txHash
    });

    await repaymentTx.save();

    res.json({
      success: true,
      isFullyRepaid,
      loan: isFullyRepaid ? null : loan,
      user
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const disburseLoan = async (req: Request, res: Response) => {
  try {
    const { walletAddress, amount, loanId } = req.body;
    if (!walletAddress || !amount || !loanId) {
      return res.status(400).json({ error: 'walletAddress, amount, and loanId are required' });
    }

    const loan = await ActiveLoan.findOne({ id: loanId });
    if (!loan) {
      // Try finding by Mongo _id in case LN-xxx string is not stored as id
      const dbLoanByMongoId = await ActiveLoan.findById(loanId);
      if (dbLoanByMongoId) {
        const { sendXLMPayment } = require('../stellar');
        const xlmAmount = (Number(amount) / 7).toFixed(7);
        const txHash = await sendXLMPayment(walletAddress, xlmAmount, `disburse-${loanId}`);

        // Deduct from pool balance in DB
        const LendPosition = require('../models/LendPosition').default || require('../models/LendPosition');
        const position = await LendPosition.findOne({});
        if (position) {
          const currentVal = parseFloat(position.amount.replace(/[^0-9.]/g, ''));
          const newVal = Math.max(currentVal - Number(amount), 0);
          position.amount = `$${newVal.toLocaleString()}`;
          await position.save();
        }

        dbLoanByMongoId.txHash = txHash;
        await dbLoanByMongoId.save();

        return res.json({ success: true, txHash });
      }
      return res.status(404).json({ error: 'Loan record not found' });
    }

    // Blockchain payment
    const { sendXLMPayment } = require('../stellar');
    const xlmAmount = (Number(amount) / 7).toFixed(7);
    const txHash = await sendXLMPayment(walletAddress, xlmAmount, `disburse-${loanId}`);

    // Deduct from pool balance in DB
    const LendPosition = require('../models/LendPosition').default || require('../models/LendPosition');
    const position = await LendPosition.findOne({});
    if (position) {
      const currentVal = parseFloat(position.amount.replace(/[^0-9.]/g, ''));
      const newVal = Math.max(currentVal - Number(amount), 0);
      position.amount = `$${newVal.toLocaleString()}`;
      await position.save();
    }

    loan.txHash = txHash;
    await loan.save();

    res.json({ success: true, txHash });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
