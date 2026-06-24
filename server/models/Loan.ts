import mongoose, { Schema, Document } from 'mongoose';

export interface ILoan extends Document {
    borrowerWallet: string;
    amount: number;
    outstandingAmount: number;
    interestRate: number;
    status: 'Pending' | 'Active' | 'Repaid' | 'Defaulted';
    trustScoreAtApproval: number;
    txHash?: string;
    dueDate: Date;
}

const LoanSchema: Schema = new Schema(
    {
        borrowerWallet: {
            type: String,
            required: true,
            index: true,
        },
        amount: {
            type: Number,
            required: true,
        },
        outstandingAmount: {
            type: Number,
            required: true,
        },
        interestRate: {
            type: Number,
            default: 5,
        },
        status: {
            type: String,
            enum: ['Pending', 'Active', 'Repaid', 'Defaulted'],
            default: 'Pending',
        },
        trustScoreAtApproval: {
            type: Number,
            required: true,
        },
        txHash: {
            type: String,
        },
        dueDate: {
            type: Date,
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

export default mongoose.model<ILoan>('Loan', LoanSchema);