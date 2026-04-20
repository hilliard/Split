import { db } from '@/db';
import { expenses, expenseSplits, groupMembers, humans } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

/**
 * Balance Calculator for Expense Settlement
 * Calculates who owes whom in a group
 */

export interface Balance {
  fromUserId: string;
  toUserId: string;
  fromUserName: string;
  toUserName: string;
  amountCents: number;
  description?: string;
}

export interface UserBalance {
  userId: string;
  userName: string;
  totalPaid: number; // Amount they paid
  totalOwed: number; // Amount they owe others
  netBalance: number; // totalPaid - totalOwed (positive = owed to them, negative = they owe)
}

/**
 * Calculate net balance for a group
 * Returns who owes whom and how much
 */
export async function calculateGroupBalances(groupId: string): Promise<Balance[]> {
  try {
    console.log('🔢 calculateGroupBalances called for group:', groupId);
    
    // Get all group members
    const members = await db
      .select({ userId: groupMembers.userId })
      .from(groupMembers)
      .where(eq(groupMembers.groupId, groupId));

    console.log('👥 Group members found:', members.length);

    if (members.length === 0) return [];

    // Get all expenses for the group
    const groupExpenses = await db
      .select()
      .from(expenses)
      .where(eq(expenses.groupId, groupId));

    console.log('💰 Expenses for group:', groupExpenses.length);
    groupExpenses.forEach((exp, idx) => {
      console.log(`  [${idx}] Amount: ${exp.amount} cents, Paid by: ${exp.paidBy}`);
    });

    if (groupExpenses.length === 0) return [];

    // Get all splits for these expenses
    const splits = await db
      .select()
      .from(expenseSplits)
      .where(
        expenseSplits.expenseId.inArray(groupExpenses.map((e) => e.id))
      );

    console.log('📊 Expense splits found:', splits.length);
    splits.forEach((split, idx) => {
      console.log(`  [${idx}] User: ${split.userId}, Amount: ${split.amount} cents`);
    });

    // Calculate balances: paid - split amount
    const userBalances: Record<string, number> = {};

    // Initialize all group members
    for (const member of members) {
      userBalances[member.userId] = 0;
    }

    // Add amounts paid by each user
    for (const expense of groupExpenses) {
      if (userBalances[expense.paidBy] !== undefined) {
        userBalances[expense.paidBy] += expense.amount;
      }
    }

    console.log('💵 User balances after paid amounts:', userBalances);

    // Subtract amounts each user owes (via splits)
    for (const split of splits) {
      if (userBalances[split.userId] !== undefined) {
        userBalances[split.userId] -= split.amount;
      }
    }

    console.log('📈 User balances after splits:', userBalances);

    // Get user names
    const userIds = Object.keys(userBalances);
    const userDetails = await db
      .select({ id: humans.id, firstName: humans.firstName, lastName: humans.lastName })
      .from(humans)
      .where(humans.id.inArray(userIds));

    const userMap = new Map(userDetails.map((u) => [u.id, `${u.firstName} ${u.lastName}`.trim() || 'Unknown']));

    // Convert to settlement transactions using greedy matching
    const balances: Balance[] = [];
    
    // Separate users into creditors (owed money) and debtors (owe money)
    const creditors: Array<{ userId: string; amount: number }> = [];
    const debtors: Array<{ userId: string; amount: number }> = [];

    for (const [userId, balance] of Object.entries(userBalances)) {
      if (balance > 0) {
        creditors.push({ userId, amount: balance });
      } else if (balance < 0) {
        debtors.push({ userId, amount: Math.abs(balance) });
      }
    }

    // Match creditors with debtors greedily
    let creditorIdx = 0;
    let debtorIdx = 0;

    while (creditorIdx < creditors.length && debtorIdx < debtors.length) {
      const creditor = creditors[creditorIdx];
      const debtor = debtors[debtorIdx];

      const settleAmount = Math.min(creditor.amount, debtor.amount);

      balances.push({
        fromUserId: debtor.userId,
        toUserId: creditor.userId,
        fromUserName: userMap.get(debtor.userId) || 'Unknown',
        toUserName: userMap.get(creditor.userId) || 'Unknown',
        amountCents: settleAmount,
      });

      creditor.amount -= settleAmount;
      debtor.amount -= settleAmount;

      if (creditor.amount === 0) creditorIdx++;
      if (debtor.amount === 0) debtorIdx++;
    }

    return balances;
  } catch (error) {
    console.error('Error calculating group balances:', error);
    return [];
  }
}

/**
 * Get user-specific summary for a group
 * Shows total they paid, total they owe, and net balance
 */
export async function getUserGroupBalance(groupId: string, userId: string): Promise<UserBalance | null> {
  try {
    const memberExists = await db
      .select()
      .from(groupMembers)
      .where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, userId)))
      .limit(1);

    if (!memberExists.length) return null;

    // Get expenses they paid
    const paidExpenses = await db
      .select()
      .from(expenses)
      .where(and(eq(expenses.groupId, groupId), eq(expenses.paidBy, userId)));

    const totalPaid = paidExpenses.reduce((sum, exp) => sum + exp.amount, 0);

    // Get splits they owe
    const splits = await db
      .select()
      .from(expenseSplits)
      .where(eq(expenseSplits.userId, userId));

    const userExpenseIds = new Set(paidExpenses.map((e) => e.id));
    const amountOwed = splits
      .filter((s) => !userExpenseIds.has(s.expenseId))
      .reduce((sum, split) => sum + split.amount, 0);

    const user = await db.select().from(humans).where(eq(humans.id, userId)).limit(1);

    return {
      userId,
      userName: user[0] ? `${user[0].firstName} ${user[0].lastName}`.trim() : 'Unknown',
      totalPaid,
      totalOwed: amountOwed,
      netBalance: totalPaid - amountOwed,
    };
  } catch (error) {
    console.error('Error calculating user group balance:', error);
    return null;
  }
}

/**
 * Auto-split an expense equally among group members
 * Creates expense_splits records
 */
export async function autoSplitExpense(
  expenseId: string,
  groupId: string,
  totalAmountCents: number
): Promise<boolean> {
  try {
    // Get all group members
    const members = await db
      .select({ userId: groupMembers.userId })
      .from(groupMembers)
      .where(eq(groupMembers.groupId, groupId));

    if (members.length === 0) return false;

    // Calculate amount per person
    const amountPerPerson = Math.floor(totalAmountCents / members.length);
    const remainder = totalAmountCents % members.length;

    // Create splits
    const splits = members.map((member, index) => ({
      id: crypto.randomUUID(),
      expenseId,
      userId: member.userId,
      amount: amountPerPerson + (index === 0 ? remainder : 0), // Add remainder to first person
    }));

    // Insert into database
    await db.insert(expenseSplits).values(splits);

    return true;
  } catch (error) {
    console.error('Error auto-splitting expense:', error);
    return false;
  }
}

/**
 * Custom split an expense
 * Creates expense_splits records with specific amounts
 */
export async function customSplitExpense(
  expenseId: string,
  splitAmounts: Record<string, number>
): Promise<boolean> {
  try {
    const splits = Object.entries(splitAmounts).map(([userId, amountCents]) => ({
      id: crypto.randomUUID(),
      expenseId,
      userId,
      amount: Math.round(amountCents),
    }));

    await db.insert(expenseSplits).values(splits);

    return true;
  } catch (error) {
    console.error('Error custom splitting expense:', error);
    return false;
  }
}
