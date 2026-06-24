import { IUser } from '../models/User';

interface TrustScoreResult {
  totalScore: number;
  breakdown: {
    onChainScore: number;
    financialScore: number;
    socialScore: number;
    kycScore: number;
    aiScore: number;
  };
  creditLimit: number;
  aiRiskLevel: 'Low' | 'Medium' | 'High';
  tier: string;
}

// ===== COMPONENT 1: ON-CHAIN SCORE (400 pts max) =====
function calculateOnChainScore(user: IUser): number {
  let score = 0;

  // Wallet Age (80 pts max)
  const walletAgeYears = parseFloat(user.walletAge) || 0;
  if (walletAgeYears >= 2) score += 80;
  else if (walletAgeYears >= 1) score += 60;
  else if (walletAgeYears >= 0.5) score += 40;
  else if (walletAgeYears >= 0.25) score += 20;
  else score += 0;

  // Transaction Frequency (80 pts max)
  const txCount = user.totalTransactions || 0;
  if (txCount >= 100) score += 80;
  else if (txCount >= 50) score += 60;
  else if (txCount >= 20) score += 40;
  else if (txCount >= 5) score += 20;
  else score += 0;

  // Loan Repayment History (120 pts max)
  const loansRepaid = user.totalLoansRepaid || 0;
  if (loansRepaid === 0) score += 50; // neutral
  else if (loansRepaid >= 6) score += 120;
  else if (loansRepaid >= 3) score += 100;
  else if (loansRepaid >= 1) score += 80;

  // Late payment penalty
  const latePayments = user.latePaymentsCount || 0;
  score -= latePayments * 20;

  // Default penalty (120 pts max penalty)
  const defaults = user.totalLoanDefaults || 0;
  if (defaults >= 2) score -= 200;
  else if (defaults === 1) score -= 80;

  return Math.max(0, Math.min(400, score));
}

// ===== COMPONENT 2: FINANCIAL BEHAVIOR (250 pts max) =====
function calculateFinancialScore(user: IUser): number {
  let score = 0;

  // Savings Pattern (70 pts max)
  const savingsRate = user.monthlySavingsRate || 0;
  if (savingsRate >= 30) score += 70;
  else if (savingsRate >= 20) score += 50;
  else if (savingsRate >= 10) score += 30;
  else score += 0;

  // Income Pattern based on transaction frequency (80 pts max)
  const txCount = user.totalTransactions || 0;
  if (txCount >= 100) score += 80;
  else if (txCount >= 50) score += 60;
  else if (txCount >= 20) score += 30;
  else score += 0;

  // Loan Utilization Ratio (50 pts max)
  const creditLimit = user.creditLimit || 2000;
  const activeDebt = user.totalActiveDebt || 0;
  const utilizationRatio = activeDebt / creditLimit;
  if (utilizationRatio < 0.3) score += 50;
  else if (utilizationRatio < 0.5) score += 40;
  else if (utilizationRatio < 0.8) score += 20;
  else score += 0;

  // Repayment Rate (50 pts max)
  const repaymentRate = user.repaymentRate || 100;
  if (repaymentRate >= 100) score += 50;
  else if (repaymentRate >= 90) score += 35;
  else if (repaymentRate >= 75) score += 20;
  else score += 0;

  return Math.max(0, Math.min(250, score));
}

// ===== COMPONENT 3: SOCIAL TRUST (150 pts max) =====
function calculateSocialScore(user: IUser): number {
  let score = 0;

  // Endorsements (80 pts max)
  const endorsements = user.endorsementsReceived || 0;
  if (endorsements >= 10) score += 80;
  else if (endorsements >= 6) score += 60;
  else if (endorsements >= 3) score += 40;
  else if (endorsements >= 1) score += 20;
  else score += 0;

  // Guarantors (40 pts max)
  const guarantors = user.guarantorsCount || 0;
  if (guarantors >= 2) score += 40;
  else if (guarantors >= 1) score += 20;
  else score += 0;

  // DAO Membership (30 pts max)
  const daos = user.daoMemberships || 0;
  if (daos >= 2) score += 30;
  else if (daos >= 1) score += 15;
  else score += 0;

  return Math.max(0, Math.min(150, score));
}

// ===== COMPONENT 4: KYC SCORE (100 pts max) =====
function calculateKycScore(user: IUser): number {
  switch (user.kycLevel) {
    case 3: return 100;
    case 2: return 70;
    case 1: return 30;
    default: return 0;
  }
}

