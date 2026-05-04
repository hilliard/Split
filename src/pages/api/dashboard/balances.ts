import type { APIRoute } from 'astro';
import { db } from '../../../db';
import { sessions, groupMembers, expenseGroups } from '../../../db/schema';
import { eq } from 'drizzle-orm';
import { calculateGroupBalances } from '../../../utils/balance-calculator';

export const GET: APIRoute = async (context) => {
  try {
    // Get session
    const sessionId = context.cookies.get('sessionId')?.value;
    if (!sessionId) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const [session] = await db.select().from(sessions).where(eq(sessions.id, sessionId)).limit(1);

    if (!session || new Date(session.expiresAt) < new Date()) {
      return new Response(JSON.stringify({ error: 'Session expired' }), { status: 401 });
    }

    // Get all groups the user is a member of
    const userGroups = await db
      .select({
        groupId: groupMembers.groupId,
        groupName: expenseGroups.name,
      })
      .from(groupMembers)
      .innerJoin(expenseGroups, eq(groupMembers.groupId, expenseGroups.id))
      .where(eq(groupMembers.userId, session.userId));

    let allBalances = [];

    // Calculate balances for each group
    for (const group of userGroups) {
      const groupBalances = await calculateGroupBalances(group.groupId);
      
      // Filter for balances involving the current user and attach group info
      const userRelevantBalances = groupBalances
        .filter(b => b.fromUserId === session.userId || b.toUserId === session.userId)
        .map(b => ({
          ...b,
          groupId: group.groupId,
          groupName: group.groupName
        }));

      allBalances = allBalances.concat(userRelevantBalances);
    }

    return new Response(
      JSON.stringify({
        success: true,
        balances: allBalances,
      }),
      { 
        status: 200, 
        headers: { 
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        } 
      }
    );
  } catch (error) {
    console.error('Error fetching user balances:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
};
