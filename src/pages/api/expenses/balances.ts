/**
 * API Route: GET /api/expenses/balances
 * 
 * Calculate settlement balances for an event
 * Shows who owes whom for split expenses
 * 
 * Example result:
 * - Alice paid $100 for group meal, split 4 ways = $25 each
 * - Bob only paid $0
 * - Result: Bob owes Alice $25
 * 
 * Query params:
 * - eventId: Event ID to calculate balances for
 */

import type { APIRoute } from 'astro';
import { db } from '../../../db';
import { sessions, expenses, events, expenseSplits, humans } from '../../../db/schema';
import { eq } from 'drizzle-orm';

export const GET: APIRoute = async (context) => {
  try {
    // Get session
    const sessionId = context.cookies.get('sessionId')?.value;
    if (!sessionId) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const [session] = await db
      .select()
      .from(sessions)
      .where(eq(sessions.id, sessionId))
      .limit(1);

    if (!session || new Date(session.expiresAt) < new Date()) {
      return new Response(JSON.stringify({ error: 'Session expired' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get eventId from query params
    const eventId = context.url.searchParams.get('eventId');
    if (!eventId) {
      return new Response(JSON.stringify({ error: 'eventId is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Verify event exists
    const [event] = await db
      .select()
      .from(events)
      .where(eq(events.id, eventId))
      .limit(1);

    if (!event) {
      return new Response(JSON.stringify({ error: 'Event not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get all expenses for this event
    const eventExpenses = await db
      .select()
      .from(expenses)
      .where(eq(expenses.eventId, eventId));

    // Calculate who paid what (in cents)
    const userPaid: { [userId: string]: number } = {};
    const userOwes: { [userId: string]: number } = {};

    // Initialize all users
    for (const expense of eventExpenses) {
      if (!userPaid[expense.paidBy]) userPaid[expense.paidBy] = 0;
    }

    // Get all splits
    const allSplits = await db.select().from(expenseSplits);
    for (const split of allSplits) {
      if (!userOwes[split.userId]) userOwes[split.userId] = 0;
      userOwes[split.userId] += split.amount; // in cents
    }

    // Get user information
    const userIds = new Set([...Object.keys(userPaid), ...Object.keys(userOwes)]);
    const userMap: { [id: string]: any } = {};

    for (const userId of userIds) {
      const [user] = await db
        .select()
        .from(humans)
        .where(eq(humans.id, userId))
        .limit(1);

      if (user) {
        userMap[userId] = user;
      }
    }

    // Calculate net balance for each user (positive = owed money, negative = owes money)
    const balances: Array<{
      userId: string;
      name: string;
      paidAmount: number;
      owesAmount: number;
      netBalance: number;
    }> = [];

    for (const userId of userIds) {
      const paid = userPaid[userId] || 0;
      const owes = userOwes[userId] || 0;
      const net = paid - owes;

      balances.push({
        userId,
        name: userMap[userId] ? `${userMap[userId].firstName} ${userMap[userId].lastName}`.trim() : 'Unknown',
        paidAmount: paid / 100, // Convert to dollars
        owesAmount: owes / 100, // Convert to dollars
        netBalance: net / 100, // Convert to dollars
      });
    }

    // Calculate settlements (who needs to send money to whom)
    const settlements: Array<{
      from: string;
      fromName: string;
      to: string;
      toName: string;
      amount: number;
    }> = [];

    // Greedy algorithm: pair debtors with creditors
    const debtors = balances.filter((b) => b.netBalance < 0).sort((a, b) => a.netBalance - b.netBalance);
    const creditors = balances.filter((b) => b.netBalance > 0).sort((a, b) => b.netBalance - a.netBalance);

    let debtorIdx = 0;
    let creditorIdx = 0;

    while (debtorIdx < debtors.length && creditorIdx < creditors.length) {
      const debtor = debtors[debtorIdx];
      const creditor = creditors[creditorIdx];

      const debtAmount = Math.abs(debtor.netBalance);
      const creditAmount = creditor.netBalance;

      const settlementAmount = Math.min(debtAmount, creditAmount);

      settlements.push({
        from: debtor.userId,
        fromName: debtor.name,
        to: creditor.userId,
        toName: creditor.name,
        amount: parseFloat(settlementAmount.toFixed(2)),
      });

      debtor.netBalance += settlementAmount;
      creditor.netBalance -= settlementAmount;

      if (Math.abs(debtor.netBalance) < 0.01) debtorIdx++;
      if (Math.abs(creditor.netBalance) < 0.01) creditorIdx++;
    }

    return new Response(JSON.stringify({
      success: true,
      balances,
      settlements: settlements.filter((s) => s.amount > 0.01), // Filter out tiny rounding errors
      summary: {
        totalExpenses: balances.reduce((sum, b) => sum + b.paidAmount, 0),
        settlementsNeeded: settlements.filter((s) => s.amount > 0.01).length,
      },
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error calculating balances:', error);
    return new Response(JSON.stringify({ error: 'Failed to calculate balances' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
