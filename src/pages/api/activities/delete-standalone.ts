import type { APIRoute } from 'astro';
import { db } from '../../../db';
import { activities, sessions } from '../../../db/schema';
import { eq, isNull } from 'drizzle-orm';
import { z } from 'zod';

const deleteStandaloneActivitySchema = z.object({
  activityId: z.string().uuid('Invalid activity ID'),
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
    const validatedData = deleteStandaloneActivitySchema.parse(data);

    // Verify activity exists and is standalone (eventId is null)
    const [activity] = await db
      .select()
      .from(activities)
      .where(eq(activities.id, validatedData.activityId))
      .limit(1);

    if (!activity) {
      return new Response(JSON.stringify({ error: 'Activity not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Verify activity is standalone (eventId must be null)
    if (activity.eventId !== null) {
      return new Response(JSON.stringify({ error: 'This activity is linked to an event. Use the event detail page to delete it.' }), {
        status: 400,
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
    console.error('Error deleting standalone activity:', error);
    
    if (error instanceof z.ZodError) {
      return new Response(JSON.stringify({ error: error.flatten() }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ 
      error: 'Failed to delete activity',
      details: error instanceof Error ? error.message : 'Unknown error',
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
