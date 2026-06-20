import mongoose, { Schema, Document } from 'mongoose';

export interface IExpense extends Document {
  description: string;
  totalAmount: number; // in cents
  payerId: string; // Clerk User ID
  date: Date;
  splitMethod: 'equal' | 'custom';
  splits: { memberId: string; amount: number }[]; // in cents
  groupId: mongoose.Types.ObjectId;
  isSettlement: boolean; // true if it is a settlement payment record
  createdAt: Date;
}

const ExpenseSchema: Schema = new Schema({
  description: { type: String, required: true, trim: true },
  totalAmount: { type: Number, required: true },
  payerId: { type: String, required: true },
  date: { type: Date, default: Date.now },
  splitMethod: { type: String, enum: ['equal', 'custom'], required: true },
  splits: [{
    memberId: { type: String, required: true },
    amount: { type: Number, required: true }
  }],
  groupId: { type: Schema.Types.ObjectId, ref: 'Group', required: true },
  isSettlement: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

export const Expense = mongoose.model<IExpense>('Expense', ExpenseSchema);
export default Expense;
