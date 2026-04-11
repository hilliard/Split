/**
 * Expense and Payment Utilities
 * 
 * Functions for calculating costs, splits, balances, and settlements
 */

import { db } from '../db/index.ts';
import { expenses, expenseSplits, humans } from '../db/schema.ts';
import { eq } from 'drizzle-orm';

export interface ExpenseRecord {
  id: string;
  amount: number; // dollars
  category: string;
  description?: string;
  paidBy: string;
  payerName?: string;
}

export interface UserBalance {
  userId: string;
  name: string;
  paidTotal: number; // amount user paid
  owesTotal: number; // amount user should pay
  netBalance: number; // positive = owed money, negative = owes money
}

export interface Settlement {
  from: string;
  fromName: string;
  to: string;
  toName: string;
  amount: number;
}

/**
 * Get total expenses for a user (what they paid)
 */
export async function getUserTotalPaid(userId: string): Promise<number> {
  try {
    const userExpenses = await db.query.expenses.findMany({
      where: (expenses: any) => eq(expenses.paidBy, userId),
    });

    return userExpenses.reduce((sum, exp) => sum + parseFloat(exp.amount as any), 0);
  } catch (error) {
    console.error('Error calculating user paid total:', error);
    return 0;
  }
}

/**
 * Get total amount user owes (based on expense splits)
 */
export async function getUserTotalOwes(userId: string): Promise<number> {
  try {
    const userSplits = await db.query.expenseSplits.findMany({
      where: (splits: any) => eq(splits.userId, userId),
    });

    // Amount is stored in cents
    return userSplits.reduce((sum, split) => sum + (split.amount / 100), 0);
  } catch (error) {
    console.error('Error calculating user owes total:', error);
    return 0;
  }
}

/**
 * Get net balance for a user (positive = owed money, negative = owes money)
 */
export async function getUserBalance(userId: string): Promise<number> {
  const paid = await getUserTotalPaid(userId);
  const owes = await getUserTotalOwes(userId);
  return paid - owes;
}

/**
 * Calculate all balances for an event
 */
export async function calculateEventBalances(eventId: string): Promise<UserBalance[]> {
  try {
    const eventExpenses = await db.query.expenses.findMany({
      where: (expenses: any) => eq(expenses.eventId, eventId),
    });

    // Track who paid what and who owes what
    const userPaid: { [userId: string]: number } = {};
    const userOwes: { [userId: string]: number } = {};

    // Calculate paid amounts
    for (const expense of eventExpenses) {
      if (!userPaid[expense.paidBy]) {
        userPaid[expense.paidBy] = 0;
      }
      userPaid[expense.paidBy] += parseFloat(expense.amount as any);
    }

    // Calculate owed amounts from splits
    for (const expense of eventExpenses) {
      const splits = await db.query.expenseSplits.findMany({
        where: (splits: any) => eq(splits.expenseId, expense.id),
      });

      for (const split of splits) {
        if (!userOwes[split.userId]) {
          userOwes[split.userId] = 0;
        }
        userOwes[split.userId] += split.amount / 100; // convert cents to dollars
      }
    }

    // Get user info and build balances
    const allUserIds = new Set([...Object.keys(userPaid), ...Object.keys(userOwes)]);
    const balances: UserBalance[] = [];

    for (const userId of allUserIds) {
      const [user] = await db
        .select()
        .from(humans)
        .where(eq(humans.id, userId))
        .limit(1);

      const paid = userPaid[userId] || 0;
      const owes = userOwes[userId] || 0;

      balances.push({
        userId,
        name: user ? `${user.firstName} ${user.lastName}`.trim() : 'Unknown',
        paidTotal: paid,
        owesTotal: owes,
        netBalance: paid - owes,
      });
    }

    return balances.sort((a, b) => b.netBalance - a.netBalance);
  } catch (error) {
    console.error('Error calculating event balances:', error);
    return [];
  }
}

/**
 * Calculate settlements needed to settle all debts
 * Uses greedy algorithm to minimize number of transactions
 */
