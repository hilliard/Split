import { db } from '@/db';
import {
  groupMembers,
  groupRoles,
  systemRoles,
  humanSystemRoles,
  expenseGroups,
  events,
} from '@/db/schema';
import { eq, and } from 'drizzle-orm';

/**
 * System-level roles (app-wide)
 */
export enum SystemRole {
  ADMIN = 'admin', // System administrator
  USER = 'user', // Regular user
}

/**
 * Group-level roles (within a specific group)
 */
export enum GroupRole {
  OWNER = 'owner', // Group creator - full control
  ADMIN = 'admin', // Group admin - manage events and members
  MEMBER = 'member', // Group member - participate
  VIEWER = 'viewer', // Read-only access
  NONE = 'none', // No access
}

/**
 * Get user's system-level role
 */
export async function getUserSystemRole(userId: string): Promise<SystemRole | null> {
  try {
    const [result] = await db
      .select({ roleName: systemRoles.name })
      .from(humanSystemRoles)
      .innerJoin(systemRoles, eq(humanSystemRoles.systemRoleId, systemRoles.id))
      .where(eq(humanSystemRoles.humanId, userId))
      .limit(1);

    return result?.roleName as SystemRole | null;
  } catch {
    return null;
  }
}

/**
 * Check if user is a system admin
 */
export async function isSystemAdmin(userId: string): Promise<boolean> {
  const role = await getUserSystemRole(userId);
  return role === SystemRole.ADMIN;
}

/**
 * Get user's role within a specific group
 *
 * Returns the group role from the groupMembers table,
 * or OWNER if user created the group, or NONE if not a member
 */
export async function getUserGroupRole(userId: string, groupId: string): Promise<GroupRole> {
  // Check if user is the group creator (they're automatically an owner)
  const [group] = await db.select().from(expenseGroups).where(eq(expenseGroups.id, groupId));

  if (group && group.createdBy === userId) {
    return GroupRole.OWNER;
  }

  // Check group membership
  const [membership] = await db
    .select({
      roleName: groupRoles.name,
    })
    .from(groupMembers)
    .innerJoin(groupRoles, eq(groupMembers.groupRoleId, groupRoles.id))
    .where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, userId)));

  if (membership) {
    return membership.roleName as GroupRole;
  }

  return GroupRole.NONE;
}

/**
 * Check if user can invite members to a group
 */
export async function canUserInviteToGroup(userId: string, groupId: string): Promise<boolean> {
  const role = await getUserGroupRole(userId, groupId);
  return role === GroupRole.OWNER || role === GroupRole.ADMIN;
}

/**
 * Check if user can remove members from a group
 */
export async function canUserRemoveFromGroup(
  userId: string,
  groupId: string,
  targetUserId: string
): Promise<boolean> {
  const role = await getUserGroupRole(userId, groupId);

  if (role === GroupRole.OWNER) {
    return true; // Owner can remove anyone
  }

  if (role === GroupRole.ADMIN) {
    // Admin can remove members but not admins or owners
    const targetRole = await getUserGroupRole(targetUserId, groupId);
    return targetRole === GroupRole.MEMBER || targetRole === GroupRole.VIEWER;
  }

  return false;
}

/**
 * Check if user can manage a group (edit, delete, invite)
 */
export async function canUserManageGroup(userId: string, groupId: string): Promise<boolean> {
  const role = await getUserGroupRole(userId, groupId);
  return role === GroupRole.OWNER;
}

/**
 * Check if user can view a group
 */
export async function canUserViewGroup(userId: string, groupId: string): Promise<boolean> {
  const role = await getUserGroupRole(userId, groupId);
  return role !== GroupRole.NONE;
}

/**
 * Get user's role for an event
 *
 * Rules:
 * - OWNER: User created the event
 * - ADMIN: User has OWNER or ADMIN role in the event's group
 * - MEMBER: User has MEMBER role in the event's group
 * - VIEWER: Event is public and user has VIEWER role in group (or is not in group but event is public)
 * - NONE: No access
 */
export async function getEventRole(userId: string, eventId: string): Promise<GroupRole> {
  const [event] = await db.select().from(events).where(eq(events.id, eventId));

  if (!event) {
    return GroupRole.NONE;
  }

  // User who created the event is always an owner
  if (event.creatorId === userId) {
    return GroupRole.OWNER;
  }

  // If event belongs to a group, check user's group role
  if (event.groupId) {
    const groupRole = await getUserGroupRole(userId, event.groupId);
    if (groupRole !== GroupRole.NONE) {
      return groupRole;
    }
  }

  // Public events can be viewed by anyone not in the group
  if (event.isPublic) {
    return GroupRole.VIEWER;
  }

  return GroupRole.NONE;
}

/**
 * Check if user can read an event
 */
export async function canUserReadEvent(userId: string, eventId: string): Promise<boolean> {
  const role = await getEventRole(userId, eventId);
  return role !== GroupRole.NONE;
}

/**
 * Check if user can edit an event
 * Allowed for: OWNER, ADMIN
 */
export async function canUserEditEvent(userId: string, eventId: string): Promise<boolean> {
  const role = await getEventRole(userId, eventId);
  return role === GroupRole.OWNER || role === GroupRole.ADMIN;
}

/**
 * Check if user can delete an event
 * Allowed for: OWNER, ADMIN
 */
export async function canUserDeleteEvent(userId: string, eventId: string): Promise<boolean> {
  const role = await getEventRole(userId, eventId);
  return role === GroupRole.OWNER || role === GroupRole.ADMIN;
}

/**
 * Check if user can manage users (system admin only)
 */
export async function canUserManageUsers(userId: string): Promise<boolean> {
  return isSystemAdmin(userId);
}

/**
 * Get all users (admin only)
 */
export async function getAllUsers() {
  const users = await db.select().from(humanSystemRoles);
  return users;
}
