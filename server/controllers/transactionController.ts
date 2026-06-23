import { Request, Response } from 'express';
import Transaction from '../models/Transaction';
import User from '../models/User';

export const getTransactions = async (req: Request, res: Response) => {
  try {
    const { walletAddress } = req.params;
    const transactions = await Transaction.find({ walletAddress }).sort({ createdAt: -1 });
    res.json(transactions);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const createTransaction = async (req: Request, res: Response) => {
  try {
    const { walletAddress, type, amount, status, impact, txHash } = req.body;
    
    if (!walletAddress || !type) {
      return res.status(400).json({ error: 'Wallet address and type are required' });
    }

    // Generate random TX ID
    const txId = `TX-${Math.floor(1000 + Math.random() * 9000)}`;

    const dateStr = new Date().toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric"
    });

    const newTx = new Transaction({
      id: txId,
      walletAddress,
      type,
      amount: amount || "—",
      date: dateStr,
      status: status || "Completed",
      impact: impact || "—",
      txHash
    });

    await newTx.save();

    // If there is a trust score impact, update the user's score in database
    if (impact && impact.includes('+')) {
      const points = parseInt(impact.replace(/[^0-9]/g, ''), 10);
      if (!isNaN(points)) {
        const user = await User.findOne({ walletAddress });
        if (user) {
          user.trustScore = Math.min(user.trustScore + points, 1000);
          await user.save();
        }
      }
    }

    res.json(newTx);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
