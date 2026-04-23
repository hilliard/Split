import type { APIRoute } from 'astro';
import { db } from '@/db';
import { expenseGroups, groupMembers, pendingGroupInvitations, sessions } from '@/db/schema';
import { canUserManageGroup } from '@/db/authorization';
import { eq } from 'drizzle-orm';

export const DELETE: APIRoute = async (context) => {
  try {
    // Get session
    const sessionId = context.cookies.get('sessionId')?.value;
    if (!sessionId) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const [session] = await db.select().from(sessions).where(eq(sessions.id, sessionId)).limit(1);

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

    // Check delete permission (only group owner/creator can delete)
    const canManage = await canUserManageGroup(session.userId, groupId);
    if (!canManage) {
      return new Response(
        JSON.stringify({ error: 'Only the group creator can delete this group' }),
        {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Delete the group (cascade will handle members and pending invitations)
    // But we'll explicitly delete them for clarity
    await db.delete(pendingGroupInvitations).where(eq(pendingGroupInvitations.groupId, groupId));

    await db.delete(groupMembers).where(eq(groupMembers.groupId, groupId));

    await db.delete(expenseGroups).where(eq(expenseGroups.id, groupId));

    return new Response(
      JSON.stringify({
        success: true,
        message: `Group "${group.name}" has been deleted`,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error deleting group:', error);

    const errorMessage = error instanceof Error ? error.message : JSON.stringify(error);

    return new Response(
      JSON.stringify({
        error: 'Failed to delete group',
        details: errorMessage,
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
