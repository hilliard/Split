import type { APIRoute } from 'astro';
import { db } from '@/db';
import { humans, humanSystemRoles, systemRoles, customers } from '@/db/schema';
import { emailHistory } from '@/db/human-centric-schema';
import { getSession } from '@/utils/session';
import { isSystemAdmin } from '@/db/authorization';
import { eq, isNull, and } from 'drizzle-orm';

/**
 * GET /api/users/list
 * Get list of all users with their system roles
 * Admin only
 */
export const GET: APIRoute = async (context) => {
  try {
    const sessionId = context.cookies.get('sessionId')?.value;
    const session = sessionId ? await getSession(sessionId) : null;

    if (!session || !session.userId) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    // Check if user is admin
    const isAdmin = await isSystemAdmin(session.userId);
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });
    }

    // Get all users with their system roles and current email
    const users = await db
      .select({
        id: humans.id,
        firstName: humans.firstName,
        lastName: humans.lastName,
        email: emailHistory.email,
        username: customers.username,
        systemRole: systemRoles.name,
        createdAt: humans.createdAt,
      })
      .from(humans)
      .leftJoin(customers, eq(humans.id, customers.humanId))
      .leftJoin(
        emailHistory,
        and(
          eq(humans.id, emailHistory.humanId),
          isNull(emailHistory.effectiveTo) // Get current email only
        )
      )
      .leftJoin(humanSystemRoles, eq(humans.id, humanSystemRoles.humanId))
      .leftJoin(systemRoles, eq(humanSystemRoles.systemRoleId, systemRoles.id));

    return new Response(JSON.stringify(users), { status: 200 });
  } catch (error) {
    console.error('Error fetching users:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch users' }), { status: 500 });
  }
};
