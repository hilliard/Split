import type { APIRoute } from 'astro';
import { db } from '../../../db';
import { sessions, activities, events } from '../../../db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const createActivitySchema = z.object({
  eventId: z.string().uuid('Invalid event ID'),
  title: z.string().min(1, 'Activity title is required').max(255),
  startTime: z.union([
    z.null(),
    z.string().refine(v => !v || /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(v), 'Invalid start time format')
  ]).optional().transform(v => (v === null || v === '') ? undefined : v),
  endTime: z.union([
    z.null(),
    z.string().refine(v => !v || /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(v), 'Invalid end time format')
  ]).optional().transform(v => (v === null || v === '') ? undefined : v),
  locationName: z.union([
    z.null(),
    z.string().max(255)
  ]).optional().transform(v => (v === null || v === '') ? undefined : v),
  sequenceOrder: z.number().int().nonnegative().default(0),
});

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

    // Parse and validate
    let data;
    try {
      data = await context.request.json();
    } catch (parseError) {
      console.error('Failed to parse request body:', parseError);
      return new Response(JSON.stringify({ error: 'Invalid request body' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    const validatedData = createActivitySchema.parse(data);

    // Verify event exists and user owns it
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
      return new Response(JSON.stringify({ error: 'You do not have permission to add activities to this event' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Validate datetime range if both provided
    if (validatedData.startTime && validatedData.endTime) {
      const start = new Date(validatedData.startTime);
      const end = new Date(validatedData.endTime);
      if (start >= end) {
        return new Response(JSON.stringify({ error: 'Start time must be before end time' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    // Convert datetime strings to proper Date objects
    let startDate = null;
    let endDate = null;
    
    if (validatedData.startTime) {
      try {
        // Handle datetime-local format: "2024-01-15T14:30"
        // Append :00Z to make it valid ISO 8601 with seconds and timezone
        const timeStr = validatedData.startTime.length === 16 
          ? validatedData.startTime + ':00Z'
          : validatedData.startTime.includes('Z') ? validatedData.startTime : validatedData.startTime + 'Z';
        startDate = new Date(timeStr);
        if (isNaN(startDate.getTime())) {
          throw new Error('Invalid date');
        }
      } catch (e) {
        console.error('Start time conversion error:', e, 'input:', validatedData.startTime);
        return new Response(JSON.stringify({ error: 'Invalid start time format' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }
    
    if (validatedData.endTime) {
      try {
        const timeStr = validatedData.endTime.length === 16 
          ? validatedData.endTime + ':00Z'
          : validatedData.endTime.includes('Z') ? validatedData.endTime : validatedData.endTime + 'Z';
        endDate = new Date(timeStr);
        if (isNaN(endDate.getTime())) {
          throw new Error('Invalid date');
        }
      } catch (e) {
        console.error('End time conversion error:', e, 'input:', validatedData.endTime);
        return new Response(JSON.stringify({ error: 'Invalid end time format' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    // Create activity
    const [newActivity] = await db
      .insert(activities)
      .values({
        eventId: validatedData.eventId,
        title: validatedData.title,
        startTime: startDate,
        endTime: endDate,
        locationName: validatedData.locationName || null,
        sequenceOrder: validatedData.sequenceOrder,
      })
      .returning();

    return new Response(JSON.stringify({
      success: true,
      activity: newActivity,
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error creating activity:', error);
    
    const errorMessage = error instanceof Error ? error.message : JSON.stringify(error);
    console.error('Detailed error:', errorMessage);

    if (error instanceof z.ZodError) {
      console.error('Validation errors:', error.errors);
      return new Response(JSON.stringify({ error: 'Validation failed', details: error.flatten() }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ 
      error: 'Failed to create activity',
      details: errorMessage,
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
