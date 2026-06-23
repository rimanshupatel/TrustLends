import mongoose, { Schema, Document } from 'mongoose';

export interface ILendPosition extends Document {
  id: string; // e.g. DP-4921
  walletAddress: string;
  amount: string; // Keep as string (like $5,000) for simple integration with existing UI/logic
  lockPeriod: string;
  apy: string;
  earned: string;
  status: string;
}

const LendPositionSchema: Schema = new Schema({
  id: { type: String, required: true, unique: true },
  walletAddress: { type: String, required: true, index: true },
  amount: { type: String, required: true },
  lockPeriod: { type: String, required: true },
  apy: { type: String, required: true },
  earned: { type: String, default: "$0.00" },
  status: { type: String, default: "Active" }
}, {
  timestamps: true
});

export default mongoose.model<ILendPosition>('LendPosition', LendPositionSchema);
