import express from 'express';
import mongoose from 'mongoose';
import { Group } from '../models/Group.js';
import { Expense } from '../models/Expense.js';
import { getAuth } from '@clerk/express';

const router = express.Router();

// Helper to run operations in Mongoose session if supported by MongoDB deployment (standalone fallback)
const runInTransaction = async (callback: (session?: mongoose.ClientSession) => Promise<any>) => {
  let session: mongoose.ClientSession | undefined;
  try {
    session = await mongoose.startSession();
    session.startTransaction();
    const result = await callback(session);
    await session.commitTransaction();
    return result;
  } catch (error: any) {
    if (session) {
      try {
        await session.abortTransaction();
      } catch (abortErr) {
        // Suppress session error if transaction couldn't start
      }
      session.endSession();
    }
    // Fallback if standalone or certain cloud MongoDB clusters don't support transactions
    const errText = `${error.message || ''} ${error.originalError?.message || ''} ${error.codeName || ''}`.toLowerCase();
    const isTxUnsupported = errText.includes('replica') || 
                            errText.includes('transaction') || 
                            errText.includes('retry') ||
                            error.code === 20 || 
                            error.codeName === 'CommandNotSupported' ||
                            error.codeName === 'IllegalOperation';
    if (isTxUnsupported) {
      console.warn('MongoDB transactions not supported by deployment. Executing query fallback...');
      return await callback();
    }
    throw error;
  } finally {
    if (session && !session.hasEnded) {
      session.endSession();
    }
  }
};

