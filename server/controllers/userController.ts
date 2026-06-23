import { Request, Response } from 'express';
import User from '../models/User';

export const getUser = async (req: Request, res: Response) => {
  try {
    const { walletAddress } = req.params;
    const user = await User.findOne({ walletAddress });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const createOrUpdateUser = async (req: Request, res: Response) => {
  try {
    const { walletAddress, name, email } = req.body;
    if (!walletAddress) {
      return res.status(400).json({ error: 'Wallet address is required' });
    }

    let user = await User.findOne({ walletAddress });
    if (!user) {
      // Create new user profile
      user = new User({
        walletAddress,
        name: name || 'New User',
        email: email || '',
        trustScore: 500, // starting score
        kycLevel: 1, // linked wallet means kyc level 1
        walletAge: "0.1 yrs",
        repaymentRate: 100,
        socialTrustScore: 50,
        aiRiskLevel: 'Low',
        creditLimit: 2000,
        activeLoansCount: 0,
        totalActiveDebt: 0,
        nextPaymentDate: "",
        nextPaymentAmount: 0
      });
      await user.save();
    }
    res.json(user);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const searchUsers = async (req: Request, res: Response) => {
  try {
    const { q } = req.query;
    if (!q) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    const queryStr = String(q);
    // Find matching users (name or walletAddress matching queryStr)
    const users = await User.find({
      $or: [
        { name: { $regex: queryStr, $options: 'i' } },
        { walletAddress: { $regex: queryStr, $options: 'i' } }
      ]
    });
    res.json(users);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const users = await User.find({});
    res.json(users);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const updateKyc = async (req: Request, res: Response) => {
  try {
    const { walletAddress } = req.params;
    const { kycLevel } = req.body;
    
    // Limits and score impacts per KYC Level
    let creditLimit = 2000;
    let trustScoreImpact = 0;
    if (kycLevel === 2) {
      creditLimit = 20000;
      trustScoreImpact = 15;
    } else if (kycLevel === 3) {
      creditLimit = 50000;
      trustScoreImpact = 25;
    }

    const user = await User.findOne({ walletAddress });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.kycLevel = kycLevel;
    user.creditLimit = creditLimit;
    user.trustScore = Math.min(user.trustScore + trustScoreImpact, 1000);
    await user.save();

    res.json(user);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getLeaderboard = async (req: Request, res: Response) => {
  try {
    // Sort all users descending by trust score
    const users = await User.find({}).sort({ trustScore: -1 });
    const formattedLeaderboard = users.map((u, index) => ({
      rank: index + 1,
      name: u.name,
      walletAddress: u.walletAddress,
      score: u.trustScore,
      trend: 'up', // mock trend
      avatar: u.name.split(' ').map(n => n[0]).join('').toUpperCase()
    }));
    res.json(formattedLeaderboard);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
