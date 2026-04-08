import type { APIRoute } from 'astro';
import { db } from '@/db';
import { pendingGroupInvitations, expenseGroups, humans, sessions, customers } from '@/db/schema';
import { eq, and, gt } from 'drizzle-orm';

export const GET: APIRoute = async (context) => {
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

    // Query pending invitations for this email, not expired
    const invitations = await db
      .select({
        id: pendingGroupInvitations.id,
        groupId: pendingGroupInvitations.groupId,
        groupName: expenseGroups.name,
        email: pendingGroupInvitations.email,
        invitedByFirstName: humans.firstName,
        invitedByLastName: humans.lastName,
        invitedAt: pendingGroupInvitations.invitedAt,
        expiresAt: pendingGroupInvitations.expiresAt,
        status: pendingGroupInvitations.status,
      })
      .from(pendingGroupInvitations)
      .innerJoin(
        expenseGroups,
        eq(pendingGroupInvitations.groupId, expenseGroups.id)
      )
      .innerJoin(
        humans,
        eq(pendingGroupInvitations.invitedBy, humans.id)
      )
      .where(
        and(
          eq(pendingGroupInvitations.email, customer.username),
          eq(pendingGroupInvitations.status, 'pending'),
          gt(
            pendingGroupInvitations.expiresAt,
            new Date()
          )
        )
      );

    return new Response(JSON.stringify({
      success: true,
      invitations: invitations.map((inv: any) => ({
        id: inv.id,
        groupId: inv.groupId,
        groupName: inv.groupName,
        email: inv.email,
        invitedByName: `${inv.invitedByFirstName} ${inv.invitedByLastName}`,
        invitedAt: inv.invitedAt?.toISOString(),
        expiresAt: inv.expiresAt?.toISOString(),
      })),
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching pending invitations:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch pending invitations' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
