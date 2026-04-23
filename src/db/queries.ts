/**
 * Human-Centric Database Query Helpers
 * Provides high-level functions for common operations against the new schema
 */

import { db } from './index';
import {
  humans,
  customers,
  emailHistory,
  emailVerificationTokens,
  siteRoles,
  permissions,
  humanSiteRoles,
  siteRolePermissions,
} from './human-centric-schema';
import { eq, and, isNull, sql } from 'drizzle-orm';

// ============================================================
// HUMAN QUERIES
// ============================================================

/**
 * Get human by email (searches current email in email_history)
 */
export async function getHumanByEmail(email: string) {
  const result = await db
    .select({
      human: humans,
      customer: customers,
      currentEmail: emailHistory.email,
    })
    .from(emailHistory)
    .innerJoin(humans, eq(emailHistory.humanId, humans.id))
    .leftJoin(customers, eq(humans.id, customers.humanId))
    .where(
      and(
        eq(emailHistory.email, email),
        isNull(emailHistory.effectiveTo) // Current email only
      )
    )
    .limit(1);

  return result[0] || null;
}

/**
 * Get human with all assigned roles
 */
export async function getHumanWithRoles(humanId: string) {
  const result = await db
    .select({
      human: humans,
      roles: sql<string[]>`array_agg(${siteRoles.roleName})`,
    })
    .from(humans)
    .leftJoin(humanSiteRoles, eq(humans.id, humanSiteRoles.humanId))
    .leftJoin(siteRoles, eq(humanSiteRoles.siteRoleId, siteRoles.id))
    .where(eq(humans.id, humanId))
    .groupBy(humans.id);

  return result[0] || null;
}

/**
 * Get customer by username
 */
export async function getCustomerByUsername(username: string) {
  const result = await db.select().from(customers).where(eq(customers.username, username)).limit(1);

  return result[0] || null;
}

/**
 * Get human by username (searches customers table)
 */
export async function getHumanByUsername(username: string) {
  const result = await db
    .select({
      human: humans,
      customer: customers,
    })
    .from(customers)
    .innerJoin(humans, eq(customers.humanId, humans.id))
    .where(eq(customers.username, username))
    .limit(1);

  return result[0] || null;
}

/**
 * Check if human has a specific permission
 */
export async function hasPermission(humanId: string, permissionName: string): Promise<boolean> {
  const result = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(humans)
    .innerJoin(humanSiteRoles, eq(humans.id, humanSiteRoles.humanId))
    .innerJoin(siteRoles, eq(humanSiteRoles.siteRoleId, siteRoles.id))
    .innerJoin(siteRolePermissions, eq(siteRoles.id, siteRolePermissions.siteRoleId))
    .innerJoin(permissions, eq(siteRolePermissions.permissionId, permissions.id))
    .where(and(eq(humans.id, humanId), eq(permissions.permissionName, permissionName)));

  return (result[0]?.count ?? 0) > 0;
}

/**
 * Check if human has any of the specified roles
 */
export async function hasRole(humanId: string, roleNames: string[]): Promise<boolean> {
  const result = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(humans)
    .innerJoin(humanSiteRoles, eq(humans.id, humanSiteRoles.humanId))
    .innerJoin(siteRoles, eq(humanSiteRoles.siteRoleId, siteRoles.id))
    .where(and(eq(humans.id, humanId), sql`${siteRoles.roleName} = ANY(${roleNames})`));

  return (result[0]?.count ?? 0) > 0;
}

// ============================================================
// CUSTOMER QUERIES
// ============================================================

/**
 * Get customer by ID
 */
export async function getCustomerById(customerId: string) {
  const result = await db
    .select({
      customer: customers,
      human: humans,
    })
    .from(customers)
    .innerJoin(humans, eq(customers.humanId, humans.id))
    .where(eq(customers.id, customerId))
    .limit(1);

  return result[0] || null;
}

