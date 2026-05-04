import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load .env.production
dotenv.config({ path: resolve('.env.production') });

import { db } from './src/db/index';
import { events, expenses, expenseSplits, settlements, humans } from './src/db/schema';
import { eq, and } from 'drizzle-orm';

async function testBalancesEndpoint() {
  try {
    const eventObj = await db.query.events.findFirst({
      where: eq(events.title, 'Disney World Vacation'),
      orderBy: (events, { desc }) => [desc(events.createdAt)]
    });
    const eventId = eventObj?.id;
    const eventExpenses = await db.select().from(expenses).where(eq(expenses.eventId, eventId));
    console.log(`📊 Processing ${eventExpenses.length} expenses for event ${eventId}`);

    const userPaid: { [userId: string]: number } = {};
    const userOwes: { [userId: string]: number } = {};

    for (const expense of eventExpenses) {
      if (!userPaid[expense.paidBy]) userPaid[expense.paidBy] = 0;
      const expenseAmount = typeof expense.amount === 'number' ? expense.amount : Number(expense.amount);
      const tipAmount = typeof expense.tipAmount === 'number' ? expense.tipAmount : Number(expense.tipAmount || 0);
      userPaid[expense.paidBy] += expenseAmount + tipAmount; 
    }

    const eventExpenseIds = eventExpenses.map((e) => e.id);
    let eventSplits: any[] = [];
    if (eventExpenseIds.length > 0) {
      eventSplits = await db
        .select({ split: expenseSplits, expense: expenses })
        .from(expenseSplits)
        .innerJoin(expenses, eq(expenseSplits.expenseId, expenses.id))
        .where(eq(expenses.eventId, eventId));
    }

    for (const record of eventSplits) {
      const split = record.split;
      if (!userOwes[split.userId]) userOwes[split.userId] = 0;
      userOwes[split.userId] += split.amount; // in cents
    }

    const userIds = new Set([...Object.keys(userPaid), ...Object.keys(userOwes)]);
    const balances: Array<any> = [];

    for (const userId of userIds) {
      const paid = userPaid[userId] || 0;
      const owes = userOwes[userId] || 0;
      const net = paid - owes;

      balances.push({
        userId,
        paidAmount: paid,
        owesAmount: owes,
        netBalance: net,
      });
    }

    console.log('Initial Balances before settlements:', balances);

    const completedSettlements = await db
      .select()
      .from(settlements)
      .where(eq(settlements.status, 'completed'));
      
    console.log('All Completed Settlements:', completedSettlements.map(s => ({from: s.fromUserId, to: s.toUserId, amount: s.amount})));

  } catch (error) {
    console.error('Error:', error);
  }
  process.exit(0);
}

testBalancesEndpoint();
