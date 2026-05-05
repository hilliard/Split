import type { APIRoute } from 'astro';
import { db } from '../../../db';
import { activities, sessions, events, groupMembers } from '../../../db/schema';
import { eq, and, asc } from 'drizzle-orm';

export const GET: APIRoute = async (context) => {
  try {
    // Get session from cookies
    const sessionId = context.cookies.get('sessionId')?.value;

    if (!sessionId) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get session from database
    const [session] = await db.select().from(sessions).where(eq(sessions.id, sessionId)).limit(1);

    if (!session || new Date(session.expiresAt) < new Date()) {
      return new Response(JSON.stringify({ error: 'Session expired' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    // Support standalone activities (no eventId)
    const standalone = context.url.searchParams.get('standalone');
    if (standalone === '1') {
      // Only allow user to see their own standalone activities
      // Find the user's id (humanId)
      const userId = session.userId;
      // Filter activities by eventId=null AND created by this user
      const activitiesList: any = await (db
        .select()
        .from(activities)
        .where(and(eq(activities.eventId, null), eq(activities.createdBy, userId)))
        .orderBy(asc(activities.startTime), asc(activities.sequenceOrder))
      ) as any;
      return new Response(
        JSON.stringify({ activities: activitiesList }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get eventId from query parameters
    const eventIdRaw = context.url.searchParams.get('eventId');
    if (!eventIdRaw) {
      return new Response(JSON.stringify({ error: 'Event ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    const eventIdStr = String(eventIdRaw);
    // Verify event exists and user has access
    const [event] = (await db
      .select()
      .from(events)
      .where(eq(events.id, eventIdStr))
      .limit(1)) as any;
    if (!event) {
      return new Response(JSON.stringify({ error: 'Event not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Check authorization: user is creator OR member of the group
    const isCreator = event.creatorId === session.userId;
    let isGroupMember = false;

    if (event.groupId) {
      const [membership] = (await db
        .select()
        .from(groupMembers)
        .where(
          and(eq(groupMembers.userId, session.userId), eq(groupMembers.groupId, event.groupId))
        )
        .limit(1)) as any;
      isGroupMember = !!membership;
    }

    if (!isCreator && !isGroupMember) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get activities for the event
    const activitiesList: any = await (db
      .select()
      .from(activities)
      .where(eq(activities.eventId, eventIdStr))
      .orderBy(asc(activities.startTime), asc(activities.sequenceOrder))) as any;

    return new Response(
      JSON.stringify({ activities: activitiesList }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
    // Fallthrough: handled above with explicit response for event activities
  } catch (error) {
    console.error('Error listing activities:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Detailed error:', errorMessage);

    return new Response(
      JSON.stringify({
        error: 'Failed to list activities',
        details: errorMessage,
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
