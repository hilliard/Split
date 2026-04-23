import type { APIRoute } from 'astro';
import { getSession } from '../../../utils/session';
import { db } from '../../../db';
import { pendingGroupInvitations, expenseGroups } from '../../../db/schema';
import { customers, humans } from '../../../db/human-centric-schema';
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

    const session = await getSession(sessionId);
    if (!session) {
      return new Response(JSON.stringify({ error: 'Session expired' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get the user's email from customers table
    const [customer] = await db
      .select({ email: customers.email })
      .from(customers)
      .innerJoin(humans, eq(customers.humanId, humans.id))
      .where(eq(humans.id, session.userId))
      .limit(1);

    if (!customer?.email) {
      return new Response(JSON.stringify({ error: 'User email not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    console.log('📧 Fetching pending invitations for:', customer.email);

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
      .innerJoin(expenseGroups, eq(pendingGroupInvitations.groupId, expenseGroups.id))
      .innerJoin(humans, eq(pendingGroupInvitations.invitedBy, humans.id))
      .where(
        and(
          eq(pendingGroupInvitations.email, customer.email),
          eq(pendingGroupInvitations.status, 'pending'),
          gt(pendingGroupInvitations.expiresAt, new Date())
        )
      );

    console.log(`✓ Found ${invitations.length} pending invitation(s)`);

    return new Response(
      JSON.stringify({
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
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error(
      '❌ Error fetching pending invitations:',
      error instanceof Error ? error.message : String(error)
    );
    return new Response(JSON.stringify({ error: 'Failed to fetch pending invitations' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
