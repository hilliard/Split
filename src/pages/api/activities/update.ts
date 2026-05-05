import type { APIRoute } from 'astro';
import { db } from '../../../db';
import { activities, sessions, events, groupMembers } from '../../../db/schema';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';

const updateActivitySchema = z.object({
  activityId: z.string().uuid('Invalid activity ID'),
  eventId: z.union([z.string().uuid('Invalid event ID'), z.null(), z.undefined()]).optional(),
  title: z.string().min(1, 'Activity title is required').max(255).optional(),
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
  locationName: z.string().max(255).optional().nullable(),
  sequenceOrder: z.number().int().nonnegative().optional(),
  metadata: z.record(z.string(), z.any()).optional(),
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
    const [session] = await db.select().from(sessions).where(eq(sessions.id, sessionId)).limit(1);

    if (!session || new Date(session.expiresAt) < new Date()) {
      return new Response(JSON.stringify({ error: 'Session expired' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Parse and validate request
    const data = await context.request.json();
    const validatedData = updateActivitySchema.parse(data);

    // Check if standalone or event-linked
    const isStandalone = !validatedData.eventId;

    if (isStandalone) {
      // For standalone activities, just verify the activity exists
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

      // Verify it's actually standalone
      if (activity.eventId !== null) {
        return new Response(JSON.stringify({ error: 'This activity is linked to an event' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    } else {
      // For event-linked activities, verify event ownership
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

      let isCreator = event.creatorId === session.userId;
      let isGroupMember = false;
      if (event.groupId) {
        const groupMember = await db
          .select()
          .from(groupMembers)
          .where(
            and(
              eq(groupMembers.userId, session.userId),
              eq(groupMembers.groupId, event.groupId)
            )
          )
          .limit(1);
        isGroupMember = groupMember.length > 0;
      }

      if (!isCreator && !isGroupMember) {
        return new Response(
          JSON.stringify({ error: 'You do not have permission to edit activities for this event' }),
          {
            status: 403,
            headers: { 'Content-Type': 'application/json' },
          }
        );
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

    // Update activity
    const [updatedActivity] = (await db
      .update(activities)
      .set({
        title: validatedData.title || undefined,
        startTime: validatedData.startTime ? new Date(validatedData.startTime) : undefined,
        endTime: validatedData.endTime ? new Date(validatedData.endTime) : undefined,
        locationName:
          validatedData.locationName !== undefined ? validatedData.locationName : undefined,
        sequenceOrder: validatedData.sequenceOrder || undefined,
        metadata: validatedData.metadata || undefined,
      })
      .where(eq(activities.id, validatedData.activityId))
      .returning()) as any;

    return new Response(
      JSON.stringify({
        success: true,
        activity: updatedActivity,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error updating activity:', error);

    if (error instanceof z.ZodError) {
      return new Response(JSON.stringify({ error: error.flatten() }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Failed to update activity' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
