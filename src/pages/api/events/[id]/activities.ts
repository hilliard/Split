import type { APIRoute } from 'astro';
import { db } from '../../../../db';
import { activities, sessions, events } from '../../../../db/schema';
import { eq } from 'drizzle-orm';

export const GET: APIRoute = async ({ params, cookies }) => {
  try {
    const sessionId = cookies.get('sessionId')?.value;
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

    const eventId = params.id;

    if (!eventId) {
      return new Response(JSON.stringify({ error: 'Event ID required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Verify event ownership
    const [event] = await db.select().from(events).where(eq(events.id, eventId)).limit(1);

    if (!event || event.creatorId !== session.userId) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get activities
    const eventActivities = await db
      .select()
      .from(activities)
      .where(eq(activities.eventId, eventId));

    return new Response(JSON.stringify({ activities: eventActivities }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching activities:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch activities' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
