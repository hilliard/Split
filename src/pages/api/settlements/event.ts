/**
 * API Route: GET /api/settlements/event?eventId=X&status=pending
 * 
 * Get all settlements for an event
 * Optional: filter by status (pending, completed, disputed, cancelled)
 */

import type { APIRoute } from 'astro';
import { db } from '../../../db';
import { sessions, settlements, events, humans } from '../../../db/schema';
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
    const statusFilter = context.url.searchParams.get('status');

    if (!eventId) {
      return new Response(JSON.stringify({ error: 'eventId is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Verify event exists
    const [event] = await db
      .select()
      .from(events)
      .where(eq(events.id, eventId))
      .limit(1);

    if (!event) {
      return new Response(JSON.stringify({ error: 'Event not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Build query
    let whereCondition = eq(settlements.eventId, eventId);
    if (statusFilter) {
      whereCondition = and(whereCondition, eq(settlements.status, statusFilter));
    }

    // Get settlements
    const allSettlements = await db
      .select()
      .from(settlements)
      .where(whereCondition)
      .orderBy((s) => [s.createdAt]);

    // Enrich with user names
    const enriched = await Promise.all(
      allSettlements.map(async (settlement) => {
        const [fromUser] = await db
          .select()
          .from(humans)
          .where(eq(humans.id, settlement.fromUserId))
          .limit(1);

        const [toUser] = await db
          .select()
          .from(humans)
          .where(eq(humans.id, settlement.toUserId))
          .limit(1);

        return {
          id: settlement.id,
          from: settlement.fromUserId,
          fromName: fromUser
            ? `${fromUser.firstName} ${fromUser.lastName}`.trim()
            : 'Unknown',
          to: settlement.toUserId,
          toName: toUser ? `${toUser.firstName} ${toUser.lastName}`.trim() : 'Unknown',
          amount: settlement.amount / 100, // Convert to dollars
          amountCents: settlement.amount,
          description: settlement.description,
          status: settlement.status,
          paymentMethod: settlement.paymentMethod,
          createdAt: settlement.createdAt,
          completedAt: settlement.completedAt,
        };
      })
    );

    // Count by status
    const statusCounts = {
      pending: enriched.filter((s) => s.status === 'pending').length,
      completed: enriched.filter((s) => s.status === 'completed').length,
      disputed: enriched.filter((s) => s.status === 'disputed').length,
      cancelled: enriched.filter((s) => s.status === 'cancelled').length,
    };

    return new Response(
      JSON.stringify({
        success: true,
        eventId,
        eventName: event.name,
        total: enriched.length,
        statusCounts,
        settlements: enriched,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error fetching event settlements:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch settlements' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
