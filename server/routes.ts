import { Router } from 'express';
import {
  getUser,
  createOrUpdateUser,
  searchUsers,
  getAllUsers,
  updateKyc,
  getLeaderboard
} from './controllers/userController';
import {
  getTransactions,
  createTransaction
} from './controllers/transactionController';
import {
  getActiveLoan,
  requestLoan,
  repayLoan,
  disburseLoan
} from './controllers/loanController';
import {
  getLendPositions,
  createLendPosition,
  withdrawLendPosition,
  getLendStats
} from './controllers/lendController';
import {
  getEndorsements,
  createEndorsement,
  getGuarantors,
  createGuarantor
} from './controllers/socialController';
import {
  getAdminStats,
  getLoanQueue,
  getFraudAlerts
} from './controllers/adminController';

const router = Router();

// User Routes
router.get('/users/search', searchUsers);
router.get('/users/:walletAddress', getUser);
router.get('/users', getAllUsers);
router.post('/users', createOrUpdateUser);
router.patch('/users/:walletAddress/kyc', updateKyc);
router.get('/leaderboard', getLeaderboard);

// Transaction Routes
router.get('/transactions/:walletAddress', getTransactions);
router.post('/transactions', createTransaction);

// Loan Routes
router.get('/loans/active/:walletAddress', getActiveLoan);
router.post('/loans/request', requestLoan);
router.post('/loans/repay', repayLoan);
router.post('/loans/disburse', disburseLoan);

// Lend Routes
router.get('/lend/stats', getLendStats);
router.get('/lend/positions/:walletAddress', getLendPositions);
router.post('/lend/positions', createLendPosition);
router.post('/lend/positions/withdraw', withdrawLendPosition);

// Social Routes
router.get('/endorsements/:walletAddress', getEndorsements);
router.post('/endorsements', createEndorsement);
router.get('/guarantors/:walletAddress', getGuarantors);
router.post('/guarantors', createGuarantor);

// Admin Routes
router.get('/admin/stats', getAdminStats);
router.get('/admin/queue', getLoanQueue);
router.get('/admin/fraud', getFraudAlerts);

export default router;
