import type { APIRoute } from 'astro';
import { db } from '../../../db';
import { events } from '../../../db/schema';
import { sessions } from '../../../db/schema';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';

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

    console.log('🔍 Session lookup result:', { sessionId, sessionExists: !!session });

    if (!session || new Date(session.expiresAt) < new Date()) {
      return new Response(JSON.stringify({ error: 'Session expired or invalid' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    console.log('✓ Valid session found, userId:', session.userId);

    // Parse and validate request body
    const data = await context.request.json();
    console.log('📦 Raw request data:', JSON.stringify(data, null, 2));
    
    // Manual validation with lenient parsing
    const name = String(data.name || '').trim();
    const description = String(data.description || '').trim();
    const location = String(data.location || '').trim();
    const startDate = String(data.startDate || '').trim();
    const endDate = String(data.endDate || '').trim();
    const currency = String(data.currency || 'USD').trim();
    const budget = String(data.budget || '').trim();
    
    if (!name) {
      return new Response(JSON.stringify({ error: 'Event name is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    console.log('✓ Data parsed:', { name, currency, hasStartDate: !!startDate, hasBudget: !!budget });

    // Validate date range if both dates provided
    if (validatedData.startDate && validatedData.endDate) {
      const start = new Date(validatedData.startDate);
      const end = new Date(validatedData.endDate);
      if (start > end) {
        return new Response(JSON.stringify({ error: 'Start date must be before end date' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    console.log('📝 Creating event:', {
      title: name,
      creatorId: session.userId,
    });

    // Generate event ID and timestamps
    const eventId = randomUUID();
    const startTime = startDate ? new Date(startDate) : new Date();
    const endTime = endDate ? new Date(endDate) : null;
    const createdAt = new Date();
    const budgetCents = budget ? Math.round(parseFloat(budget) * 100) : null;

    const eventData = {
      id: eventId,
      creatorId: session.userId,
      title: name,
      description: description || null,
      location: location || null,
      startTime: startTime.toISOString(),
      endTime: endTime?.toISOString() || null,
      currency: currency,
      budgetCents,
      type: 'general' as const,
      status: 'scheduled' as const,
      createdAt: createdAt.toISOString(),
    };

    // Insert the event
    console.log('📝 Inserting event:', { eventId, title: validatedData.name });
    try {
      await db.insert(events).values(eventData);
      console.log('✓ Event inserted successfully');
    } catch (insertError) {
      console.error('❌ Insert failed:', insertError);
      throw insertError;
    }

    // Return the created event (use the data we just inserted)
    return new Response(JSON.stringify({
      success: true,
      event: {
        id: eventData.id,
        title: eventData.title,
        description: eventData.description,
        location: eventData.location,
        startTime: eventData.startTime,
        endTime: eventData.endTime,
        currency: eventData.currency,
        budgetCents: eventData.budgetCents,
        budget: eventData.budgetCents ? (eventData.budgetCents / 100).toFixed(2) : null,
        createdAt: eventData.createdAt,
      },
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('❌ Event creation error:', error);
    const errorMsg = error instanceof Error ? error.message : 'Internal server error';
    return new Response(JSON.stringify({ error: errorMsg }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
