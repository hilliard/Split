import type { APIRoute } from 'astro';
import { db } from '../../../../../db';
import { pendingGroupInvitations, groupMembers, sessions } from '../../../../../db/schema';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';

const acceptSchema = z.object({
  invitationId: z.string().uuid('Invalid invitation ID'),
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
    const validatedData = acceptSchema.parse(data);

    // Get invitation
    const [invitation] = await db
      .select()
      .from(pendingGroupInvitations)
      .where(eq(pendingGroupInvitations.id, validatedData.invitationId))
      .limit(1);

    if (!invitation) {
      return new Response(JSON.stringify({ error: 'Invitation not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Check if already accepted
    if (invitation.status !== 'pending') {
      return new Response(
        JSON.stringify({ error: `Invitation is ${invitation.status}` }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Check if expired
    if (invitation.expiresAt && new Date(invitation.expiresAt) < new Date()) {
      // Mark as expired
      await db
        .update(pendingGroupInvitations)
        .set({ status: 'expired' })
        .where(eq(pendingGroupInvitations.id, validatedData.invitationId));

      return new Response(JSON.stringify({ error: 'Invitation has expired' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Add user to group
    const [membership] = await db
      .insert(groupMembers)
      .values({
        groupId: invitation.groupId,
        userId: session.userId,
        joinedAt: new Date(),
      })
      .returning();

    // Mark invitation as accepted
    await db
      .update(pendingGroupInvitations)
      .set({ 
        status: 'accepted',
        acceptedAt: new Date(),
      })
      .where(eq(pendingGroupInvitations.id, validatedData.invitationId));

    console.log('✓ Invitation accepted, user added to group');

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Joined group successfully',
        membership,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error accepting invitation:', error);

    if (error instanceof z.ZodError) {
      return new Response(JSON.stringify({ error: error.errors[0].message }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: 'Failed to accept invitation', details: errorMessage }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
