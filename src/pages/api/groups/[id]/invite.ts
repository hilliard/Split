import type { APIRoute } from 'astro';
import { db } from '@/db';
import { expenseGroups, pendingGroupInvitations, sessions, humans } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';
import { sendGroupInvitationEmail } from '@/utils/email';

const inviteSchema = z.object({
  email: z.string().email('Invalid email address'),
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

    // Get group ID from URL
    const { id: groupId } = context.params;
    if (!groupId) {
      return new Response(JSON.stringify({ error: 'Group ID required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Verify user is group creator
    const [group] = await db
      .select()
      .from(expenseGroups)
      .where(eq(expenseGroups.id, groupId))
      .limit(1);

    if (!group || group.createdBy !== session.userId) {
      return new Response(JSON.stringify({ error: 'Not authorized to invite' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Parse and validate
    const data = await context.request.json();
    const validatedData = inviteSchema.parse(data);

    // Check if already invited (pending)
    const [existing] = await db
      .select()
      .from(pendingGroupInvitations)
      .where(
        and(
          eq(pendingGroupInvitations.groupId, groupId),
          eq(pendingGroupInvitations.email, validatedData.email),
          eq(pendingGroupInvitations.status, 'pending')
        )
      )
      .limit(1);

    if (existing) {
      return new Response(
        JSON.stringify({ error: 'Invitation already sent to this email' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Create pending invitation
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // Expire in 30 days

    const [invitation] = await db
      .insert(pendingGroupInvitations)
      .values({
        groupId,
        email: validatedData.email,
        invitedBy: session.userId,
        expiresAt,
      })
      .returning();

    console.log('✓ Invitation created:', invitation.id);

    // Get sender info
    const [sender] = await db
      .select()
      .from(humans)
      .where(eq(humans.id, session.userId))
      .limit(1);

    const senderName = sender?.firstName || 'A friend';

    // Build accept URL
    const baseUrl = process.env.PUBLIC_URL || 'http://localhost:3000';
    const acceptUrl = `${baseUrl}/invitations/${invitation.id}/accept?email=${encodeURIComponent(validatedData.email)}`;

    // Send invitation email
    console.log('📧 Sending invitation email...');
    const emailResult = await sendGroupInvitationEmail({
      recipientEmail: validatedData.email,
      groupName: group.name,
      senderName,
      acceptUrl,
    });

    if (!emailResult.success) {
      console.warn('⚠️  Email send failed:', emailResult.error);
      // Don't fail the request if email fails - invitation still created
    } else {
      console.log('✓ Email sent successfully');
    }

    return new Response(
      JSON.stringify({
        success: true,
        invitation: {
          id: invitation.id,
          email: invitation.email,
          groupId: invitation.groupId,
          expiresAt: invitation.expiresAt,
        },
      }),
      {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error inviting to group:', error);

    if (error instanceof z.ZodError) {
      return new Response(JSON.stringify({ error: error.issues[0]?.message ?? 'Validation error' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: 'Failed to send invitation', details: errorMessage }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
