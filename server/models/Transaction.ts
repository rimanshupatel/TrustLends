import mongoose, { Schema, Document } from 'mongoose';

export interface ITransaction extends Document {
  id: string; // e.g. TX-9021
  walletAddress: string;
  type: string;
  amount: string;
  date: string;
  status: 'Completed' | 'Active' | 'Pending';
  impact: string;
  txHash?: string;
}

const TransactionSchema: Schema = new Schema({
  id: { type: String, required: true, unique: true },
  walletAddress: { type: String, required: true, index: true },
  type: { type: String, required: true },
  amount: { type: String, default: "—" },
  date: { type: String, required: true },
  status: { type: String, enum: ['Completed', 'Active', 'Pending'], default: 'Completed' },
  impact: { type: String, default: "—" },
  txHash: { type: String }
}, {
  timestamps: true
});

export default mongoose.model<ITransaction>('Transaction', TransactionSchema);