// GET /api/groups/:id - Retrieve group details and expenses list
router.get('/:id', async (req, res): Promise<any> => {
  try {
    const auth = getAuth(req);
    let userId = auth.userId;

    if (!userId && process.env.CLERK_SECRET_KEY?.startsWith('sk_test_mock')) {
      userId = 'user_mock_rushi';
    }

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized: User authentication required' });
    }

    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({ error: 'Group not found' });
    }

    const group = await Group.findById(id);
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    const isMember = group.members.includes(userId);
    if (!isMember) {
      return res.status(403).json({ error: 'Access denied: You are not a member of this group' });
    }

    // Retrieve all expenses for the group
    const expenses = await Expense.find({ groupId: id }).sort({ date: -1, createdAt: -1 });

    return res.status(200).json({
      id: group._id,
      name: group.name,
      members: group.members,
      creatorId: group.creatorId,
      expenses,
    });
  } catch (error: any) {
    console.error('Error retrieving group:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

// POST /api/groups - Create a new group
router.post('/', async (req, res): Promise<any> => {
  try {
    const auth = getAuth(req);
    let userId = auth.userId;

    if (!userId && process.env.CLERK_SECRET_KEY?.startsWith('sk_test_mock')) {
      userId = 'user_mock_rushi';
    }

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized: User authentication required' });
    }

    const { name, inviteEmails } = req.body;
    if (!name || typeof name !== 'string' || name.trim() === '') {
      return res.status(400).json({ error: 'Bad Request: Group name is required' });
    }

    const memberSet = new Set<string>();
    memberSet.add(userId);

    if (Array.isArray(inviteEmails)) {
      inviteEmails.forEach((email: string) => {
        if (typeof email === 'string' && email.trim()) {
          const cleanEmail = email.trim().toLowerCase();
          const mockId = `user_${cleanEmail.replace(/[^a-zA-Z0-9]/g, '_')}`;
          memberSet.add(mockId);
        }
      });
    }

    const newGroup = new Group({
      name: name.trim(),
      members: Array.from(memberSet),
      creatorId: userId,
    });

    await newGroup.save();

    return res.status(201).json({
      id: newGroup._id,
      name: newGroup.name,
      members: newGroup.members,
      creatorId: newGroup.creatorId,
    });
  } catch (error: any) {
    console.error('Error creating group:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

// POST /api/groups/:id/expenses - Log a new shared expense (FR-5, FR-6, FR-7, FR-13)
router.post('/:id/expenses', async (req, res): Promise<any> => {
  try {
    const auth = getAuth(req);
    let userId = auth.userId;

    if (!userId && process.env.CLERK_SECRET_KEY?.startsWith('sk_test_mock')) {
      userId = 'user_mock_rushi';
    }

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({ error: 'Group not found' });
    }

    const group = await Group.findById(id);
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    if (!group.members.includes(userId)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { description, totalAmount, payerId, date, splitMethod, splits } = req.body;

    if (!description || !totalAmount || !payerId || !splitMethod) {
      return res.status(400).json({ error: 'Missing required expense fields' });
    }

    if (totalAmount <= 0 || !Number.isInteger(totalAmount)) {
      return res.status(400).json({ error: 'Total amount must be a positive integer in cents' });
    }

    // Verify payer is in the group
    if (!group.members.includes(payerId)) {
      return res.status(400).json({ error: 'Payer must be a member of the group' });
    }

    let calculatedSplits: { memberId: string; amount: number }[] = [];

    if (splitMethod === 'equal') {
      // Split equally among all group members (FR-6)
      const count = group.members.length;
      const share = Math.floor(totalAmount / count);
      let dust = totalAmount - (share * count);

      calculatedSplits = group.members.map((memberId, index) => {
        // Rounding Dust Convention: first member takes the remainder dust
        const amount = index === 0 ? share + dust : share;
        return { memberId, amount };
      });
    } else if (splitMethod === 'custom') {
      if (!Array.isArray(splits) || splits.length === 0) {
        return res.status(400).json({ error: 'Custom split requires splits array' });
      }

      // FR-7: Sum of splits must exactly match totalAmount
      let sum = 0;
      for (const split of splits) {
        if (!group.members.includes(split.memberId)) {
          return res.status(400).json({ error: `Member ${split.memberId} is not in this group` });
        }
        if (split.amount <= 0 || !Number.isInteger(split.amount)) {
          return res.status(400).json({ error: 'Split amount must be a positive integer in cents' });
        }
        sum += split.amount;
        calculatedSplits.push({ memberId: split.memberId, amount: split.amount });
      }

      if (sum !== totalAmount) {
        return res.status(400).json({ error: 'Sum of splits must exactly equal the total expense amount' });
      }
    } else {
      return res.status(400).json({ error: 'Invalid split method' });
    }

    // ACID write execution (AD-2)
    const result = await runInTransaction(async (session) => {
      const expense = new Expense({
        description: description.trim(),
        totalAmount,
        payerId,
        date: date ? new Date(date) : new Date(),
        splitMethod,
        splits: calculatedSplits,
        groupId: id,
        isSettlement: false
      });
      await expense.save({ session });
      return expense;
    });

    return res.status(201).json(result);
  } catch (error: any) {
    console.error('Error logging expense:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

// DELETE /api/groups/:id/expenses/:expenseId - Delete an expense (FR-8, FR-13)
router.delete('/:id/expenses/:expenseId', async (req, res): Promise<any> => {
  try {
    const auth = getAuth(req);
    let userId = auth.userId;

    if (!userId && process.env.CLERK_SECRET_KEY?.startsWith('sk_test_mock')) {
      userId = 'user_mock_rushi';
    }

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id, expenseId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(expenseId)) {
      return res.status(404).json({ error: 'Not found' });
    }

    const group = await Group.findById(id);
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    if (!group.members.includes(userId)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const result = await runInTransaction(async (session) => {
      const expense = await Expense.findOneAndDelete({ _id: expenseId, groupId: id }, { session });
      if (!expense) {
        throw new Error('Expense not found');
      }
      return { success: true };
    });

    return res.status(200).json(result);
  } catch (error: any) {
    if (error.message === 'Expense not found') {
      return res.status(404).json({ error: error.message });
    }
    console.error('Error deleting expense:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

// GET /api/groups/:id/balances - Calculate Net Balances and run debt simplification (FR-9, FR-10, FR-11, AD-4)
router.get('/:id/balances', async (req, res): Promise<any> => {
  const startTime = Date.now();
  try {
    const auth = getAuth(req);
    let userId = auth.userId;

    if (!userId && process.env.CLERK_SECRET_KEY?.startsWith('sk_test_mock')) {
      userId = 'user_mock_rushi';
    }

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({ error: 'Group not found' });
    }

    const group = await Group.findById(id);
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    if (!group.members.includes(userId)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // FR-9: Calculate Net Balances dynamically
    const expenses = await Expense.find({ groupId: id });
    const balances: { [memberId: string]: number } = {};

    // Initialize all group members with 0 balance
    group.members.forEach((m) => {
      balances[m] = 0;
    });

    // Sum paid amounts and subtract splits
    expenses.forEach((exp) => {
      balances[exp.payerId] += exp.totalAmount;
      exp.splits.forEach((split) => {
        if (balances[split.memberId] !== undefined) {
          balances[split.memberId] -= split.amount;
        }
      });
    });

    // FR-10, FR-11, AD-4: Greedy Debt Simplification Algorithm
    const creditors: { memberId: string; amount: number }[] = [];
    const debtors: { memberId: string; amount: number }[] = [];

    Object.entries(balances).forEach(([memberId, amount]) => {
      if (amount > 0) {
        creditors.push({ memberId, amount });
      } else if (amount < 0) {
        debtors.push({ memberId, amount: Math.abs(amount) });
      }
    });

    const transactions: { from: string; to: string; amount: number }[] = [];

    // Loop greedy matchups
    while (creditors.length > 0 && debtors.length > 0) {
      // Sort to get largest creditor and largest debtor first
      creditors.sort((a, b) => b.amount - a.amount);
      debtors.sort((a, b) => b.amount - a.amount);

      const creditor = creditors[0];
      const debtor = debtors[0];

      const transferAmount = Math.min(creditor.amount, debtor.amount);
      transactions.push({
        from: debtor.memberId,
        to: creditor.memberId,
        amount: transferAmount
      });

      creditor.amount -= transferAmount;
      debtor.amount -= transferAmount;

      if (creditor.amount === 0) {
        creditors.shift();
      }
      if (debtor.amount === 0) {
        debtors.shift();
      }
    }

    const duration = Date.now() - startTime;
    // Log latency to verify NFR-1 (< 50ms)
    console.log(`Settlement simplification executed in ${duration}ms`);

    return res.status(200).json({
      balances,
      transactions,
      durationMs: duration
    });
  } catch (error: any) {
    console.error('Error calculating balances:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

// POST /api/groups/:id/settle - Settle a dynamic debt transaction (FR-12, FR-13)
router.post('/:id/settle', async (req, res): Promise<any> => {
  try {
    const auth = getAuth(req);
    let userId = auth.userId;

    if (!userId && process.env.CLERK_SECRET_KEY?.startsWith('sk_test_mock')) {
      userId = 'user_mock_rushi';
    }

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({ error: 'Group not found' });
    }

    const group = await Group.findById(id);
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    if (!group.members.includes(userId)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { fromMemberId, toMemberId, amount } = req.body;

    if (!fromMemberId || !toMemberId || !amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid settlement transaction details' });
    }

    // Verify both participants belong to the group
    if (!group.members.includes(fromMemberId) || !group.members.includes(toMemberId)) {
      return res.status(400).json({ error: 'Settlement participants must belong to group' });
    }

    // Log a special settlement expense record inside transaction (FR-12, FR-13)
    const result = await runInTransaction(async (session) => {
      const settlement = new Expense({
        description: `Settlement: ${fromMemberId} paid ${toMemberId}`,
        totalAmount: amount,
        payerId: fromMemberId,
        date: new Date(),
        splitMethod: 'custom',
        splits: [{ memberId: toMemberId, amount: amount }],
        groupId: id,
        isSettlement: true
      });

      await settlement.save({ session });
      return settlement;
    });

    return res.status(201).json(result);
  } catch (error: any) {
    console.error('Error logging settlement payment:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

export default router;
