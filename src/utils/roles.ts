/**
 * User Role Management Utilities
 * 
 * Functions for managing user privileges and roles across system and group levels
 */

import { db } from '../db/index.ts';
import {
  humans,
  systemRoles,
  humanSystemRoles,
  groupRoles,
  groupMembers,
} from '../db/schema.ts';
import { eq, and } from 'drizzle-orm';

/**
 * System-level role management
 */

export async function assignSystemRole(humanId: string, roleName: 'admin' | 'user') {
  try {
    // Get or create the system role
    let role = await db.query.systemRoles.findFirst({
      where: eq(systemRoles.name, roleName),
    });

    if (!role) {
      const result = await db
        .insert(systemRoles)
        .values({
          name: roleName,
          description: `${roleName} role`,
        })
        .returning();
      role = result[0];
    }

    // Assign role to human
    await db
      .insert(humanSystemRoles)
      .values({
        humanId,
        systemRoleId: role.id,
        assignedAt: new Date(),
      })
      .onConflictDoNothing();

    return {
      success: true,
      humanId,
      role: roleName,
      message: `Assigned ${roleName} role to user`,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function revokeSystemRole(humanId: string, roleName: string) {
  try {
    const role = await db.query.systemRoles.findFirst({
      where: eq(systemRoles.name, roleName),
    });

    if (!role) {
      return {
        success: false,
        error: `Role '${roleName}' not found`,
      };
    }

    await db
      .delete(humanSystemRoles)
      .where(
        and(
          eq(humanSystemRoles.humanId, humanId),
          eq(humanSystemRoles.systemRoleId, role.id)
        )
      );

    return {
      success: true,
      humanId,
      role: roleName,
      message: `Revoked ${roleName} role from user`,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function getUserSystemRoles(humanId: string) {
  try {
    const userRoles = await db.query.humanSystemRoles.findMany({
      where: eq(humanSystemRoles.humanId, humanId),
      with: {
        role: true,
      },
    });

    return {
      success: true,
      humanId,
      roles: userRoles.map((ur) => ur.role.name),
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function isAdmin(humanId: string): Promise<boolean> {
  try {
    const adminRole = await db.query.systemRoles.findFirst({
      where: eq(systemRoles.name, 'admin'),
    });

    if (!adminRole) return false;

    const hasAdminRole = await db.query.humanSystemRoles.findFirst({
      where: and(
        eq(humanSystemRoles.humanId, humanId),
        eq(humanSystemRoles.systemRoleId, adminRole.id)
      ),
    });

    return !!hasAdminRole;
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
}

/**
 * Group-level role management
 */

export async function assignGroupRole(groupId: string, humanId: string, roleName: 'owner' | 'admin' | 'member' | 'viewer') {
  try {
    // Get or create the group role
    let role = await db.query.groupRoles.findFirst({
      where: eq(groupRoles.name, roleName),
    });

    if (!role) {
      const result = await db
        .insert(groupRoles)
        .values({
          name: roleName,
          description: `${roleName} role in group`,
        })
        .returning();
      role = result[0];
    }

    // Update group member with role
    await db
      .update(groupMembers)
      .set({
        groupRoleId: role.id,
      })
      .where(
        and(
          eq(groupMembers.groupId, groupId),
          eq(groupMembers.userId, humanId)
        )
      );

    return {
      success: true,
      groupId,
      humanId,
      role: roleName,
      message: `Assigned ${roleName} role to user in group`,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function getUserGroupRole(groupId: string, humanId: string) {
  try {
    const membership = await db.query.groupMembers.findFirst({
      where: and(
        eq(groupMembers.groupId, groupId),
        eq(groupMembers.userId, humanId)
      ),
      with: {
        role: true,
      },
    });

    return {
      success: true,
      groupId,
      humanId,
      role: membership?.role?.name || 'none',
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function canUserEditGroup(groupId: string, humanId: string): Promise<boolean> {
  try {
    const membership = await db.query.groupMembers.findFirst({
      where: and(
        eq(groupMembers.groupId, groupId),
        eq(groupMembers.userId, humanId)
      ),
      with: {
        role: true,
      },
    });

    // Owner and Admin can edit
    const editableRoles = ['owner', 'admin'];
    return membership?.role ? editableRoles.includes(membership.role.name) : false;
  } catch (error) {
    console.error('Error checking edit permission:', error);
    return false;
  }
}

export async function canUserViewGroup(groupId: string, humanId: string): Promise<boolean> {
  try {
    const membership = await db.query.groupMembers.findFirst({
      where: and(
        eq(groupMembers.groupId, groupId),
        eq(groupMembers.userId, humanId)
      ),
    });

    return !!membership;
  } catch (error) {
    console.error('Error checking view permission:', error);
    return false;
  }
}
