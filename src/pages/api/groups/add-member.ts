import type { APIRoute } from 'astro';
import { db } from '../../../db';
import { groupMembers, sessions, expenseGroups } from '../../../db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const addMemberSchema = z.object({
  groupId: z.string().uuid('Invalid group ID'),
  userId: z.string().uuid('Invalid user ID'),
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
    const data = await context.request.json();
    const validatedData = addMemberSchema.parse(data);

    // Verify group exists and user owns it
    const [group] = await db
      .select()
      .from(expenseGroups)
      .where(eq(expenseGroups.id, validatedData.groupId))
      .limit(1);

    if (!group) {
      return new Response(JSON.stringify({ error: 'Group not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (group.createdBy !== session.userId) {
      return new Response(JSON.stringify({ error: 'You do not have permission to manage this group' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Check if member already exists
    const [existingMember] = await db
      .select()
      .from(groupMembers)
      .where(
        eq(groupMembers.groupId, validatedData.groupId),
      )
      .limit(1);

    if (existingMember && existingMember.userId === validatedData.userId) {
      return new Response(JSON.stringify({ error: 'User is already a member of this group' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Add member
    const [newMember] = await db
      .insert(groupMembers)
      .values({
        groupId: validatedData.groupId,
        userId: validatedData.userId,
        joinedAt: new Date(),
      })
      .returning();

    return new Response(JSON.stringify({
      success: true,
      member: newMember,
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error adding member:', error);

    if (error instanceof z.ZodError) {
      return new Response(JSON.stringify({ error: error.errors[0].message }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Failed to add member' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
