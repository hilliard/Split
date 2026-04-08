import type { APIRoute } from 'astro';
import { db } from '../../../db';
import { events, sessions } from '../../../db/schema';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';

// Validation schema for event update
const updateEventSchema = z.object({
  eventId: z.string().uuid('Invalid event ID'),
  title: z.string().min(1, 'Event title is required').max(255),
  description: z.string().max(2000).optional(),
  type: z.string().max(50).optional(),
  startTime: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/)).optional(),
  endTime: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/)).optional(),
  timezone: z.string().max(50).optional(),
  isVirtual: z.boolean().optional(),
  isPublic: z.boolean().optional(),
  currency: z.string().length(3).default('USD'),
  budget: z.string().regex(/^\d+(\.\d{1,2})?$/).optional().nullable(),
  metadata: z.record(z.unknown()).optional(),
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

    // Verify session
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
    const validatedData = updateEventSchema.parse(data);

    // Get event and verify ownership
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
      return new Response(JSON.stringify({ error: 'You do not have permission to edit this event' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Validate datetime range
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

    // Update event
    const [updatedEvent] = await db
      .update(events)
      .set({
        title: validatedData.title,
        description: validatedData.description || null,
        type: validatedData.type || undefined,
        startTime: validatedData.startTime || undefined,
        endTime: validatedData.endTime || undefined,
        timezone: validatedData.timezone || undefined,
        isVirtual: validatedData.isVirtual !== undefined ? validatedData.isVirtual : undefined,
        isPublic: validatedData.isPublic !== undefined ? validatedData.isPublic : undefined,
        currency: validatedData.currency,
        metadata: validatedData.metadata || undefined,
        budgetCents: validatedData.budget ? Math.round(parseFloat(validatedData.budget) * 100) : null,
      })
      .where(eq(events.id, validatedData.eventId))
      .returning();

    return new Response(JSON.stringify({
      success: true,
      event: updatedEvent,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error updating event:', error);
    
    if (error instanceof z.ZodError) {
      return new Response(JSON.stringify({ error: error.flatten() }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Failed to update event' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
