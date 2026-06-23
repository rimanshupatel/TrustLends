import { Request, Response } from 'express';
import Endorsement from '../models/Endorsement';
import Guarantor from '../models/Guarantor';
import User from '../models/User';

export const getEndorsements = async (req: Request, res: Response) => {
  try {
    const { walletAddress } = req.params;
    const endorsements = await Endorsement.find({ walletAddress }).sort({ createdAt: -1 });
    res.json(endorsements);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const createEndorsement = async (req: Request, res: Response) => {
  try {
    const { walletAddress, name, score, comment } = req.body;

    if (!walletAddress || !name) {
      return res.status(400).json({ error: 'Wallet address and name are required' });
    }

    const endId = `END-${Math.floor(1000 + Math.random() * 9000)}`;
    const dateStr = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    const impactVal = `+${Math.floor(3 + Math.random() * 5)} pts`;

    const newEndorsement = new Endorsement({
      id: endId,
      walletAddress,
      name,
      score: score || 750,
      date: dateStr,
      impact: impactVal,
      comment: comment || "Vouched for creditworthiness and stellar identity logs."
    });

    await newEndorsement.save();

    // Increment user trust score and social trust score on new endorsement
    const user = await User.findOne({ walletAddress });
    if (user) {
      const points = parseInt(impactVal.replace(/[^0-9]/g, ''), 10);
      user.trustScore = Math.min(user.trustScore + points, 1000);
      user.socialTrustScore = Math.min(user.socialTrustScore + 1, 100);
      await user.save();
    }

    res.json(newEndorsement);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getGuarantors = async (req: Request, res: Response) => {
  try {
    const { walletAddress } = req.params;
    const guarantors = await Guarantor.find({ walletAddress });
    res.json(guarantors);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const createGuarantor = async (req: Request, res: Response) => {
  try {
    const { walletAddress, name, wallet, amount } = req.body;

    if (!walletAddress || !name || !wallet || !amount) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const gurId = `GUR-${Math.floor(1000 + Math.random() * 9000)}`;

    const newGuarantor = new Guarantor({
      id: gurId,
      walletAddress,
      name,
      wallet,
      amount: `₹${Number(amount).toLocaleString()}`,
      status: "Active"
    });

    await newGuarantor.save();

    res.json(newGuarantor);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
