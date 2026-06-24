import mongoose, { Schema, Document } from 'mongoose';

export interface IActiveLoan extends Document {
  id: string; // e.g. LN-8374
  walletAddress: string;
  amount: number;
  repaid: number;
  remaining: number;
  progress: number;
  purpose: string;
  interestRate: number;
  dueDate: string;
  status: 'On Track' | 'Delayed' | 'Grace Period';
  txHash?: string;
}

const ActiveLoanSchema: Schema = new Schema({
  id: { type: String, required: true, unique: true },
  walletAddress: { type: String, required: true, index: true },
  amount: { type: Number, required: true },
  repaid: { type: Number, default: 0 },
  remaining: { type: Number, required: true },
  progress: { type: Number, default: 0 },
  purpose: { type: String, required: true },
  interestRate: { type: Number, required: true },
  dueDate: { type: String, required: true },
  status: { type: String, enum: ['On Track', 'Delayed', 'Grace Period'], default: 'On Track' },
  txHash: { type: String }
}, {
  timestamps: true
});

export default mongoose.model<IActiveLoan>('ActiveLoan', ActiveLoanSchema);
