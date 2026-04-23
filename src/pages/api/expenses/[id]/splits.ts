/**
 * API Route: PUT /api/expenses/:id/splits
 *
 * Recalculate or customize how an expense is split among group members
 *
 * Body:
 * - expenseId: Expense ID
 * - splitAmong: Array of user IDs to split among (will redistribute equally)
 * - customSplits: Optional - { userId: amountInCents } for exact split amounts
 */

import type { APIRoute } from 'astro';
import { db } from '@/db';
import { sessions, expenses, expenseSplits, groupMembers } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';

const updateSplitsSchema = z.object({
  expenseId: z.string().uuid('Invalid expense ID'),
  splitAmong: z.array(z.string().uuid()).optional(),
  customSplits: z.record(z.string().uuid(), z.number().nonnegative()).optional(),
});

export const PUT: APIRoute = async (context) => {
  try {
    // Get session
    const sessionId = context.cookies.get('sessionId')?.value;
    if (!sessionId) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const [session] = await db.select().from(sessions).where(eq(sessions.id, sessionId)).limit(1);

    if (!session || new Date(session.expiresAt) < new Date()) {
      return new Response(JSON.stringify({ error: 'Session expired' }), { status: 401 });
    }

    // Parse and validate
    const data = await context.request.json();
    const validatedData = updateSplitsSchema.parse(data);

    // Get expense
    const [expense] = await db
      .select()
      .from(expenses)
      .where(eq(expenses.id, validatedData.expenseId))
      .limit(1);

    if (!expense) {
      return new Response(JSON.stringify({ error: 'Expense not found' }), { status: 404 });
    }

    // Verify user created the expense (or is a group admin)
    // For now, just check if user is in the group
    const groupId =
      expense.groupId ||
      (
        await db
          .select({ groupId: expenses.groupId })
          .from(expenses)
          .where(eq(expenses.id, validatedData.expenseId))
          .limit(1)
      )[0]?.groupId;

    if (!groupId) {
      return new Response(JSON.stringify({ error: 'Expense has no group assigned' }), {
        status: 400,
      });
    }

    const isMember = await db
      .select()
      .from(groupMembers)
      .where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, session.userId)))
      .limit(1);

    if (!isMember.length) {
      return new Response(JSON.stringify({ error: 'Not authorized to modify this expense' }), {
        status: 403,
      });
    }

    // Delete existing splits
    await db.delete(expenseSplits).where(eq(expenseSplits.expenseId, validatedData.expenseId));

    // Create new splits
    let newSplits;

    if (validatedData.customSplits && Object.keys(validatedData.customSplits).length > 0) {
      // Custom split amounts provided
      newSplits = Object.entries(validatedData.customSplits).map(([userId, amountCents]) => ({
        id: crypto.randomUUID(),
        expenseId: validatedData.expenseId,
        userId,
        amount: Math.round(amountCents),
      }));
    } else if (validatedData.splitAmong && validatedData.splitAmong.length > 0) {
      // Equal split among specified users
      const totalAmount =
        expense.amount +
        (expense.tipAmount ? Math.round(parseFloat(expense.tipAmount as any) * 100) : 0);
      const perPersonAmount = Math.floor(totalAmount / validatedData.splitAmong.length);
      const remainder = totalAmount % validatedData.splitAmong.length;

      newSplits = validatedData.splitAmong.map((userId, index) => ({
        id: crypto.randomUUID(),
        expenseId: validatedData.expenseId,
        userId,
        amount: perPersonAmount + (index === 0 ? remainder : 0),
      }));
    } else {
      return new Response(
        JSON.stringify({ error: 'Must specify either splitAmong or customSplits' }),
        { status: 400 }
      );
    }

    // Insert new splits
    await db.insert(expenseSplits).values(newSplits);

    return new Response(
      JSON.stringify({
        success: true,
        expenseId: validatedData.expenseId,
        splitsCreated: newSplits.length,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error updating expense splits:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
};