export async function calculateSettlements(eventId: string): Promise<Settlement[]> {
  try {
    const balances = await calculateEventBalances(eventId);

    const debtors = balances
      .filter((b) => b.netBalance < 0)
      .sort((a, b) => a.netBalance - b.netBalance)
      .map((b) => ({ ...b, remaining: Math.abs(b.netBalance) }));

    const creditors = balances
      .filter((b) => b.netBalance > 0)
      .sort((a, b) => b.netBalance - a.netBalance)
      .map((b) => ({ ...b, remaining: b.netBalance }));

    const settlements: Settlement[] = [];
    let debtorIdx = 0;
    let creditorIdx = 0;

    while (debtorIdx < debtors.length && creditorIdx < creditors.length) {
      const debtor = debtors[debtorIdx];
      const creditor = creditors[creditorIdx];

      const amount = Math.min(debtor.remaining, creditor.remaining);

      if (amount > 0.01) {
        // Only add settlements larger than $0.01
        settlements.push({
          from: debtor.userId,
          fromName: debtor.name,
          to: creditor.userId,
          toName: creditor.name,
          amount: parseFloat(amount.toFixed(2)),
        });
      }

      debtor.remaining -= amount;
      creditor.remaining -= amount;

      if (debtor.remaining < 0.01) debtorIdx++;
      if (creditor.remaining < 0.01) creditorIdx++;
    }

    return settlements;
  } catch (error) {
    console.error('Error calculating settlements:', error);
    return [];
  }
}

/**
 * Check if all debts are settled (for an event or user)
 */
export async function areDebtsSettled(eventId: string): Promise<boolean> {
  const settlements = await calculateSettlements(eventId);
  return settlements.length === 0 || settlements.every((s) => s.amount < 0.01);
}

/**
 * Get expense details including splits
 */
export async function getExpenseDetails(expenseId: string) {
  try {
    const [expense] = await db
      .select()
      .from(expenses)
      .where(eq(expenses.id, expenseId))
      .limit(1);

    if (!expense) {
      return null;
    }

    const splits = await db.query.expenseSplits.findMany({
      where: (splits: any) => eq(splits.expenseId, expenseId),
    });

    const [payer] = await db
      .select()
      .from(humans)
      .where(eq(humans.id, expense.paidBy))
      .limit(1);

    return {
      id: expense.id,
      amount: parseFloat(expense.amount as any),
      category: expense.category,
      description: expense.description,
      paidBy: expense.paidBy,
      payerName: payer ? `${payer.firstName} ${payer.lastName}`.trim() : 'Unknown',
      splits: splits.map((s) => ({
        userId: s.userId,
        amountCents: s.amount,
        amountDollars: (s.amount / 100).toFixed(2),
      })),
      createdAt: expense.createdAt,
    };
  } catch (error) {
    console.error('Error getting expense details:', error);
    return null;
  }
}

/**
 * Format currency for display
 */
