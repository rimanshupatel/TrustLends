import mongoose, { Schema, Document } from 'mongoose';

export interface IEndorsement extends Document {
  id: string; // e.g. END-1
  walletAddress: string; // recipient
  name: string; // endorser name
  score: number; // endorser score
  date: string;
  impact: string;
  comment: string;
}

const EndorsementSchema: Schema = new Schema({
  id: { type: String, required: true, unique: true },
  walletAddress: { type: String, required: true, index: true },
  name: { type: String, required: true },
  score: { type: Number, required: true },
  date: { type: String, required: true },
  impact: { type: String, required: true },
  comment: { type: String, required: true }
}, {
  timestamps: true
});

export default mongoose.model<IEndorsement>('Endorsement', EndorsementSchema);
