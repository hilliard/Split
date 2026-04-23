import type { APIRoute } from 'astro';
import { db } from '@/db';
import { sessions, expenseGroups, groupMembers } from '@/db/schema';
import { eq, or } from 'drizzle-orm';

export const GET: APIRoute = async (context) => {
  try {
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

    // Get all groups created by the user
    const createdGroups = await db
      .select()
      .from(expenseGroups)
      .where(eq(expenseGroups.createdBy, session.userId));

    // Get all groups the user is a member of
    const membershipGroups = await db
      .select({
        id: expenseGroups.id,
        name: expenseGroups.name,
        createdBy: expenseGroups.createdBy,
        createdAt: expenseGroups.createdAt,
      })
      .from(expenseGroups)
      .innerJoin(groupMembers, eq(groupMembers.groupId, expenseGroups.id))
      .where(eq(groupMembers.userId, session.userId));

    // Combine and deduplicate
    const allGroups = [
      ...createdGroups,
      ...membershipGroups.filter((mg) => !createdGroups.some((cg) => cg.id === mg.id)),
    ];

    return new Response(JSON.stringify({ groups: allGroups }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching user groups:', error);
    const errorMsg = error instanceof Error ? error.message : 'Internal server error';
    return new Response(JSON.stringify({ error: errorMsg }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
