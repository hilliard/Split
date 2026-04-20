/**
 * API Route: PUT /api/expenses/update
 * 
 * Update an existing expense
 * Can change amount, category, description, and who it's split among
 */

import type { APIRoute } from 'astro';
import { db } from '../../../db';
import { sessions, expenses, events, expenseSplits } from '../../../db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { dollarsToCents, calculateSplitPerPerson } from '../../../utils/currency';

const updateExpenseSchema = z.object({
  expenseId: z.string().uuid('Invalid expense ID'),
  amount: z.number().positive('Amount must be greater than 0').optional(),
  tipAmount: z.number().nonnegative('Tip must be 0 or greater').optional(),
  category: z.string().min(1).max(50).optional(),
  description: z.string().max(500).optional(),
  splitAmong: z.array(z.string().uuid()).min(1).optional(),
});

export const PUT: APIRoute = async (context) => {
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

    // Parse and validate
    let data;
    try {
      data = await context.request.json();
    } catch (parseError) {
      return new Response(JSON.stringify({ error: 'Invalid request body' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const validatedData = updateExpenseSchema.parse(data);

    // Get the expense
    const [expense] = await db
      .select()
      .from(expenses)
      .where(eq(expenses.id, validatedData.expenseId))
      .limit(1);

    if (!expense) {
      return new Response(JSON.stringify({ error: 'Expense not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Verify event exists and user owns it
    const [event] = await db
      .select()
      .from(events)
      .where(eq(events.id, expense.eventId))
      .limit(1);

    if (!event || event.creatorId !== session.userId) {
      return new Response(JSON.stringify({ error: 'You do not have permission to update this expense' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Update expense fields
    const updateData: any = {};
    if (validatedData.amount) updateData.amount = dollarsToCents(validatedData.amount); // Convert dollars to cents
    if (validatedData.tipAmount !== undefined) updateData.tipAmount = validatedData.tipAmount; // Store as decimal dollars (matches schema)
    if (validatedData.category) updateData.category = validatedData.category;
    if (validatedData.description !== undefined) updateData.description = validatedData.description;

    if (Object.keys(updateData).length > 0) {
      await db.update(expenses).set(updateData).where(eq(expenses.id, validatedData.expenseId));
    }

    // Update splits if provided
    if (validatedData.splitAmong) {
      // Delete existing splits
      await db.delete(expenseSplits).where(eq(expenseSplits.expenseId, validatedData.expenseId));

      // Calculate total using provided or existing values (always in cents in DB)
      const amountInCents = validatedData.amount ? dollarsToCents(validatedData.amount) : expense.amount;
      
      // Handle tipAmount - now stored as decimal dollars in DB
      let tipInCents = 0;
      if (validatedData.tipAmount !== undefined) {
        tipInCents = Math.round(validatedData.tipAmount * 100); // Convert tip dollars to cents
      } else if (expense.tipAmount) {
        // If tipAmount already exists, convert from decimal dollars to cents
        tipInCents = Math.round(parseFloat(expense.tipAmount as any) * 100);
      }
      
      const totalInCents = amountInCents + tipInCents;

      // Create new splits using total
      const splitPerPerson = calculateSplitPerPerson(totalInCents, validatedData.splitAmong.length);

      await db.insert(expenseSplits).values(
        validatedData.splitAmong.map((userId) => ({
          id: uuidv4(),
          expenseId: validatedData.expenseId,
          userId,
          amount: splitPerPerson,
        }))
      );
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'Expense updated successfully',
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error updating expense:', error);
    if (error instanceof z.ZodError) {
      return new Response(JSON.stringify({ error: error.errors[0].message }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    return new Response(JSON.stringify({ error: 'Failed to update expense' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
