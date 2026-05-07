import type { APIRoute } from 'astro';
import { db } from '@/db';
import { events, sessions, expenseGroups, groupMembers } from '@/db/schema';
import { and, eq } from 'drizzle-orm';

export const POST: APIRoute = async (context) => {
  try {
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

    const eventId = context.params.id;
    if (!eventId) {
      return new Response(JSON.stringify({ error: 'Event ID required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const body = await context.request.json();
    const { groupId } = body;

    if (!groupId) {
      return new Response(JSON.stringify({ error: 'Group ID required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Verify event exists and user is creator
    const [event] = await db.select().from(events).where(eq(events.id, eventId)).limit(1);

    if (!event) {
      return new Response(JSON.stringify({ error: 'Event not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (event.creatorId !== session.userId) {
      return new Response(JSON.stringify({ error: 'Only event creator can link groups' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Verify group exists and user is a member or creator
    const [group] = await db
      .select()
      .from(expenseGroups)
      .where(eq(expenseGroups.id, groupId))
      .limit(1);

    if (!group) {
      return new Response(JSON.stringify({ error: 'Group not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Check if user is group creator or member
    if (group.createdBy !== session.userId) {
      const [membership] = await db
        .select()
        .from(groupMembers)
        .where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, session.userId)))
        .limit(1);

      if (!membership) {
        return new Response(
          JSON.stringify({ error: 'You must be a group member to link it to an event' }),
          {
            status: 403,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }
    }

    // Update event with group
    const [updatedEvent] = await db
      .update(events)
      .set({ groupId: groupId })
      .where(eq(events.id, eventId))
      .returning();

    return new Response(
      JSON.stringify({
        success: true,
        message: `Event linked to group "${group.name}"`,
        event: updatedEvent,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error linking group to event:', error);
    const errorMsg = error instanceof Error ? error.message : 'Internal server error';
    return new Response(JSON.stringify({ error: errorMsg }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
