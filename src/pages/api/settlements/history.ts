/**
 * API Route: GET /api/settlements/history?userId=X&eventId=Y
 *
 * Get all settlements where user is payer or receiver
 * Shows payment history with status
 */

import type { APIRoute } from 'astro';
import { db } from '../../../db';
import { sessions, settlements, humans, events } from '../../../db/schema';
import { eq, and, or } from 'drizzle-orm';

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

    const [session] = (await db.select().from(sessions).where(eq(sessions.id, sessionId)).limit(1)) as any;

    if (!session || new Date(session.expiresAt) < new Date()) {
      return new Response(JSON.stringify({ error: 'Session expired' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get query parameters
    const userId = context.url.searchParams.get('userId');
    const eventId = context.url.searchParams.get('eventId');

    // Default to current user if not specified
    const targetUserId = userId || session.userId;

    // Only user can view their own settlement history
    if (targetUserId !== session.userId) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized: can only view your own settlement history' }),
        {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Build query
    let whereCondition;
    if (eventId) {
      whereCondition = and(
        eq(settlements.eventId, eventId),
        or(eq(settlements.fromUserId, targetUserId), eq(settlements.toUserId, targetUserId))
      );
    } else {
      whereCondition = or(
        eq(settlements.fromUserId, targetUserId),
        eq(settlements.toUserId, targetUserId)
      );
    }

    // Get settlements
    const userSettlements: any = await (db
      .select()
      .from(settlements)
      .where(whereCondition)
      .orderBy((s) => [s.createdAt])) as any;

    // Enrich with user names and event info
    const enriched = await Promise.all(
      userSettlements.map(async (settlement: any) => {
        const [fromUser] = (await db
          .select()
          .from(humans)
          .where(eq(humans.id, settlement.fromUserId))
          .limit(1)) as any;

        const [toUser] = (await db
          .select()
          .from(humans)
          .where(eq(humans.id, settlement.toUserId))
          .limit(1)) as any;

        const [event] = (await db
          .select()
          .from(events)
          .where(eq(events.id, settlement.eventId))
          .limit(1)) as any;

        return {
          id: settlement.id,
          from: settlement.fromUserId,
          fromName: fromUser ? `${fromUser.firstName} ${fromUser.lastName}`.trim() : 'Unknown',
          to: settlement.toUserId,
          toName: toUser ? `${toUser.firstName} ${toUser.lastName}`.trim() : 'Unknown',
          amount: settlement.amount / 100, // Convert to dollars
          amountCents: settlement.amount,
          description: settlement.description,
          status: settlement.status,
          paymentMethod: settlement.paymentMethod,
          eventId: settlement.eventId,
          eventName: event?.name || 'Unknown',
          createdAt: settlement.createdAt,
          completedAt: settlement.completedAt,
        };
      })
    );

    // Separate paid and received
    const paid = enriched.filter((s) => s.from === targetUserId);
    const received = enriched.filter((s) => s.to === targetUserId);

    return new Response(
      JSON.stringify({
        success: true,
        userId: targetUserId,
        paid,
        received,
        total: {
          sent: paid.reduce((sum, s) => sum + s.amount, 0),
          received: received.reduce((sum, s) => sum + s.amount, 0),
        },
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error fetching settlement history:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch settlement history' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
