/**
 * API Route: POST /api/admin/roles/assign-system-role
 * 
 * Assign a system-level role to a user
 * Only accessible to admin users
 * 
 * Query params:
 * - humanId: User ID to assign role to
 * - role: Role name ('admin' or 'user')
 */

import type { APIRoute } from 'astro';
import { db } from '../../../../db/index.ts';
import { humans, sessions } from '../../../../db/schema.ts';
import { eq } from 'drizzle-orm';
import { assignSystemRole, isAdmin } from '../../../../utils/roles.ts';

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    // Check authentication
    const sessionId = cookies.get('session_id')?.value;
    if (!sessionId) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get current user
    const session = await db.query.sessions.findFirst({
      where: eq(sessions.id, sessionId),
    });

    if (!session) {
      return new Response(
        JSON.stringify({ error: 'Invalid session' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Check if user is admin
    const admin = await isAdmin(session.userId);
    if (!admin) {
      return new Response(
        JSON.stringify({ error: 'Forbidden: Admin access required' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const body = await request.json();
    const { humanId, role } = body;

    if (!humanId || !role) {
      return new Response(
        JSON.stringify({ error: 'Missing humanId or role' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!['admin', 'user'].includes(role)) {
      return new Response(
        JSON.stringify({ error: 'Invalid role. Must be "admin" or "user"' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Assign role
    const result = await assignSystemRole(humanId, role);

    return new Response(JSON.stringify(result), {
      status: result.success ? 200 : 400,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Error assigning system role:', err);
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
