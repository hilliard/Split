import type { APIRoute } from 'astro';
import { db } from '../../../db';
import { groupMembers, sessions, expenseGroups, humans } from '../../../db/schema';
import { eq, count } from 'drizzle-orm';

export const GET: APIRoute = async ({ cookies, url }) => {
  try {
    // Get session
    const sessionId = cookies.get('sessionId')?.value;
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

    // Get group ID from query params
    const groupId = url.searchParams.get('id');

    if (groupId) {
      // Get specific group with members
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

      // Get members
      const members = await db
        .select({
          id: groupMembers.id,
          userId: groupMembers.userId,
          firstName: humans.firstName,
          lastName: humans.lastName,
          phone: humans.phone,
          joinedAt: groupMembers.joinedAt,
        })
        .from(groupMembers)
        .innerJoin(humans, eq(groupMembers.userId, humans.id))
        .where(eq(groupMembers.groupId, groupId));

      return new Response(JSON.stringify({
        group,
        members,
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    } else {
      // List all groups user is member of
      const userGroups = await db
        .select({
          id: expenseGroups.id,
          name: expenseGroups.name,
          createdBy: expenseGroups.createdBy,
          createdAt: expenseGroups.createdAt,
        })
        .from(expenseGroups)
        .innerJoin(groupMembers, eq(expenseGroups.id, groupMembers.groupId))
        .where(eq(groupMembers.userId, session.userId));

      // Get member counts for each group
      const groupsWithCounts = await Promise.all(
        userGroups.map(async (group) => {
          const memberCountResult = await db
            .select({ count: count() })
            .from(groupMembers)
            .where(eq(groupMembers.groupId, group.id));

          return {
            ...group,
            memberCount: memberCountResult[0]?.count || 0,
          };
        })
      );

      return new Response(JSON.stringify({ groups: groupsWithCounts }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  } catch (error) {
    console.error('Error fetching groups:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch groups' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
