import type { APIRoute } from 'astro';
import { db } from '@/db';
import { events, sessions } from '@/db/schema';
import { canUserEditEvent } from '@/db/authorization';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const updateEventSchema = z.object({
  title: z.string().min(1, 'Event title is required').max(255).optional(),
  description: z.string().max(2000).optional().nullable(),
  type: z.string().max(50).optional(),
  status: z.string().max(50).optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional().nullable(),
  timezone: z.string().max(50).optional(),
  isVirtual: z.boolean().optional(),
  isPublic: z.boolean().optional(),
  currency: z.string().length(3).optional(),
  budget: z.string().optional().nullable(),
});

export const PUT: APIRoute = async (context) => {
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

    // Get event ID from URL
    const eventId = context.params.id;
    if (!eventId) {
      return new Response(JSON.stringify({ error: 'Event ID required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get event
    const [event] = await db
      .select()
      .from(events)
      .where(eq(events.id, eventId));

    if (!event) {
      return new Response(JSON.stringify({ error: 'Event not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Check edit permission
    const canEdit = await canUserEditEvent(session.userId, eventId);
    if (!canEdit) {
      return new Response(
        JSON.stringify({ error: 'You do not have permission to edit this event' }),
        {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Parse and validate request
    const data = await context.request.json();
    const validatedData = updateEventSchema.parse(data);

    // Build update object with only provided fields
    const updateData: any = {};
    if (validatedData.title !== undefined) updateData.title = validatedData.title;
    if (validatedData.description !== undefined) updateData.description = validatedData.description;
    if (validatedData.type !== undefined) updateData.type = validatedData.type;
    if (validatedData.status !== undefined) updateData.status = validatedData.status;
    if (validatedData.startTime !== undefined) updateData.startTime = new Date(validatedData.startTime);
    if (validatedData.endTime !== undefined) updateData.endTime = validatedData.endTime ? new Date(validatedData.endTime) : null;
    if (validatedData.timezone !== undefined) updateData.timezone = validatedData.timezone;
    if (validatedData.isVirtual !== undefined) updateData.isVirtual = validatedData.isVirtual;
    if (validatedData.isPublic !== undefined) updateData.isPublic = validatedData.isPublic;
    if (validatedData.currency !== undefined) updateData.currency = validatedData.currency;
    if (validatedData.budget !== undefined) {
      // Convert budget to cents
      const budgetCents = validatedData.budget 
        ? Math.round(parseFloat(validatedData.budget) * 100)
        : null;
      updateData.budgetCents = budgetCents;
    }

    // Update event
    const [updatedEvent] = await db
      .update(events)
      .set(updateData)
      .where(eq(events.id, eventId))
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
      return new Response(JSON.stringify({ error: error.errors[0].message }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const errorMessage = error instanceof Error ? error.message : JSON.stringify(error);

    return new Response(
      JSON.stringify({
        error: 'Failed to update event',
        details: errorMessage,
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
