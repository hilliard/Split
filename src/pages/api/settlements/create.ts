/**
 * API Route: POST /api/settlements/create
 *
 * Record a payment transaction between users to settle an expense debt
 *
 * Request:
 * {
 *   "eventId": "event-uuid",
 *   "fromUserId": "payer-uuid",
 *   "toUserId": "receiver-uuid",
 *   "amountCents": 12149,
 *   "paymentMethod": "venmo",
 *   "description": "Paid for hotel"
 * }
 */

import type { APIRoute } from 'astro';
import { db } from '../../../db';
import { sessions, settlements, events, humans } from '../../../db/schema';
import { eq, and } from 'drizzle-orm';

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

    // Parse request body
    const body = await context.request.json();
    const { eventId, groupId, fromUserId, toUserId, amountCents, paymentMethod, description } = body;

    // Validation
    if ((!eventId && !groupId) || !fromUserId || !toUserId || !amountCents) {
      return new Response(
        JSON.stringify({
          error: 'Missing required fields: (eventId or groupId), fromUserId, toUserId, amountCents',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    if (amountCents <= 0) {
      return new Response(JSON.stringify({ error: 'Amount must be greater than 0' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Only the payer can record the settlement
    if (session.userId !== fromUserId) {
      return new Response(
        JSON.stringify({
          error: 'Unauthorized: only the payer can record a settlement',
        }),
        {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Verify event exists if provided
    if (eventId) {
      const [event] = await db.select().from(events).where(eq(events.id, eventId)).limit(1);

      if (!event) {
        return new Response(JSON.stringify({ error: 'Event not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    // Verify both users exist
    const [fromUser] = await db.select().from(humans).where(eq(humans.id, fromUserId)).limit(1);

    const [toUser] = await db.select().from(humans).where(eq(humans.id, toUserId)).limit(1);

    if (!fromUser || !toUser) {
      return new Response(JSON.stringify({ error: 'One or both users not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Check if settlement already exists for this pair
    const existingQuery = db
      .select()
      .from(settlements)
      .where(
        and(
          eventId ? eq(settlements.eventId, eventId) : eq(settlements.groupId, groupId),
          eq(settlements.fromUserId, fromUserId),
          eq(settlements.toUserId, toUserId),
          eq(settlements.status, 'pending')
        )
      )
      .limit(1);
    
    const [existing] = await existingQuery;

    if (existing) {
      return new Response(
        JSON.stringify({
          error: 'Pending settlement already exists for this pair',
          settlementId: existing.id,
        }),
        {
          status: 409,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Create settlement
    const now = new Date();
    const [settlement] = await db
      .insert(settlements)
      .values({
        eventId: eventId || null,
        groupId: groupId || null,
        fromUserId,
        toUserId,
        amount: amountCents,
        paymentMethod: paymentMethod || null,
        description: description || '',
        status: 'completed', // Auto-completed for now since we lack a receiver-confirmation UI
        completedAt: now,
      })
      .returning();

    return new Response(
      JSON.stringify({
        success: true,
        settlementId: settlement.id,
        status: settlement.status,
        createdAt: settlement.createdAt,
      }),
      {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error creating settlement:', error);
    return new Response(JSON.stringify({ error: 'Failed to create settlement' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
