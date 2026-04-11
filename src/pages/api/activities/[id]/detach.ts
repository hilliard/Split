import type { APIRoute } from 'astro';
import { db } from '@/db';
import { activities, sessions, events } from '@/db/schema';
import { eq } from 'drizzle-orm';

export const PUT: APIRoute = async (context) => {
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

    // Get activity ID from params
    const activityId = context.params.id;
    
    if (!activityId) {
      return new Response(JSON.stringify({ error: 'Activity ID required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get the activity
    const [activity] = await db
      .select()
      .from(activities)
      .where(eq(activities.id, activityId))
      .limit(1);

    if (!activity) {
      return new Response(JSON.stringify({ error: 'Activity not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // If activity is linked to an event, verify user is event creator
    if (activity.eventId) {
      const [event] = await db
        .select()
        .from(events)
        .where(eq(events.id, activity.eventId))
        .limit(1);

      if (event && event.creatorId !== session.userId) {
        return new Response(JSON.stringify({ error: 'Only event creator can detach activities' }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    // Detach activity from event
    await db
      .update(activities)
      .set({ eventId: null })
      .where(eq(activities.id, activityId));

    console.log(`📍 Detached activity ${activityId} from event`);

    return new Response(JSON.stringify({
      success: true,
      message: 'Activity detached from event',
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error detaching activity:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return new Response(JSON.stringify({ 
      error: 'Failed to detach activity',
      details: errorMessage,
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
