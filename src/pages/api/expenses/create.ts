/**
 * API Route: POST /api/expenses/create
 * 
 * Create a new expense for a group
 * Expenses track actual money spent and who paid
 * 
 * Body:
 * - groupId: Group ID (from event.groupId)
 * - amount: Cost in dollars
 * - tipAmount: Tip amount in dollars (optional, default 0)
 * - description: What was purchased
 * - paidBy: User ID who paid
 * - activityId: Optional activity to link to
 * - splitAmong: Array of user IDs to split this expense (optional, defaults to all group members)
 */

import type { APIRoute } from 'astro';
import { db } from '../../../db';
import { sessions, expenses, expenseGroups, groupMembers, expenseSplits } from '../../../db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';

const createExpenseSchema = z.object({
  groupId: z.string().uuid('Invalid group ID'),
  amount: z.number().positive('Amount must be greater than 0'),
  tipAmount: z.number().nonnegative('Tip must be 0 or greater').default(0),
  description: z.string().max(500).default(''),
  category: z.string().max(50).default('misc'),
  paidBy: z.string().uuid('Invalid payer ID'),
  activityId: z.string().uuid('Invalid activity ID').optional(),
  splitAmong: z.array(z.string().uuid()).optional(),
});

export const POST: APIRoute = async (context) => {
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
      console.log('📦 Raw request body:', JSON.stringify(data, null, 2));
    } catch (parseError) {
      return new Response(JSON.stringify({ error: 'Invalid request body' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const validatedData = createExpenseSchema.parse(data);

    console.log('📝 Validated expense data:', {
      groupId: validatedData.groupId,
      amount: validatedData.amount,
      tipAmount: validatedData.tipAmount,
      description: validatedData.description,
      paidBy: validatedData.paidBy,
    });

    // Verify group exists
    const [group] = await db
      .select()
      .from(expenseGroups)
      .where(eq(expenseGroups.id, validatedData.groupId))
      .limit(1);

    if (!group) {
      return new Response(JSON.stringify({ error: 'Group not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get split recipients - if not specified, use all group members
    let splitAmong = validatedData.splitAmong;
    if (!splitAmong || splitAmong.length === 0) {
      try {
        const members = await db
          .select()
          .from(groupMembers)
          .where(eq(groupMembers.groupId, validatedData.groupId));
        
        if (members && members.length > 0) {
          splitAmong = members.map(m => m.userId);
        } else {
          splitAmong = [validatedData.paidBy]; // At least split among the payer
        }
      } catch (e) {
        console.error('Error fetching group members:', e);
        splitAmong = [validatedData.paidBy]; // At least split among the payer
      }
    }
    
    // Ensure splitAmong is never empty
    if (!splitAmong || splitAmong.length === 0) {
      return new Response(JSON.stringify({ error: 'At least one person must be included in the expense split' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Convert dollars to cents for storage and calculation
    const amountInCents = Math.round(validatedData.amount * 100);
    const tipInCents = Math.round(validatedData.tipAmount * 100);
    const totalInCents = amountInCents + tipInCents;

    // Create expense
    let expense;
    try {
      console.log('💾 Inserting expense with values:', {
        groupId: validatedData.groupId,
        amount: amountInCents,
        tipAmount: validatedData.tipAmount,
        description: validatedData.description || '(empty)',
        paidBy: validatedData.paidBy,
      });

      const inserted = await db
        .insert(expenses)
        .values({
          id: uuidv4(),
          groupId: validatedData.groupId,
          activityId: validatedData.activityId,
          amount: amountInCents, // Store as cents (integer)
          tipAmount: validatedData.tipAmount, // Store tip as number, not string
          description: validatedData.description || '', // Ensure not undefined
          category: validatedData.category || 'misc',
          paidBy: validatedData.paidBy,
        })
        .returning();
      
      if (!inserted || inserted.length === 0) {
        return new Response(JSON.stringify({ error: 'Failed to create expense - no record returned' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      
      expense = inserted[0];
      console.log('✅ Expense created:', expense.id);
    } catch (dbError) {
      console.error('❌ Error inserting expense:', dbError);
      
      // Extract meaningful error message
      let errorMsg = 'Failed to create expense in database';
      if (dbError instanceof Error) {
        console.error('Error details:', {
          message: dbError.message,
          code: (dbError as any).code,
          detail: (dbError as any).detail,
        });
        if ('code' in dbError) {
          errorMsg = `Database error (${(dbError as any).code}): ${dbError.message}`;
        } else {
          errorMsg = dbError.message;
        }
      }
      
      return new Response(JSON.stringify({ error: errorMsg }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!expense) {
      return new Response(JSON.stringify({ error: 'Failed to create expense - no record returned' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Create expense splits using TOTAL (amount + tip)
    try {
      if (splitAmong && splitAmong.length > 0) {
        const splitPerPersonCents = Math.round(totalInCents / splitAmong.length);

        await db.insert(expenseSplits).values(
          splitAmong.map((userId) => ({
            id: uuidv4(),
            expenseId: expense.id,
            userId,
            amount: splitPerPersonCents, // Amount in cents per person
          }))
        );
      }
    } catch (splitError) {
      console.error('Error creating expense splits:', splitError);
      // Don't fail the whole request if splits fail, but log it
    }

    const splitPerPersonCents = splitAmong && splitAmong.length > 0 ? Math.round(totalInCents / splitAmong.length) : 0;

    return new Response(JSON.stringify({
      success: true,
      expense: {
        id: expense.id,
        subtotal: validatedData.amount,
        tip: validatedData.tipAmount,
        total: validatedData.amount + validatedData.tipAmount,
        description: validatedData.description,
        paidBy: validatedData.paidBy,
        splitAmong,
        splitPerPerson: (splitPerPersonCents / 100).toFixed(2), // Display as dollars
        tipPerPerson: splitAmong.length > 0 ? (tipInCents / splitAmong.length / 100).toFixed(2) : '0.00',
      },
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error creating expense:', error);
    if (error instanceof z.ZodError) {
      return new Response(JSON.stringify({ error: error.errors[0].message }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    return new Response(JSON.stringify({ error: 'Failed to create expense' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
