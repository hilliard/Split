/**
 * Example API Route: GET /api/admin/users
 * 
 * Lists all users with their roles
 * Only accessible to admins
 */

import type { APIRoute } from 'astro';
import { db } from '../../../../db/index.ts';
import { humans, humanSystemRoles } from '../../../../db/schema.ts';
import { eq } from 'drizzle-orm';
import { withAdminAuth } from '../../../../utils/auth-middleware.ts';

export const GET: APIRoute = withAdminAuth(async (req, context, auth) => {
  try {
    // Get all users with their system roles
    const allUsers = await db.query.humans.findMany({
      with: {
        sessions: {
          limit: 1,
          orderBy: (sessions, { desc }) => [desc(sessions.expiresAt)],
        },
      },
    });

    // Enrich with role information
    const usersWithRoles = await Promise.all(
      allUsers.map(async (user) => {
        const roles = await db.query.humanSystemRoles.findMany({
          where: (hsr: any) => eq(hsr.humanId, user.id),
          with: {
            role: true,
          },
        });

        return {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          roles: roles.map((r) => r.role.name),
          createdAt: user.createdAt,
        };
      })
    );

    return new Response(JSON.stringify({
      success: true,
      total: usersWithRoles.length,
      users: usersWithRoles,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Internal server error',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
