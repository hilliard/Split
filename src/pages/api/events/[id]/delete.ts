import type { APIRoute } from 'astro';
import { db } from '@/db';
import { events, sessions, activities, expenses } from '@/db/schema';
import { canUserDeleteEvent } from '@/db/authorization';
import { eq } from 'drizzle-orm';

export const DELETE: APIRoute = async (context) => {
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

    // Check delete permission (only owner or group admin)
    const canDelete = await canUserDeleteEvent(session.userId, eventId);
    if (!canDelete) {
      return new Response(
        JSON.stringify({ error: 'You do not have permission to delete this event' }),
        {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Delete related expenses (cascade would handle this, but explicit for clarity)
    await db.delete(expenses).where(eq(expenses.eventId, eventId));

    // Delete related activities
    await db.delete(activities).where(eq(activities.eventId, eventId));

    // Delete the event
    await db.delete(events).where(eq(events.id, eventId));

    return new Response(
      JSON.stringify({
        success: true,
        message: `Event "${event.title}" has been deleted`,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error deleting event:', error);

    const errorMessage = error instanceof Error ? error.message : JSON.stringify(error);

    return new Response(
      JSON.stringify({
        error: 'Failed to delete event',
        details: errorMessage,
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
