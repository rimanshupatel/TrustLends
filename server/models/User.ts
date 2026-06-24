import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  walletAddress: string;
  name: string;
  email?: string;
  password?: string;
  trustScore: number;
  kycLevel: number;
  walletAge: string;
  repaymentRate: number;
  socialTrustScore: number;
  aiRiskLevel: 'Low' | 'Medium' | 'High';
  creditLimit: number;
  activeLoansCount: number;
  totalActiveDebt: number;
  nextPaymentDate: string;
  nextPaymentAmount: number;
  // New fields for algorithm
  totalLoansRepaid: number;
  totalLoanDefaults: number;
  latePaymentsCount: number;
  endorsementsReceived: number;
  guarantorsCount: number;
  daoMemberships: number;
  totalTransactions: number;
  monthlySavingsRate: number;
  lastActiveDate: Date;
  earlyRepayments: number;
}

const UserSchema: Schema = new Schema({
  walletAddress: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true },
  email: { type: String },
  password: { type: String },
  trustScore: { type: Number, default: 500 },
  kycLevel: { type: Number, default: 0 },
  walletAge: { type: String, default: "0.0 yrs" },
  repaymentRate: { type: Number, default: 100 },
  socialTrustScore: { type: Number, default: 50 },
  aiRiskLevel: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Low' },
  creditLimit: { type: Number, default: 2000 },
  activeLoansCount: { type: Number, default: 0 },
  totalActiveDebt: { type: Number, default: 0 },
  nextPaymentDate: { type: String, default: "" },
  nextPaymentAmount: { type: Number, default: 0 },
  totalLoansRepaid: { type: Number, default: 0 },
  totalLoanDefaults: { type: Number, default: 0 },
  latePaymentsCount: { type: Number, default: 0 },
  endorsementsReceived: { type: Number, default: 0 },
  guarantorsCount: { type: Number, default: 0 },
  daoMemberships: { type: Number, default: 0 },
  totalTransactions: { type: Number, default: 0 },
  monthlySavingsRate: { type: Number, default: 0 },
  lastActiveDate: { type: Date, default: Date.now },
  earlyRepayments: { type: Number, default: 0 }
}, {
  timestamps: true
});

export default mongoose.model<IUser>('User', UserSchema);