export function formatCurrency(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export function formatDollars(dollars: number): string {
  return `$${dollars.toFixed(2)}`;
}

/**
 * Calculate suggested tip amounts for a given expense amount
 * Returns common tipping percentages (15%, 18%, 20%) formatted for UI display
 * 
 * @param amount - Base expense amount in dollars
 * @returns Object with tip suggestions and formatted display text
 */
export function calculateTipSuggestions(amount: number) {
  const tip15 = amount * 0.15;
  const tip18 = amount * 0.18;
  const tip20 = amount * 0.20;

  return {
    // Raw amounts for calculations
    tip15Percent: parseFloat(tip15.toFixed(2)),
    tip18Percent: parseFloat(tip18.toFixed(2)),
    tip20Percent: parseFloat(tip20.toFixed(2)),

    // Formatted for display
    tip15Display: `${formatDollars(tip15)} (15%)`,
    tip18Display: `${formatDollars(tip18)} (18%)`,
    tip20Display: `${formatDollars(tip20)} (20%)`,

    // Suggested text for UI
    suggestions: [
      { percent: 15, amount: parseFloat(tip15.toFixed(2)), display: `${formatDollars(tip15)} (15%)` },
      { percent: 18, amount: parseFloat(tip18.toFixed(2)), display: `${formatDollars(tip18)} (18%)` },
      { percent: 20, amount: parseFloat(tip20.toFixed(2)), display: `${formatDollars(tip20)} (20%)` },
    ],

    // Quick reference for common case
    recommended20Percent: {
      amount: parseFloat(tip20.toFixed(2)),
      display: `20% tip: ${formatDollars(tip20)}`,
      text: `A 20% tip on $${amount.toFixed(2)} would be ${formatDollars(tip20)}`,
    },
  };
}

/**
 * Calculate tip statistics for analytics
 */
export async function getTipStats(eventId: string) {
  try {
    const eventExpenses = await db.query.expenses.findMany({
      where: (expenses: any) => eq(expenses.eventId, eventId),
    });

    const tips = eventExpenses
      .map((exp) => parseFloat(exp.tipAmount as any))
      .filter((tip) => tip > 0);

    if (tips.length === 0) {
      return {
        totalTips: 0,
        averageTip: 0,
        medianTip: 0,
        minTip: 0,
        maxTip: 0,
        expensesWithTips: 0,
        averageTipPercentage: 0,
      };
    }

    const totalTips = tips.reduce((sum, tip) => sum + tip, 0);
    const totalExpenses = eventExpenses
      .map((exp) => parseFloat(exp.amount as any) / 100) // Divide by 100 to convert from cents
      .reduce((sum, amount) => sum + amount, 0);

    const averageTip = totalTips / tips.length;
    const sortedTips = [...tips].sort((a, b) => a - b);
    const medianTip =
      sortedTips.length % 2 === 0
        ? (sortedTips[sortedTips.length / 2 - 1] + sortedTips[sortedTips.length / 2]) / 2
        : sortedTips[Math.floor(sortedTips.length / 2)];

    const averageTipPercentage = (totalTips / totalExpenses) * 100;

    return {
      totalTips,
      averageTip,
      medianTip,
      minTip: Math.min(...tips),
      maxTip: Math.max(...tips),
      expensesWithTips: tips.length,
      averageTipPercentage,
    };
  } catch (error) {
    console.error('Error calculating tip stats:', error);
    return null;
  }
}

/**
 * Get tip demographics (for sponsor analytics)
 */
export async function getTipDemographics(eventId: string) {
  try {
    const eventExpenses = await db.query.expenses.findMany({
      where: (expenses: any) => eq(expenses.eventId, eventId),
    });

    const tipsByPayer: { [userId: string]: { total: number; count: number; average: number } } = {};

    for (const expense of eventExpenses) {
      if (!tipsByPayer[expense.paidBy]) {
        tipsByPayer[expense.paidBy] = { total: 0, count: 0, average: 0 };
      }

      const tip = parseFloat(expense.tipAmount as any);
      if (tip > 0) {
        tipsByPayer[expense.paidBy].total += tip;
        tipsByPayer[expense.paidBy].count += 1;
      }
    }

    // Enrich with user info
    const demographics: Array<any> = [];

    for (const [userId, tipData] of Object.entries(tipsByPayer)) {
      const [user] = await db
        .select()
        .from(humans)
        .where(eq(humans.id, userId))
        .limit(1);

      demographics.push({
        userId,
        name: user ? `${user.firstName} ${user.lastName}`.trim() : 'Unknown',
        totalTipped: tipData.total,
        timesLeftTip: tipData.count,
        averageTip: tipData.count > 0 ? tipData.total / tipData.count : 0,
      });
    }

    return demographics.sort((a, b) => b.totalTipped - a.totalTipped);
  } catch (error) {
    console.error('Error calculating tip demographics:', error);
    return [];
  }
}

/**
 * Analyze tipping by category (meal, service, etc.)
 */
export async function getTipsByCategory(eventId: string) {
  try {
    const eventExpenses = await db.query.expenses.findMany({
      where: (expenses: any) => eq(expenses.eventId, eventId),
    });

    const tipsByCategory: { [category: string]: { total: number; count: number; average: number } } = {};

    for (const expense of eventExpenses) {
      const category = expense.category;
      if (!tipsByCategory[category]) {
        tipsByCategory[category] = { total: 0, count: 0, average: 0 };
      }

      const tip = parseFloat(expense.tipAmount as any);
      tipsByCategory[category].total += tip;
      tipsByCategory[category].count += 1;
    }

    // Calculate averages
    const result: Array<any> = [];
    for (const [category, data] of Object.entries(tipsByCategory)) {
      result.push({
        category,
        totalTipped: data.total,
        expenseCount: data.count,
        averageTip: data.total / data.count,
        tipPercentage: (data.total / data.total) * 100, // Will vary by base amount
      });
    }

    return result.sort((a, b) => b.totalTipped - a.totalTipped);
  } catch (error) {
    console.error('Error calculating tips by category:', error);
    return [];
  }
}
