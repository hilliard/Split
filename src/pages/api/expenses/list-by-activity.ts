/**
 * API Route: GET /api/expenses/list-by-activity
 *
 * List all expenses for a specific activity
 */

import type { APIRoute } from 'astro';
import { db } from '../../../db';
import { sessions, expenses, activities, humans } from '../../../db/schema';
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

    const [session] = await db.select().from(sessions).where(eq(sessions.id, sessionId)).limit(1);

    if (!session || new Date(session.expiresAt) < new Date()) {
      return new Response(JSON.stringify({ error: 'Session expired' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get activityId from query params
    const activityId = context.url.searchParams.get('activityId');
    if (!activityId) {
      return new Response(JSON.stringify({ error: 'activityId is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Verify activity exists
    const [activity] = await db
      .select()
      .from(activities)
      .where(eq(activities.id, activityId))
      .limit(1);

    if (!activity) {
      return new Response(JSON.stringify({ error: 'Activity not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get all expenses for this activity
    const activityExpenses = await db
      .select()
      .from(expenses)
      .where(eq(expenses.activityId, activityId));

    // Enrich with payer details
    const enrichedExpenses = await Promise.all(
      activityExpenses.map(async (expense) => {
        const [payer] = await db
          .select()
          .from(humans)
          .where(eq(humans.id, expense.paidBy))
          .limit(1);

        return {
          id: expense.id,
          amountCents: expense.amount,
          amountDollars: (expense.amount / 100).toFixed(2),
          tipAmount: expense.tipAmount,
          description: expense.description,
          paidBy: expense.paidBy,
          payerName: payer ? `${payer.firstName} ${payer.lastName}`.trim() : 'Unknown',
          createdAt: expense.createdAt,
        };
      })
    );

    return new Response(
      JSON.stringify({
        success: true,
        total: enrichedExpenses.length,
        expenses: enrichedExpenses,
        totalAmount: enrichedExpenses.reduce((sum, e) => sum + parseFloat(e.amountDollars), 0),
        totalTips: enrichedExpenses.reduce((sum, e) => sum + parseFloat(e.tipAmount as any), 0),
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error fetching expenses:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch expenses' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
