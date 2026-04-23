/**
 * API Route: PUT /api/settlements/:settlementId/confirm
 *
 * Receiver confirms they received the payment
 * Changes status from 'pending' to 'completed'
 */

import type { APIRoute } from 'astro';
import { db } from '../../../../db';
import { sessions, settlements, humans } from '../../../../db/schema';
import { eq } from 'drizzle-orm';

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

    const [session] = await db.select().from(sessions).where(eq(sessions.id, sessionId)).limit(1);

    if (!session || new Date(session.expiresAt) < new Date()) {
      return new Response(JSON.stringify({ error: 'Session expired' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get settlementId from route params
    const { settlementId } = context.params;
    if (!settlementId) {
      return new Response(JSON.stringify({ error: 'settlementId is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get settlement
    const [settlement] = await db
      .select()
      .from(settlements)
      .where(eq(settlements.id, settlementId))
      .limit(1);

    if (!settlement) {
      return new Response(JSON.stringify({ error: 'Settlement not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Only the receiver can confirm
    if (session.userId !== settlement.toUserId) {
      return new Response(
        JSON.stringify({
          error: 'Unauthorized: only the receiver can confirm the settlement',
        }),
        {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Settlement must be pending
    if (settlement.status !== 'pending') {
      return new Response(
        JSON.stringify({
          error: `Cannot confirm settlement with status '${settlement.status}'`,
        }),
        {
          status: 409,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Update settlement to completed
    const completedAt = new Date();
    const [updated] = await db
      .update(settlements)
      .set({
        status: 'completed',
        completedAt,
        updatedAt: completedAt,
      })
      .where(eq(settlements.id, settlementId))
      .returning();

    return new Response(
      JSON.stringify({
        success: true,
        settlementId: updated.id,
        status: updated.status,
        completedAt: updated.completedAt,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error confirming settlement:', error);
    return new Response(JSON.stringify({ error: 'Failed to confirm settlement' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
