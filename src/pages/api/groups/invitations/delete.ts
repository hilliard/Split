import type { APIRoute } from 'astro';
import { db } from '@/db';
import { pendingGroupInvitations, sessions, expenseGroups } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

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

    // Get invitation ID from request body
    const body = await context.request.json();
    const { invitationId } = body;

    if (!invitationId) {
      return new Response(JSON.stringify({ error: 'Invitation ID required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get the invitation
    const [invitation] = await db
      .select()
      .from(pendingGroupInvitations)
      .where(eq(pendingGroupInvitations.id, invitationId))
      .limit(1);

    if (!invitation) {
      return new Response(JSON.stringify({ error: 'Invitation not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Verify user is the group creator (has permission to delete)
    const [group] = await db
      .select()
      .from(expenseGroups)
      .where(eq(expenseGroups.id, invitation.groupId))
      .limit(1);

    if (!group || group.createdBy !== session.userId) {
      return new Response(
        JSON.stringify({ error: 'Not authorized to delete this invitation' }),
        {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Delete the invitation
    await db
      .delete(pendingGroupInvitations)
      .where(eq(pendingGroupInvitations.id, invitationId));

    return new Response(
      JSON.stringify({
        success: true,
        message: `Invitation to ${invitation.email} has been deleted`,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error deleting invitation:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to delete invitation' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
