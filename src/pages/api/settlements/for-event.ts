/**
 * API Route: GET /api/settlements/for-event?eventId=X
 * 
 * Fetch all settlements (pending and completed) for an event
 * Used for displaying settlement history and status
 */

import type { APIRoute } from 'astro';
import { db } from '../../../db';
import { sessions, settlements, humans, events } from '../../../db/schema';
import { eq, and } from 'drizzle-orm';

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

    // Get eventId from query params
    const eventId = context.url.searchParams.get('eventId');
    if (!eventId) {
      return new Response(JSON.stringify({ error: 'eventId is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Verify event exists
    const [eventRecord] = await db
      .select()
      .from(events)
      .where(eq(events.id, eventId))
      .limit(1);

    if (!eventRecord) {
      return new Response(JSON.stringify({ error: 'Event not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get all settlements for this event
    const allSettlements = await db
      .select()
      .from(settlements)
      .where(eq(settlements.eventId, eventId));

    // Enrich with user names
    const enrichedSettlements = await Promise.all(
      allSettlements.map(async (settlement) => {
        const [fromUser] = await db
          .select()
          .from(humans)
          .where(eq(humans.id, settlement.fromUserId));

        const [toUser] = await db
          .select()
          .from(humans)
          .where(eq(humans.id, settlement.toUserId));

        return {
          id: settlement.id,
          from: settlement.fromUserId,
          fromName: fromUser ? `${fromUser.firstName} ${fromUser.lastName}`.trim() : 'Unknown',
          to: settlement.toUserId,
          toName: toUser ? `${toUser.firstName} ${toUser.lastName}`.trim() : 'Unknown',
          amount: settlement.amount / 100, // Convert cents to dollars
          amountCents: settlement.amount,
          status: settlement.status,
          paymentMethod: settlement.paymentMethod,
          description: settlement.description,
          createdAt: settlement.createdAt,
          completedAt: settlement.completedAt,
          updatedAt: settlement.updatedAt,
          isCurrentUserPayer: settlement.fromUserId === session.userId,
          isCurrentUserReceiver: settlement.toUserId === session.userId,
        };
      })
    );

    // Separate pending and completed
    const pending = enrichedSettlements.filter((s) => s.status === 'pending');
    const completed = enrichedSettlements.filter((s) => s.status === 'completed');

    // Calculate summary
    const summary = {
      total: allSettlements.length,
      pending: pending.length,
      completed: completed.length,
      totalAmount: allSettlements.reduce((sum, s) => sum + s.amount, 0) / 100,
      totalAmountCents: allSettlements.reduce((sum, s) => sum + s.amount, 0),
    };

    return new Response(
      JSON.stringify({
        success: true,
        eventId,
        settlements: enrichedSettlements,
        pending,
        completed,
        summary,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error fetching settlements:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch settlements' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
