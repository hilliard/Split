import type { APIRoute } from 'astro';
import { db } from '@/db';
import { sessions, expenseGroups, groupMembers } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { calculateGroupBalances, getUserGroupBalance } from '@/utils/balance-calculator';

export const GET: APIRoute = async (context) => {
  try {
    console.log('📊 Balances API called');

    // Get session
    const sessionId = context.cookies.get('sessionId')?.value;
    if (!sessionId) {
      console.warn('❌ No session ID found');
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const [session] = await db.select().from(sessions).where(eq(sessions.id, sessionId)).limit(1);

    if (!session || new Date(session.expiresAt) < new Date()) {
      console.warn('❌ Session expired or not found');
      return new Response(JSON.stringify({ error: 'Session expired' }), { status: 401 });
    }

    console.log('✓ Session valid for user:', session.userId);

    const { id } = context.params;
    console.log('📍 Group ID from params:', id);

    if (!id) {
      console.warn('❌ No group ID provided');
      return new Response(JSON.stringify({ error: 'Group ID required' }), { status: 400 });
    }

    // Verify user is member of group
    const isMember = await db
      .select()
      .from(groupMembers)
      .where(and(eq(groupMembers.groupId, id as string), eq(groupMembers.userId, session.userId)))
      .limit(1);

    if (!isMember.length) {
      console.warn('❌ User is not a member of this group');
      return new Response(JSON.stringify({ error: 'Forbidden - not a group member' }), {
        status: 403,
      });
    }

    console.log('✓ User is group member');

    // Calculate group balances
    console.log('🔄 Calculating balances for group:', id);
    const balances = await calculateGroupBalances(id as string);
    console.log('✓ Balances calculated:', balances.length, 'settlements');

    // Get current user's balance
    const userBalance = await getUserGroupBalance(id as string, session.userId);
    console.log('✓ User balance calculated:', userBalance);

    return new Response(
      JSON.stringify({
        success: true,
        groupId: id,
        balances, // All settlements needed in the group
        userBalance, // Current user's summary
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('❌ Error fetching group balances:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
};
