// src/pages/api/expenses/user-total.ts
import type { APIRoute } from 'astro';
import { db } from '../../../db';
import { expenses } from '../../../db/schema';
import { eq } from 'drizzle-orm';

export const GET: APIRoute = async ({ url }) => {
  const userId = url.searchParams.get('userId');
  if (!userId) {
    return new Response(JSON.stringify({ error: 'userId required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Sum all expenses where this user is the payer (paidBy)
  const rows = await db
    .select({ amount: expenses.amount })
    .from(expenses)
    .where(eq(expenses.paidBy, userId));

  const totalCents = rows.reduce((sum, r) => sum + Number(r.amount), 0);

  return new Response(JSON.stringify({ totalCents }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
