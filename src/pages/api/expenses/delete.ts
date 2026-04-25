/**
 * API Route: DELETE /api/expenses/delete
 *
 * Delete an expense and its splits
 */

import type { APIRoute } from 'astro';
import { db } from '../../../db';
import { sessions, expenses, events, expenseSplits } from '../../../db/schema';
import { eq } from 'drizzle-orm';

export const DELETE: APIRoute = async (context) => {
  try {
    // Get session
    const sessionId = context.cookies.get('sessionId')?.value;
    if (!sessionId) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const [session] = (await db.select().from(sessions).where(eq(sessions.id, sessionId)).limit(1)) as any;

    if (!session || new Date(session.expiresAt) < new Date()) {
      return new Response(JSON.stringify({ error: 'Session expired' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get expenseId from query params
    const expenseId = context.url.searchParams.get('expenseId');
    if (!expenseId) {
      return new Response(JSON.stringify({ error: 'expenseId is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get the expense
    const [expense] = (await db.select().from(expenses).where(eq(expenses.id, expenseId)).limit(1)) as any;

    if (!expense) {
      return new Response(JSON.stringify({ error: 'Expense not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Verify event exists and user owns it
    const [event] = (await db.select().from(events).where(eq(events.id, expense.eventId)).limit(1)) as any;

    if (!event || event.creatorId !== session.userId) {
      return new Response(
        JSON.stringify({ error: 'You do not have permission to delete this expense' }),
        {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Delete expense splits first (due to foreign key)
    await (db.delete(expenseSplits).where(eq(expenseSplits.expenseId, expenseId)) as any);

    // Delete expense
    await (db.delete(expenses).where(eq(expenses.id, expenseId)) as any);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Expense deleted successfully',
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (err) {
    const error = err as any;
    console.error('Error deleting expense:', error);
    return new Response(JSON.stringify({ error: 'Failed to delete expense' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
