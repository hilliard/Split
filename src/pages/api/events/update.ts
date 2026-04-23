import type { APIRoute } from 'astro';
import { db } from '../../../db';
import { events, sessions } from '../../../db/schema';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';

// Validation schema for event update
const updateEventSchema = z.object({
  eventId: z.string().uuid('Invalid event ID'),
  title: z.string().min(1, 'Event title is required').max(255).optional(),
  description: z.string().max(2000).optional(),
  type: z.string().max(50).optional(),
  startTime: z
    .string()
    .datetime()
    .or(z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/))
    .optional(),
  endTime: z
    .string()
    .datetime()
    .or(z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/))
    .optional(),
  timezone: z.string().max(50).optional(),
  isVirtual: z.boolean().optional(),
  isPublic: z.boolean().optional(),
  currency: z.string().length(3).optional(),
  budget: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/)
    .optional()
    .nullable(),
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
    const [session] = await db.select().from(sessions).where(eq(sessions.id, sessionId)).limit(1);

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
      return new Response(
        JSON.stringify({ error: 'You do not have permission to edit this event' }),
        {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        }
      );
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

    // Update event - only set fields that have values
    const updateData: any = {};

    // Add optional fields only if provided
    if (validatedData.title !== undefined) updateData.title = validatedData.title;
    if (validatedData.currency !== undefined) updateData.currency = validatedData.currency;
    if (validatedData.description !== undefined)
      updateData.description = validatedData.description || null;
    if (validatedData.type !== undefined) updateData.type = validatedData.type;
    // Convert ISO timestamp strings to Date objects for Drizzle ORM
    if (validatedData.startTime !== undefined)
      updateData.startTime = new Date(validatedData.startTime);
    if (validatedData.endTime !== undefined) updateData.endTime = new Date(validatedData.endTime);
    if (validatedData.timezone !== undefined) updateData.timezone = validatedData.timezone;
    if (validatedData.isVirtual !== undefined) updateData.isVirtual = validatedData.isVirtual;
    if (validatedData.isPublic !== undefined) updateData.isPublic = validatedData.isPublic;
    if (validatedData.metadata !== undefined) updateData.metadata = validatedData.metadata;
    if (validatedData.budget !== undefined)
      updateData.budgetCents = validatedData.budget
        ? Math.round(parseFloat(validatedData.budget) * 100)
        : null;

    // Ensure we're actually updating something
    if (Object.keys(updateData).length === 0) {
      return new Response(JSON.stringify({ error: 'No fields to update' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    console.log('Updating event with data:', updateData);

    const [updatedEvent] = await db
      .update(events)
      .set(updateData)
      .where(eq(events.id, validatedData.eventId))
      .returning();

    return new Response(
      JSON.stringify({
        success: true,
        event: updatedEvent,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error updating event:', error);

    if (error instanceof z.ZodError) {
      return new Response(JSON.stringify({ error: error.flatten() }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Log the full error stack for debugging
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : '';
    console.error('Full error details:', errorMessage, errorStack);

    return new Response(
      JSON.stringify({ error: 'Failed to update event', details: errorMessage }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
