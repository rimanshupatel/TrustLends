import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-12345';

// POST /api/auth/signup
router.post('/signup', async (req: Request, res: Response) => {
  try {
    const { name, email, password, walletAddress } = req.body;

    if (!email || !password || !walletAddress) {
      return res.status(400).json({ error: 'All fields (email, password, walletAddress) are required' });
    }

    // 1. Check if email already exists
    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // 2. Check if walletAddress already exists
    const existingWallet = await User.findOne({ walletAddress });
    if (existingWallet) {
      return res.status(400).json({ error: 'Wallet already linked to another account' });
    }

    // 3. Hash password with bcryptjs before saving
    const hashedPassword = await bcrypt.hash(password, 12);

    // 4. Save User
    const user = new User({
      walletAddress,
      name: name || email.split('@')[0],
      email,
      password: hashedPassword,
      trustScore: 500,
      kycLevel: 1, // linked wallet means kyc level 1
      walletAge: "0.1 yrs",
      repaymentRate: 100,
      socialTrustScore: 50,
      aiRiskLevel: 'Low',
      creditLimit: 2000
    });
    await user.save();

    // 5. Return JWT token
    const token = jwt.sign({ userId: user._id, walletAddress: user.walletAddress }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { name: user.name, email: user.email, kycLevel: user.kycLevel } });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password, walletAddress } = req.body;

    if (!email || !password || !walletAddress) {
      return res.status(400).json({ error: 'All fields (email, password, walletAddress) are required' });
    }

    // 1. Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // 2. Compare password with bcrypt.compare()
    // Support default password for legacy seeded users
    let isMatch = false;
    if (user.password) {
      isMatch = await bcrypt.compare(password, user.password);
    } else {
      // Fallback for seeded users that don't have a hashed password in DB
      isMatch = (password === 'password123' || password === 'arjun123');
    }

    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // 3. Check if user.walletAddress === req.body.walletAddress
    if (user.walletAddress !== walletAddress) {
      return res.status(400).json({ 
        error: 'This wallet address is not linked to this account. Please connect the correct wallet.' 
      });
    }

    // 4. Return JWT token
    const token = jwt.sign({ userId: user._id, walletAddress: user.walletAddress }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { name: user.name, email: user.email, kycLevel: user.kycLevel } });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
