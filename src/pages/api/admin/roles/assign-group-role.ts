/**
 * API Route: POST /api/admin/roles/assign-group-role
 *
 * Assign a group-level role to a user
 * Only accessible to group owner or admin
 *
 * Query params:
 * - groupId: Group ID
 * - humanId: User ID to assign role to
 * - role: Role name ('owner', 'admin', 'member', or 'viewer')
 */

import type { APIRoute } from 'astro';
import { db } from '../../../../db/index.ts';
import { sessions } from '../../../../db/schema.ts';
import { eq } from 'drizzle-orm';
import { assignGroupRole, canUserEditGroup } from '../../../../utils/roles.ts';

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    // Check authentication
    const sessionId = cookies.get('session_id')?.value;
    if (!sessionId) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get current user
    const session = await db.query.sessions.findFirst({
      where: eq(sessions.id, sessionId),
    });

    if (!session) {
      return new Response(JSON.stringify({ error: 'Invalid session' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Parse request body
    const body = await request.json();
    const { groupId, humanId, role } = body;

    if (!groupId || !humanId || !role) {
      return new Response(JSON.stringify({ error: 'Missing groupId, humanId, or role' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!['owner', 'admin', 'member', 'viewer'].includes(role)) {
      return new Response(
        JSON.stringify({
          error: 'Invalid role. Must be "owner", "admin", "member", or "viewer"',
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Check if current user can edit this group
    const canEdit = await canUserEditGroup(groupId, session.userId);
    if (!canEdit) {
      return new Response(
        JSON.stringify({
          error: 'Forbidden: You do not have permission to manage roles in this group',
        }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Assign group role
    const result = await assignGroupRole(groupId, humanId, role);

    return new Response(JSON.stringify(result), {
      status: result.success ? 200 : 400,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Error assigning group role:', err);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