// ===== COMPONENT 5: AI RISK SCORE (100 pts max) =====
function calculateAiScore(user: IUser, baseScore: number): number {
  // Predict default probability based on behavior
  let defaultProbability = 50; // start at 50%

  // Good signals → lower default probability
  if (user.totalLoansRepaid >= 3) defaultProbability -= 20;
  if (user.repaymentRate >= 95) defaultProbability -= 15;
  if (user.kycLevel >= 2) defaultProbability -= 10;
  if (user.guarantorsCount >= 1) defaultProbability -= 10;
  if (user.endorsementsReceived >= 3) defaultProbability -= 5;
  if (user.earlyRepayments >= 2) defaultProbability -= 10;

  // Bad signals → higher default probability
  if (user.totalLoanDefaults >= 1) defaultProbability += 30;
  if (user.latePaymentsCount >= 3) defaultProbability += 20;
  if (user.totalActiveDebt > user.creditLimit * 0.8) defaultProbability += 15;
  if (user.repaymentRate < 75) defaultProbability += 20;

  // Clamp between 0-100
  defaultProbability = Math.max(0, Math.min(100, defaultProbability));

  // Update AI risk level
  if (defaultProbability >= 60) user.aiRiskLevel = 'High';
  else if (defaultProbability >= 30) user.aiRiskLevel = 'Medium';
  else user.aiRiskLevel = 'Low';

  // Convert to score
  if (defaultProbability <= 10) return 100;
  if (defaultProbability <= 20) return 80;
  if (defaultProbability <= 40) return 60;
  if (defaultProbability <= 60) return 40;
  if (defaultProbability <= 80) return 20;
  return 0;
}

// ===== CREDIT LIMIT CALCULATOR =====
function calculateCreditLimit(score: number): number {
  if (score >= 900) return 50000;
  if (score >= 800) return 50000;
  if (score >= 700) return 20000;
  if (score >= 600) return 5000;
  if (score >= 500) return 2000;
  return 0;
}

// ===== SCORE TIER =====
function getScoreTier(score: number): string {
  if (score >= 900) return '⭐ Excellent';
  if (score >= 800) return '🔵 Very Low Risk';
  if (score >= 700) return '🟢 Low Risk';
  if (score >= 600) return '🟡 Medium Risk';
  if (score >= 500) return '🟠 High Risk';
  if (score >= 400) return '🔴 Very High Risk';
  return '❌ Blacklisted';
}

// ===== SCORE DECAY =====
function applyScoreDecay(user: IUser, currentScore: number): number {
  const lastActive = user.lastActiveDate || new Date();
  const daysSinceActive = Math.floor(
    (Date.now() - new Date(lastActive).getTime()) / (1000 * 60 * 60 * 24)
  );

  const monthsInactive = Math.floor(daysSinceActive / 30);

  if (daysSinceActive >= 365) {
    return currentScore - (monthsInactive * 20);
  } else if (daysSinceActive >= 180) {
    return currentScore - (monthsInactive * 10);
  } else if (daysSinceActive >= 90) {
    return currentScore - (monthsInactive * 5);
  }

  return currentScore;
}

// ===== MAIN FUNCTION =====
export function calculateTrustScore(user: IUser): TrustScoreResult {
  const onChainScore = calculateOnChainScore(user);
  const financialScore = calculateFinancialScore(user);
  const socialScore = calculateSocialScore(user);
  const kycScore = calculateKycScore(user);
  const aiScore = calculateAiScore(user, onChainScore + financialScore + socialScore + kycScore);

  let totalScore = onChainScore + financialScore + socialScore + kycScore + aiScore;

  // Apply decay
  totalScore = applyScoreDecay(user, totalScore);

  // Clamp 0-1000
  totalScore = Math.max(0, Math.min(1000, Math.round(totalScore)));

  const creditLimit = calculateCreditLimit(totalScore);
  const tier = getScoreTier(totalScore);

  return {
    totalScore,
    breakdown: {
      onChainScore,
      financialScore,
      socialScore,
      kycScore,
      aiScore
    },
    creditLimit,
    aiRiskLevel: user.aiRiskLevel,
    tier
  };
}

// ===== REAL TIME EVENTS =====
export function applyScoreEvent(
  currentScore: number,
  event: string
): number {
  const events: Record<string, number> = {
    'loan_repaid_ontime': +15,
    'loan_repaid_early': +25,
    'kyc_upgraded': +20,
    'endorsement_received': +8,
    'guarantor_added': +10,
    'dao_joined': +5,
    'six_months_clean': +20,
    'late_payment_7days': -10,
    'late_payment_30days': -25,
    'loan_default': -100,
    'guarantor_defaulted': -40,
    'suspicious_activity': -50,
    'kyc_rejected': -20,
  };

  const delta = events[event] || 0;
  return Math.max(0, Math.min(1000, currentScore + delta));
}