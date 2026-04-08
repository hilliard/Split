import type { APIRoute } from 'astro';
import { db } from '../../../../db';
import { expenseGroups, groupMembers, sessions } from '../../../../db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const updateGroupSchema = z.object({
  name: z.string().min(1, 'Group name is required').max(255),
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

    // Get group ID from URL
    const groupId = context.params.id;
    if (!groupId) {
      return new Response(JSON.stringify({ error: 'Group ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get the group
    const [group] = await db
      .select()
      .from(expenseGroups)
      .where(eq(expenseGroups.id, groupId))
      .limit(1);

    if (!group) {
      return new Response(JSON.stringify({ error: 'Group not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Check if user is a member of the group (only members can edit)
    const [member] = await db
      .select()
      .from(groupMembers)
      .where(
        eq(groupMembers.groupId, groupId) && eq(groupMembers.userId, session.userId)
      );

    if (!member) {
      return new Response(
        JSON.stringify({ error: 'You do not have permission to edit this group' }),
        {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Parse and validate request
    const data = await context.request.json();
    const validatedData = updateGroupSchema.parse(data);

    // Update group
    const [updatedGroup] = await db
      .update(expenseGroups)
      .set({
        name: validatedData.name,
      })
      .where(eq(expenseGroups.id, groupId))
      .returning();

    return new Response(
      JSON.stringify({
        success: true,
        group: updatedGroup,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error updating group:', error);

    if (error instanceof z.ZodError) {
      return new Response(JSON.stringify({ error: error.issues[0]?.message ?? 'Validation error' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const errorMessage = error instanceof Error ? error.message : JSON.stringify(error);

    return new Response(
      JSON.stringify({
        error: 'Failed to update group',
        details: errorMessage,
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
