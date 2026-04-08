import type { APIRoute } from 'astro';
import { db } from '../../../db';
import { events, sessions, expenseGroups, groupMembers, humans, activities } from '../../../db/schema';
import { eq } from 'drizzle-orm';

export const GET: APIRoute = async ({ params, cookies, url }) => {
  try {
    const sessionId = cookies.get('sessionId')?.value;
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

    const eventId = params.id || url.searchParams.get('id');
    const includeGroup = url.searchParams.get('includeGroup') === 'true';

    if (!eventId) {
      return new Response(JSON.stringify({ error: 'Event ID required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

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

    if (event.creatorId !== session.userId) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    let response: any = { event };

    if (includeGroup && event.groupId) {
      const [group] = await db
        .select()
        .from(expenseGroups)
        .where(eq(expenseGroups.id, event.groupId))
        .limit(1);

      if (group) {
        response.group = group;

        // Get group members
        const members = await db
          .select({
            id: groupMembers.id,
            userId: groupMembers.userId,
            firstName: humans.firstName,
            lastName: humans.lastName,
            phone: humans.phone,
          })
          .from(groupMembers)
          .innerJoin(humans, eq(groupMembers.userId, humans.id))
          .where(eq(groupMembers.groupId, event.groupId));

        response.members = members;
      }
    }

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching event:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch event' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const DELETE: APIRoute = async ({ params, cookies }) => {
  try {
    const sessionId = cookies.get('sessionId')?.value;
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

    const eventId = params.id;
    if (!eventId) {
      return new Response(JSON.stringify({ error: 'Event ID required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

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

    if (event.creatorId !== session.userId) {
      return new Response(JSON.stringify({ error: 'You do not have permission to delete this event' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Delete event (cascade will handle related records)
    await db.delete(events).where(eq(events.id, eventId));

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error deleting event:', error);
    return new Response(JSON.stringify({ error: 'Failed to delete event' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