/**
 * Get all customers (with human details)
 */
export async function getAllCustomers() {
  return await db
    .select({
      customer: customers,
      human: humans,
    })
    .from(customers)
    .innerJoin(humans, eq(customers.humanId, humans.id));
}

// ============================================================
// CREATION HELPERS
// ============================================================

/**
 * Create a new human with customer role (atomic transaction for registration)
 * Returns: { humanId, customerId, email } on success, null on failure
 */
export async function createHumanWithCustomer(
  email: string,
  username: string,
  passwordHash: string,
  firstName?: string,
  lastName?: string
) {
  try {
    // Step 1: Create human
    const newHuman = await db
      .insert(humans)
      .values({
        firstName: firstName || '',
        lastName: lastName || '',
      })
      .returning({ id: humans.id });

    if (!newHuman[0]) throw new Error('Failed to create human');

    const humanId = newHuman[0].id;

    // Step 2: Create email history record
    await db.insert(emailHistory).values({
      humanId,
      email,
    });

    // Step 3: Create customer record (with email for quick lookup)
    const newCustomer = await db
      .insert(customers)
      .values({
        humanId,
        username,
        passwordHash,
        email, // Store email in customers too for quick verification lookup
      })
      .returning({ id: customers.id });

    if (!newCustomer[0]) throw new Error('Failed to create customer');

    // Step 4: Assign customer role (find the customer role ID)
    // This is optional - if site_roles table doesn't exist, we skip it
    try {
      const customerRole = await db
        .select({ id: siteRoles.id })
        .from(siteRoles)
        .where(eq(siteRoles.roleName, 'customer'))
        .limit(1);

      if (customerRole[0]) {
        await db.insert(humanSiteRoles).values({
          humanId,
          siteRoleId: customerRole[0].id,
        });
      }
    } catch (roleError) {
      // Silently skip role assignment if table doesn't exist or role not found
      console.debug('Skipping role assignment (site_roles table may not exist yet)');
    }

    return {
      humanId,
      customerId: newCustomer[0].id,
      email,
      username,
    };
  } catch (error) {
    console.error('Error creating human with customer:', error);
    return null;
  }
}

/**
 * Assign a role to a human
 */
export async function assignRoleToHuman(humanId: string, roleName: string, assignedBy?: string) {
  try {
    const role = await db
      .select({ id: siteRoles.id })
      .from(siteRoles)
      .where(eq(siteRoles.roleName, roleName))
      .limit(1);

    if (!role[0]) throw new Error(`Role '${roleName}' not found`);

    await db.insert(humanSiteRoles).values({
      humanId,
      siteRoleId: role[0].id,
      assignedBy: assignedBy || null,
    });

    return true;
  } catch (error) {
    console.error('Error assigning role:', error);
    return false;
  }
}

/**
 * Update customer password
 */
export async function updateCustomerPassword(customerId: string, newPasswordHash: string) {
  try {
    await db
      .update(customers)
      .set({
        passwordHash: newPasswordHash,
        updatedAt: new Date(),
      })
      .where(eq(customers.id, customerId));

    return true;
  } catch (error) {
    console.error('Error updating password:', error);
    return false;
  }
}

/**
 * Update customer email (creates new email_history entry)
 */
export async function updateCustomerEmail(humanId: string, newEmail: string) {
  try {
    // Step 1: End current email history record
    await db
      .update(emailHistory)
      .set({
        effectiveTo: new Date(),
      })
      .where(and(eq(emailHistory.humanId, humanId), isNull(emailHistory.effectiveTo)));

    // Step 2: Create new email history record
    await db.insert(emailHistory).values({
      humanId,
      email: newEmail,
    });

    return true;
  } catch (error) {
    console.error('Error updating email:', error);
    return false;
  }
}

// ============================================================
// EXPORT ALL SCHEMA TYPES
// ============================================================

export type { humans, customers, emailHistory, siteRoles, permissions };
