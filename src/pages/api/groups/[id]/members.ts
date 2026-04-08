import type { APIRoute } from 'astro';
import { db } from '@/db';
import { groupMembers, pendingGroupInvitations, humans, sessions, expenseGroups, users } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

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

    // Get group ID from URL
    const { id: groupId } = context.params;
    if (!groupId) {
      return new Response(JSON.stringify({ error: 'Group ID required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Verify user is in group or is the owner
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

    // session.userId is the human ID
    const isOwner = group.createdBy === session.userId;

    // Check if user is a member
    const [membership] = await db
      .select()
      .from(groupMembers)
      .where(
        and(
          eq(groupMembers.groupId, groupId),
          eq(groupMembers.userId, session.userId)
        )
      )
      .limit(1);

    if (!isOwner && !membership) {
      return new Response(JSON.stringify({ error: 'Not a member of this group' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get members with join dates - email comes from users table
    const members = await db
      .select({
        id: humans.id,
        firstName: humans.firstName,
        lastName: humans.lastName,
        email: users.email,
        joinedAt: groupMembers.joinedAt,
      })
      .from(groupMembers)
      .innerJoin(humans, eq(groupMembers.userId, humans.id))
      .leftJoin(users, eq(humans.id, users.id))
      .where(eq(groupMembers.groupId, groupId))
      .orderBy(groupMembers.joinedAt);

    // Get pending invitations (all users can see, but only relevant for context)
    const pendingInvitations = await db
      .select({
        id: pendingGroupInvitations.id,
        email: pendingGroupInvitations.email,
        invitedAt: pendingGroupInvitations.invitedAt,
        expiresAt: pendingGroupInvitations.expiresAt,
        invitedBy: humans.id,
        invitedByFirstName: humans.firstName,
        invitedByLastName: humans.lastName,
      })
      .from(pendingGroupInvitations)
      .innerJoin(humans, eq(pendingGroupInvitations.invitedBy, humans.id))
      .where(
        and(
          eq(pendingGroupInvitations.groupId, groupId),
          eq(pendingGroupInvitations.status, 'pending')
        )
      )
      .orderBy(pendingGroupInvitations.invitedAt);

    return new Response(
      JSON.stringify({
        success: true,
        group: {
          id: group.id,
          name: group.name,
          isOwner,
        },
        members: members.map((m: any) => ({
          id: m.id,
          firstName: m.firstName,
          lastName: m.lastName,
          email: m.email,
          joinedAt: m.joinedAt?.toISOString(),
        })),
        pendingInvitations: pendingInvitations.map((p: any) => ({
          id: p.id,
          email: p.email,
          invitedByName: `${p.invitedByFirstName} ${p.invitedByLastName}`,
          invitedAt: p.invitedAt?.toISOString(),
          expiresAt: p.expiresAt?.toISOString(),
        })),
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error fetching group members:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch group members' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
