import type { APIRoute } from 'astro';
import { db } from '../../../db';
import { pendingGroupInvitations, sessions, customers } from '../../../db/schema';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';

const declineSchema = z.object({
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

    // Get the customer info
    const [customer] = await db
      .select()
      .from(customers)
      .where(eq(customers.id, session.customerId))
      .limit(1);

    if (!customer) {
      return new Response(JSON.stringify({ error: 'Customer not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Parse request body
    let body;
    try {
      body = await context.request.json();
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Validate input
    const validation = declineSchema.safeParse(body);
    if (!validation.success) {
      return new Response(
        JSON.stringify({
          error: 'Invalid input',
          details: validation.error.errors,
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const { invitationId } = validation.data;

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

    // Verify this invitation belongs to the current user
    if (invitation.email !== customer.username) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Update status to rejected
    await db
      .update(pendingGroupInvitations)
      .set({ status: 'rejected' })
      .where(eq(pendingGroupInvitations.id, invitationId));

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Invitation declined',
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error declining invitation:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to decline invitation' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
