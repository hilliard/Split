import type { APIRoute } from 'astro';
import { db } from '../../../db';
import { activities, sessions, events } from '../../../db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const deleteActivitySchema = z.object({
  activityId: z.string().uuid('Invalid activity ID'),
  eventId: z.string().uuid('Invalid event ID'),
});

export const POST: APIRoute = async (context) => {
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

    // Parse and validate request
    const data = await context.request.json();
    const validatedData = deleteActivitySchema.parse(data);

    // Verify event exists and user is creator
    const [event] = await db
      .select()
      .from(events)
      .where(eq(events.id, validatedData.eventId))
      .limit(1);

    if (!event) {
      return new Response(JSON.stringify({ error: 'Event not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (event.creatorId !== session.userId) {
      return new Response(JSON.stringify({ error: 'You do not have permission to delete activities for this event' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Verify activity exists and belongs to event
    const [activity] = await db
      .select()
      .from(activities)
      .where(eq(activities.id, validatedData.activityId))
      .limit(1);

    if (!activity || activity.eventId !== validatedData.eventId) {
      return new Response(JSON.stringify({ error: 'Activity not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Delete activity
    await db
      .delete(activities)
      .where(eq(activities.id, validatedData.activityId));

    return new Response(JSON.stringify({
      success: true,
      message: 'Activity deleted successfully',
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error deleting activity:', error);
    
    if (error instanceof z.ZodError) {
      return new Response(JSON.stringify({ error: error.flatten() }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Failed to delete activity' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
