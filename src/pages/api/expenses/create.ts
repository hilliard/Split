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
import {
  sessions,
  expenses,
  events,
  expenseGroups,
  groupMembers,
  expenseSplits,
} from '../../../db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { dollarsToCents, calculateSplitPerPerson, centsToDollars } from '../../../utils/currency';

const createExpenseSchema = z.object({
  eventId: z.string().uuid('Invalid event ID').optional(),
  groupId: z.string().uuid('Invalid group ID').optional(),
  amount: z.number().positive('Amount must be greater than 0'),
  tipAmount: z.number().nonnegative('Tip must be 0 or greater').default(0),
  description: z.string().max(500).default(''),
  category: z.string().max(50).default('misc'),
  paidBy: z.string().uuid('Invalid payer ID'),
  activityId: z.string().uuid('Invalid activity ID').optional(),
  splitAmong: z.array(z.string().uuid()).optional(),
  metadata: z.any().optional(),
}).refine(data => data.eventId || data.groupId, {
  message: "Either eventId or groupId must be provided",
  path: ["eventId"],
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

    const [session] = await db.select().from(sessions).where(eq(sessions.id, sessionId)).limit(1);

    if (!session || new Date(session.expiresAt) < new Date()) {
      return new Response(JSON.stringify({ error: 'Session expired' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Parse body
    const body = await context.request.json();
    console.log('📦 Create Expense Request Body:', JSON.stringify(body, null, 2));

    // Convert string inputs to numbers if they come from forms
    if (typeof body.amount === 'string') body.amount = parseFloat(body.amount);
    if (typeof body.tipAmount === 'string') body.tipAmount = parseFloat(body.tipAmount);

    // Validate request body
    const validationResult = createExpenseSchema.safeParse(body);
    if (!validationResult.success) {
      console.error('❌ Schema Validation Failed:', validationResult.error.format());
      return new Response(
        JSON.stringify({
          error: 'Invalid request data',
          details: validationResult.error.format(),
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const validatedData = validationResult.data;

    console.log('✅ Validated Expense Data:', {
      eventId: validatedData.eventId,
      groupId: validatedData.groupId,
      amount: validatedData.amount,
      description: validatedData.description,
      paidBy: validatedData.paidBy,
    });

    let groupId = validatedData.groupId;

    // If eventId is provided, get the group from the event
    if (validatedData.eventId) {
      const [event] = await db
        .select()
        .from(events)
        .where(eq(events.id, validatedData.eventId))
        .limit(1);

      if (!event) {
        return new Response(JSON.stringify({ error: 'Event not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      if (!event.groupId) {
        // Auto-create a group for this event
        const newGroupId = uuidv4();
        await db.insert(expenseGroups).values({
          id: newGroupId,
          createdBy: session.userId,
          name: `${event.title} Expenses`,
        });

        // Add creator as the first member of the new group
        await db.insert(groupMembers).values({
          groupId: newGroupId,
          userId: session.userId,
        });

        // Link group to event
        await db.update(events).set({ groupId: newGroupId }).where(eq(events.id, event.id));
        
        event.groupId = newGroupId;
      }
      
      groupId = event.groupId;
    }

    if (!groupId) {
      return new Response(JSON.stringify({ error: 'Group ID is required' }), {
        status: 400,
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
          .where(eq(groupMembers.groupId, groupId));

        if (members && members.length > 0) {
          splitAmong = members.map((m) => m.userId);
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
      return new Response(
        JSON.stringify({ error: 'At least one person must be included in the expense split' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
    
    // Deduplicate user IDs to prevent calculating splits incorrectly if UI sends duplicates
    splitAmong = [...new Set(splitAmong)];

    // Convert dollars to cents for storage and calculation
    const amountInCents = dollarsToCents(validatedData.amount);
    const tipInCents = dollarsToCents(validatedData.tipAmount);
    const totalInCents = amountInCents + tipInCents;

    // Create expense
    let expense;
    try {
      console.log('💾 Inserting expense with values:', {
        eventId: validatedData.eventId,
        amountInCents: amountInCents,
        description: validatedData.description || '(empty)',
        paidBy: validatedData.paidBy,
      });

      const insertValues = {
        id: uuidv4(),
        eventId: validatedData.eventId,
        groupId: groupId, // Add groupId from the event
        activityId: validatedData.activityId,
        amount: amountInCents, // Store as integer cents
        tipAmount: tipInCents, // Store as integer cents (e.g., 345 = $3.45)
        description: validatedData.description || '',
        category: validatedData.category || 'misc',
        paidBy: validatedData.paidBy,
        metadata: validatedData.metadata || {},
      };

      console.log('📋 Full insert object:', JSON.stringify(insertValues, null, 2));
      console.log('💡 Insert value types:', {
        id: typeof insertValues.id,
        eventId: typeof insertValues.eventId,
        groupId: typeof insertValues.groupId,
        activityId: typeof insertValues.activityId,
        amount: typeof insertValues.amount + ' = ' + insertValues.amount,
        tipAmount: typeof insertValues.tipAmount + ' = ' + insertValues.tipAmount,
        description: typeof insertValues.description,
        category: typeof insertValues.category,
        paidBy: typeof insertValues.paidBy,
      });

      // Verify all required fields are present
      if (!insertValues.id || typeof insertValues.amount === 'undefined') {
        throw new Error(
          `Missing required fields: id=${insertValues.id}, amount=${insertValues.amount}`
        );
      }

      console.log('🔍 About to call db.insert()...');
      const inserted = await db.insert(expenses).values(insertValues).returning();

      console.log('✅ Insert succeeded, returned:', inserted);

      if (!inserted || inserted.length === 0) {
        return new Response(
          JSON.stringify({ error: 'Failed to create expense - no record returned' }),
          {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }

      expense = inserted[0];
      console.log('✅ Expense created:', expense.id);
    } catch (dbError) {
      console.error('❌ Error inserting expense:', dbError);
      console.error('❌ Error type:', dbError?.constructor?.name);
      console.error('Full error object:', JSON.stringify(dbError, null, 2));

      // Log specific database error details
      if (dbError instanceof Error) {
        console.error('Error stack:', dbError.stack);
      }

      // Extract meaningful error message
      let errorMsg = 'Failed to create expense in database';
      if (dbError instanceof Error) {
        console.error('Error details:', {
          name: dbError.name,
          message: dbError.message,
          code: (dbError as any).code,
          detail: (dbError as any).detail,
          table: (dbError as any).table,
          column: (dbError as any).column,
        });
        if ('code' in dbError) {
          errorMsg = `Database error (${(dbError as any).code}): ${dbError.message}. Detail: ${(dbError as any).detail || 'N/A'}`;
        } else {
          errorMsg = dbError.message;
        }
      }

      console.error('Final error response:', { errorMsg });

      return new Response(JSON.stringify({ error: errorMsg }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!expense) {
      return new Response(
        JSON.stringify({ error: 'Failed to create expense - no record returned' }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Create expense splits using TOTAL (amount + tip)
    try {
      if (splitAmong && splitAmong.length > 0) {
        const splitPerPersonCents = calculateSplitPerPerson(totalInCents, splitAmong.length);

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

    const splitPerPersonCents = calculateSplitPerPerson(totalInCents, splitAmong.length);

    return new Response(
      JSON.stringify({
        success: true,
        expense: {
          id: expense.id,
          subtotal: validatedData.amount,
          tip: validatedData.tipAmount,
          total: validatedData.amount + validatedData.tipAmount,
          description: validatedData.description,
          paidBy: validatedData.paidBy,
          splitAmong,
          splitPerPerson: centsToDollars(splitPerPersonCents), // Display as dollars
          tipPerPerson: centsToDollars(Math.floor(tipInCents / splitAmong.length)), // Display as dollars
        },
      }),
      {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error creating expense:', error);
    if (error instanceof z.ZodError) {
      return new Response(JSON.stringify({ error: error.issues[0].message }), {
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
