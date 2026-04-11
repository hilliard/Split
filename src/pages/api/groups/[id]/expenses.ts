import type { APIRoute } from 'astro';
import { db } from '@/db';
import { expenses } from '@/db/schema';
import { eq } from 'drizzle-orm';

export const GET: APIRoute = async (context) => {
  try {
    const groupId = context.params.id;

    if (!groupId) {
      return new Response(JSON.stringify({ error: 'Group ID required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    console.log(`🔍 Fetching expenses for group: ${groupId}`);

    // Fetch all expenses for the group (no authorization required on dashboard)
    const groupExpenses = await db
      .select({
        id: expenses.id,
        groupId: expenses.groupId,
        amount: expenses.amount,
        tipAmount: expenses.tipAmount,
        description: expenses.description,
        paidBy: expenses.paidBy,
        createdAt: expenses.createdAt,
      })
      .from(expenses)
      .where(eq(expenses.groupId, groupId));

    console.log(`✅ Found ${groupExpenses.length} expenses for group ${groupId}`);

    return new Response(
      JSON.stringify({
        success: true,
        expenses: groupExpenses,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error fetching group expenses:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch expenses' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
