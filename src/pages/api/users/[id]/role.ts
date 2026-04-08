import type { APIRoute } from 'astro';
import { db } from '@/db';
import {
  humanSystemRoles,
  systemRoles,
  humans,
} from '@/db/schema';
import { getSession } from '@/utils/session';
import { isSystemAdmin } from '@/db/authorization';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';

const UpdateRoleSchema = z.object({
  systemRole: z.enum(['admin', 'user']),
});

/**
 * PUT /api/users/[id]/role
 * Update a user's system role
 * Admin only
 */
export const PUT: APIRoute = async (context) => {
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

    const targetUserId = context.params.id;
    if (!targetUserId) {
      return new Response(JSON.stringify({ error: 'User ID is required' }), { status: 400 });
    }

    // Parse request body
    const body = await context.request.json();
    const parseResult = UpdateRoleSchema.safeParse(body);

    if (!parseResult.success) {
      return new Response(
        JSON.stringify({ error: 'Invalid request body', details: parseResult.error.issues }),
        { status: 400 }
      );
    }

    const { systemRole } = parseResult.data;

    // Verify target user exists
    const [targetUser] = await db
      .select()
      .from(humans)
      .where(eq(humans.id, targetUserId));

    if (!targetUser) {
      return new Response(JSON.stringify({ error: 'User not found' }), { status: 404 });
    }

    // Get the role ID
    const [role] = await db
      .select({ id: systemRoles.id })
      .from(systemRoles)
      .where(eq(systemRoles.name, systemRole));

    if (!role) {
      return new Response(JSON.stringify({ error: 'Invalid role' }), { status: 400 });
    }

    // Remove old role if exists
    await db
      .delete(humanSystemRoles)
      .where(eq(humanSystemRoles.humanId, targetUserId));

    // Assign new role
    await db.insert(humanSystemRoles).values({
      humanId: targetUserId,
      systemRoleId: role.id,
      assignedBy: session.userId,
    });

    return new Response(
      JSON.stringify({ message: 'Role updated successfully' }),
      { status: 200 }
    );
  } catch (error) {
    console.error('Error updating user role:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to update user role' }),
      { status: 500 }
    );
  }
};

/**
 * DELETE /api/users/[id]
 * Delete a user (cascade delete all related data)
 * Admin only - cannot delete self
 */
export const DELETE: APIRoute = async (context) => {
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

    const targetUserId = context.params.id;
    if (!targetUserId) {
      return new Response(JSON.stringify({ error: 'User ID is required' }), { status: 400 });
    }

    // Cannot delete self
    if (targetUserId === session.userId) {
      return new Response(
        JSON.stringify({ error: 'Cannot delete your own account' }),
        { status: 400 }
      );
    }

    // Verify user exists
    const [targetUser] = await db
      .select()
      .from(humans)
      .where(eq(humans.id, targetUserId));

    if (!targetUser) {
      return new Response(JSON.stringify({ error: 'User not found' }), { status: 404 });
    }

    // Delete user (cascade will handle related data)
    await db
      .delete(humans)
      .where(eq(humans.id, targetUserId));

    return new Response(
      JSON.stringify({ message: 'User deleted successfully' }),
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting user:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to delete user' }),
      { status: 500 }
    );
  }
};
