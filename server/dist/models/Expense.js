import mongoose, { Schema } from 'mongoose';
const ExpenseSchema = new Schema({
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
export const Expense = mongoose.model('Expense', ExpenseSchema);
export default Expense;
