import mongoose, { Schema, Document } from 'mongoose';

export interface IGuarantor extends Document {
  id: string;
  walletAddress: string; // user being guaranteed
  name: string;
  wallet: string; // guarantor wallet
  amount: string;
  status: string;
}

const GuarantorSchema: Schema = new Schema({
  id: { type: String, required: true, unique: true },
  walletAddress: { type: String, required: true, index: true },
  name: { type: String, required: true },
  wallet: { type: String, required: true },
  amount: { type: String, required: true },
  status: { type: String, default: "Active" }
}, {
  timestamps: true
});

export default mongoose.model<IGuarantor>('Guarantor', GuarantorSchema);
