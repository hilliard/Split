/**
 * API Route: GET /api/expenses/list
 * 
 * List all expenses for an event
 * Shows who paid what and splits
 */

import type { APIRoute } from 'astro';
import { db } from '../../../db';
import { sessions, expenses, events, expenseSplits, humans, groupMembers } from '../../../db/schema';
import { eq, and } from 'drizzle-orm';
import { centsToDollars } from '../../../utils/currency';

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

    // Check authorization: user is creator OR member of the group
    const isCreator = event.creatorId === session.userId;
    let isGroupMember = false;

    if (event.groupId) {
      const [membership] = await db
        .select()
        .from(groupMembers)
        .where(
          and(
            eq(groupMembers.userId, session.userId),
            eq(groupMembers.groupId, event.groupId)
          )
        )
        .limit(1);
      isGroupMember = !!membership;
    }

    if (!isCreator && !isGroupMember) {
      return new Response(JSON.stringify({ error: 'You do not have permission to view expenses for this event' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get all expenses for this event
    const eventExpenses = await db
      .select()
      .from(expenses)
      .where(eq(expenses.eventId, eventId));

    // Enrich with split details and payer name
    const enrichedExpenses = await Promise.all(
      eventExpenses.map(async (expense) => {
        const [payer] = await db
          .select()
          .from(humans)
          .where(eq(humans.id, expense.paidBy))
          .limit(1);

        const splits = await db
          .select()
          .from(expenseSplits)
          .where(eq(expenseSplits.expenseId, expense.id));

        return {
          id: expense.id,
          amount: parseFloat(centsToDollars(expense.amount as any)),
          tip: parseFloat(centsToDollars(expense.tipAmount as any)), // tipAmount now stored as cents in DB
          total: parseFloat(centsToDollars((expense.amount as any) + (expense.tipAmount as any))), // Both now in cents
          tipAmount: parseFloat(centsToDollars(expense.tipAmount as any)), // For form binding
          category: expense.category,
          description: expense.description,
          paidBy: expense.paidBy,
          payerName: payer ? `${payer.firstName} ${payer.lastName}`.trim() : 'Unknown',
          metadata: expense.metadata || {},
          splits: splits.map((s) => ({
            userId: s.userId,
            amountCents: s.amount,
            amountDollars: (s.amount / 100).toFixed(2),
          })),
          createdAt: expense.createdAt,
        };
      })
    );

    return new Response(JSON.stringify({
      success: true,
      total: enrichedExpenses.length,
      expenses: enrichedExpenses,
      totalAmount: enrichedExpenses.reduce((sum, e) => sum + e.amount, 0),
      totalTips: enrichedExpenses.reduce((sum, e) => sum + e.tip, 0),
      totalWithTips: enrichedExpenses.reduce((sum, e) => sum + e.total, 0),
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching expenses:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch expenses' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
