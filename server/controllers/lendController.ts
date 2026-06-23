import { Request, Response } from 'express';
import LendPosition from '../models/LendPosition';
import Transaction from '../models/Transaction';

export const getLendPositions = async (req: Request, res: Response) => {
  try {
    const { walletAddress } = req.params;
    const positions = await LendPosition.find({ walletAddress });
    res.json(positions);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const createLendPosition = async (req: Request, res: Response) => {
  try {
    const { walletAddress, amount, lockPeriod, apy } = req.body;

    if (!walletAddress || !amount || !lockPeriod || !apy) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const posId = `DP-${Math.floor(1000 + Math.random() * 9000)}`;

    const newPosition = new LendPosition({
      id: posId,
      walletAddress,
      amount: `$${Number(amount).toLocaleString()}`,
      lockPeriod,
      apy: `${apy}%`,
      earned: "$0.00",
      status: "Active"
    });

    await newPosition.save();

    // Log Transaction
    const txId = `TX-${Math.floor(1000 + Math.random() * 9000)}`;
    const txDateStr = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    const depositTx = new Transaction({
      id: txId,
      walletAddress,
      type: "Lending pool supply",
      amount: `+$${Number(amount).toLocaleString()}`,
      date: txDateStr,
      status: "Completed",
      impact: "—"
    });

    await depositTx.save();

    res.json(newPosition);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const withdrawLendPosition = async (req: Request, res: Response) => {
  try {
    const { walletAddress, positionId } = req.body;

    if (!walletAddress || !positionId) {
      return res.status(400).json({ error: 'Wallet address and position ID are required' });
    }

    const position = await LendPosition.findOne({ id: positionId, walletAddress });
    if (!position) {
      return res.status(404).json({ error: 'Lending position not found' });
    }

    const amountStr = position.amount;

    await position.deleteOne();

    // Log Transaction
    const txId = `TX-${Math.floor(1000 + Math.random() * 9000)}`;
    const txDateStr = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    const withdrawTx = new Transaction({
      id: txId,
      walletAddress,
      type: "Lending pool withdrawal",
      amount: `-${amountStr}`,
      date: txDateStr,
      status: "Completed",
      impact: "—"
    });

    await withdrawTx.save();

    res.json({ success: true, positionId });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
