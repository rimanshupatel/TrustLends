import * as StellarSdk from '@stellar/stellar-sdk';
import { calculateTrustScore, applyScoreEvent } from '../utils/trustScore';
import { Router, Request, Response } from 'express';
import User from '../models/User';
import Loan from '../models/Loan';

const server = new StellarSdk.Horizon.Server(
    'https://horizon-testnet.stellar.org'
);

const router = Router();

// Loan repayment
router.post('/repay', async (req: Request, res: Response) => {
    try {
        const { walletAddress } = req.body;

        const user = await User.findOne({ walletAddress });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const result = calculateTrustScore(user);

        const newScore = applyScoreEvent(
            result.totalScore,
            'loan_repaid_ontime'
        );

        user.trustScore = newScore;
        user.creditLimit = result.creditLimit;
        user.aiRiskLevel = result.aiRiskLevel;
        user.totalLoansRepaid += 1;
        user.lastActiveDate = new Date();

        await user.save();

        res.json({
            success: true,
            newTrustScore: newScore,
        });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// Loan disbursement
router.post('/disburse', async (req: Request, res: Response) => {
    try {
        const { walletAddress, xlmAmount, loanAmount, loanId } = req.body;

        const user = await User.findOne({ walletAddress });

        if (!user) {
            return res.status(404).json({
                error: 'User not found',
            });
        }

        // Calculate latest trust score
        const scoreResult = calculateTrustScore(user);
        const score = scoreResult.totalScore;

        // Eligibility check
        if (score < 500) {
            return res.status(403).json({
                error: `❌ Trust score ${score} too low. Minimum 500 required.`,
                tier: scoreResult.tier,
            });
        }

        // Credit limit check
        if (loanAmount > scoreResult.creditLimit) {
            return res.status(403).json({
                error: `Amount ₹${loanAmount} exceeds your credit limit of ₹${scoreResult.creditLimit}`,
                creditLimit: scoreResult.creditLimit,
                tier: scoreResult.tier,
            });
        }

        const poolSecret = process.env.POOL_TREASURY_SECRET;

        if (!poolSecret) {
            throw new Error('Pool treasury secret not configured');
        }

        const sourceKeypair = StellarSdk.Keypair.fromSecret(poolSecret);
        const sourceAccount = await server.loadAccount(
            sourceKeypair.publicKey()
        );

        const tx = new StellarSdk.TransactionBuilder(sourceAccount, {
            fee: StellarSdk.BASE_FEE,
            networkPassphrase: StellarSdk.Networks.TESTNET,
        })
            .addOperation(
                StellarSdk.Operation.payment({
                    destination: walletAddress,
                    asset: StellarSdk.Asset.native(),
                    amount: xlmAmount.toString(),
                })
            )
            .addMemo(StellarSdk.Memo.text(`loan-${loanId}`))
            .setTimeout(60)
            .build();

        tx.sign(sourceKeypair);

        const stellarResult = await server.submitTransaction(tx);

        // Activate loan
        await Loan.findByIdAndUpdate(loanId, {
            status: 'Active',
            trustScoreAtApproval: score,
            approvedAmount: loanAmount,
            txHash: stellarResult.hash,
        });

        res.json({
            success: true,
            txHash: stellarResult.hash,
            trustScore: score,
            creditLimit: scoreResult.creditLimit,
            tier: scoreResult.tier,
        });
    } catch (err: any) {
        res.status(500).json({
            error: err.message,
        });
    }
});

export default router;