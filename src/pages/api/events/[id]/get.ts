import type { APIRoute } from 'astro';
import { db } from '@/db';
import { events, sessions, humans } from '@/db/schema';
import { canUserReadEvent } from '@/db/authorization';
import { eq } from 'drizzle-orm';

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

    const [session] = await db.select().from(sessions).where(eq(sessions.id, sessionId)).limit(1);

    if (!session || new Date(session.expiresAt) < new Date()) {
      return new Response(JSON.stringify({ error: 'Session expired' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get event ID from URL
    const eventId = context.params.id;
    if (!eventId) {
      return new Response(JSON.stringify({ error: 'Event ID required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get event
    const [event] = await db.select().from(events).where(eq(events.id, eventId));

    if (!event) {
      return new Response(JSON.stringify({ error: 'Event not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Check read permission
    const canRead = await canUserReadEvent(session.userId, eventId);
    if (!canRead) {
      return new Response(
        JSON.stringify({ error: 'You do not have permission to view this event' }),
        {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Get creator info
    const [creator] = await db.select().from(humans).where(eq(humans.id, event.creatorId));

    return new Response(
      JSON.stringify({
        success: true,
        event: {
          id: event.id,
          title: event.title,
          description: event.description,
          type: event.type,
          status: event.status,
          startTime: event.startTime?.toISOString(),
          endTime: event.endTime?.toISOString(),
          timezone: event.timezone,
          isVirtual: event.isVirtual,
          isPublic: event.isPublic,
          currency: event.currency,
          budgetCents: event.budgetCents,
          groupId: event.groupId,
          creatorId: event.creatorId,
          creator: {
            id: creator?.id,
            firstName: creator?.firstName,
            lastName: creator?.lastName,
          },
          createdAt: event.createdAt?.toISOString(),
        },
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error fetching event:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch event' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
