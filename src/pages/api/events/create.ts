import type { APIRoute } from 'astro';
import { db } from '../../../db';
import { events, sessions } from '../../../db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

// Validation schema for event creation
export const createEventSchema = z.object({
  title: z
    .string()
    .min(1, 'Event title is required')
    .max(255, 'Event title must be less than 255 characters'),
  description: z
    .string()
    .max(2000, 'Description must be less than 2000 characters')
    .optional()
    .nullable(),
  type: z.string().max(50, 'Type must be less than 50 characters').default('general'),
  startTime: z.string().min(1, 'Start time is required'), // Accept any ISO datetime string
  endTime: z.string().optional().nullable(),
  timezone: z.string().max(50, 'Timezone must be less than 50 characters').default('UTC'),
  isVirtual: z.boolean().default(false),
  isPublic: z.boolean().default(true),
  currency: z.string().length(3).default('USD'), // ISO 4217 code
  budget: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});

type CreateEventInput = z.infer<typeof createEventSchema>;

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
    const [session] = await db.select().from(sessions).where(eq(sessions.id, sessionId)).limit(1);

    if (!session || new Date(session.expiresAt) < new Date()) {
      return new Response(JSON.stringify({ error: 'Session expired' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Parse and validate request body
    const data = await context.request.json();

    console.log('📦 Raw request body:', JSON.stringify(data, null, 2));

    // Map form field names to schema field names - handle both old and new formats
    const title = data.title || data.name || '';
    const startTimeValue =
      data.startTime || (data.startDate ? new Date(data.startDate).toISOString() : undefined);
    const endTimeValue =
      data.endTime || (data.endDate ? new Date(data.endDate).toISOString() : undefined);

    const mappedData = {
      title: title,
      description: data.description,
      type: data.type || 'general',
      timezone: data.timezone || 'UTC',
      currency: data.currency || 'USD',
      budget: data.budget,
      isVirtual: data.isVirtual || false,
      isPublic: data.isPublic !== false,
      metadata: data.metadata,
      startTime: startTimeValue,
      endTime: endTimeValue,
    };

    console.log('📝 Mapped data (before validation):', JSON.stringify(mappedData, null, 2));

    // Ensure title is not empty
    if (!mappedData.title || !mappedData.title.trim()) {
      return new Response(JSON.stringify({ error: 'Event name is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!mappedData.startTime) {
      return new Response(JSON.stringify({ error: 'Start time is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const validatedData = (createEventSchema as any).parse(mappedData) as any;

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

    console.log('📝 Creating event:', {
      title: validatedData.title,
      creatorId: session.userId,
      type: validatedData.type,
      startTime: validatedData.startTime,
      endTime: validatedData.endTime,
    });

    // CREATE THE EVENT
    const [newEvent] = (await db
      .insert(events)
      .values({
        creatorId: session.userId,
        title: validatedData.title,
        description: validatedData.description || null,
        type: validatedData.type,
        status: 'scheduled',
        startTime: new Date(validatedData.startTime), // CONVERT STRING TO DATE
        endTime: validatedData.endTime ? new Date(validatedData.endTime) : null, // CONVERT STRING TO DATE
        timezone: validatedData.timezone,
        isVirtual: validatedData.isVirtual || false,
        isPublic: validatedData.isPublic !== false,
        currency: validatedData.currency,
        metadata: validatedData.metadata || {},
        budgetCents: validatedData.budget
          ? Math.round(parseFloat(validatedData.budget) * 100)
          : null,
      })
      .returning()) as any;

    console.log('✓ Event created:', newEvent.id);

    return new Response(
      JSON.stringify({
        success: true,
        event: {
          id: newEvent.id,
          title: newEvent.title,
          description: newEvent.description,
          type: newEvent.type,
          status: newEvent.status,
          startTime: newEvent.startTime,
          endTime: newEvent.endTime,
          timezone: newEvent.timezone,
          isVirtual: newEvent.isVirtual,
          isPublic: newEvent.isPublic,
          currency: newEvent.currency,
          budgetCents: newEvent.budgetCents,
          budget: newEvent.budgetCents ? (newEvent.budgetCents / 100).toFixed(2) : null,
          createdAt: newEvent.createdAt,
        },
      }),
      {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      const details = error.flatten();
      return new Response(
        JSON.stringify({ error: 'Validation failed', details }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    console.error('Event creation error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Internal server error' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
