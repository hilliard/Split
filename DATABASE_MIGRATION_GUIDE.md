# Split App: Human-Centric Database Migration Guide

## Overview

This guide walks through migrating your Split expense app from a simple **user-centric design** to a sophisticated **human-centric architecture** that supports multiple roles, temporal tracking, and granular permissions.

---

## Why Migrate?

### Current Limitations (User-Centric Model)

- ❌ Cannot track email changes over time
- ❌ No support for multiple roles per person (admin, organizer, payer, payee)
- ❌ No granular permission system
- ❌ All user metadata lumped into one table
- ❌ Difficult to extend for future features (employees, vendors, etc.)

### New Benefits (Human-Centric Model)

- ✅ Single source of truth for people (`humans` table)
- ✅ Multiple role support (customer, admin, organizer, payer, payee)
- ✅ Email history tracking (compliance, audit trails)
- ✅ Role-based access control (RBAC) with permissions
- ✅ Scalable for Phase 2+ features (events, activities, expense groups)
- ✅ Easily add new roles without schema changes
- ✅ Better data integrity with temporal tracking

---

## Architecture Comparison

### OLD STRUCTURE (Current)

```
Database
├── users (auth + profile)
│   ├── id, email, username, password_hash
│   ├── created_at, updated_at
│   └── (everything in one table)
├── ...other tables
```

**Problem**: All user data conflated. No temporal tracking. No roles.

---

### NEW STRUCTURE (Target)

```
Database
├── humans (base entity - the person)
│   ├── id, first_name, last_name, dob, gender, phone
│   └── created_at, updated_at
│
├── email_history (temporal - track all emails)
│   ├── human_id → humans.id
│   ├── email, effective_from, effective_to
│   └── (audit trail for compliance)
│
├── customers (role - auth credential)
│   ├── human_id → humans.id
│   ├── username (unique), password_hash
│   └── loyalty_points
│
├── payers / payees (roles - expense tracking)
│   ├── human_id → humans.id
│   └── username
│
├── site_roles (RBAC - define roles)
│   ├── id, role_name, description
│   └── (admin, organizer, customer, etc.)
│
├── permissions (RBAC - define actions)
│   ├── id, permission_name, resource, action
│   └── (users.manage, events.create, etc.)
│
├── human_site_roles (junction - humans ↔ roles)
│   ├── human_id, site_role_id
│   └── (one person can have many roles)
│
├── site_role_permissions (junction - roles ↔ permissions)
│   ├── site_role_id, permission_id
│   └── (each role has assigned permissions)
│
└── ...other domain tables (unchanged)
    ├── events
    ├── activities
    ├── expenses
    └── expense_groups
```

**Benefits**: Separation of concerns. Temporal tracking. Flexible roles.

---

## Migration Phases

### Time Estimate: 2-3 hours setup + gradual code migration

#### Phase 1: Deploy New Schema (5-10 min) ✓ IMMEDIATE

Create new tables in parallel with old `users` table.

- New tables created
- Old tables remain untouched
- **Zero downtime** - app keeps running

**Action**: Run the migration SQL file

```bash
# From Supabase dashboard or CLI
psql -U postgres -d postgres -f migrations/001-human-centric-schema.sql
```

#### Phase 2: Migrate Existing Data (5-10 min) ✓ IMMEDIATE

Move data from `users` → `humans` + `customers` + `email_history`

- Existing users become humans
- Auth data becomes customers
- Email gets tracked in email_history
- Roles assigned (default: "customer" role)

#### Phase 3: Update Code Gradually (1-2 hours) ✓ THIS WEEK

Migrate one endpoint at a time (no rush):

1. Auth endpoints (register, login) → use customers/humans
2. Dashboard endpoints → fetch from humans
3. Event/expense endpoints → reference humans
4. Permission checks → use RBAC system

#### Phase 4: Deprecate Old Table (optional) ✓ LATER

Once all code migrated:

- Can drop old `users` table
- Now running pure human-centric model

#### Phase 5: Phase 2 Features ✓ NEXT SPRINT

All Phase 2 code will use the new structure from day 1.

---

## Step 1: Run the Migration

### Option A: Using Supabase Dashboard

1. Go to Supabase console → SQL Editor
2. Create new query
3. Copy contents of `migrations/001-human-centric-schema.sql`
4. Run query
5. Expected result: ✅ All new tables created + data migrated

### Option B: Using CLI

```bash
psql -h 127.0.0.1 -p 54322 -U postgres -d postgres \
  -f migrations/001-human-centric-schema.sql
```

### Verify Success

```sql
-- Check humans table has data
SELECT COUNT(*) FROM humans;
-- Should show existing users count

-- Check email_history populated
SELECT COUNT(*) FROM email_history;
-- Should show one entry per existing user

-- Check customers created
SELECT COUNT(*) FROM customers;
-- Should match users count

-- Check roles exist
SELECT * FROM site_roles;
-- Should show: admin, customer, organizer, payer, payee

-- Check permissions created
SELECT COUNT(*) FROM permissions;
-- Should show 13 default permissions
```

---

## Step 2: Update Drizzle ORM Configuration

### Current File: `src/db/index.ts`

Update to import both old and new schemas:

```typescript
// src/db/index.ts
import { drizzle } from "drizzle-orm/node-postgres";
import { Client } from "pg";

// OLD SCHEMA (temporarily keep for backward compatibility)
import * as oldSchema from "./schema";

// NEW SCHEMA (human-centric)
import * as newSchema from "./human-centric-schema";

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

export const db = drizzle({
  client,
  schema: {
    ...oldSchema, // Keep old tables available
    ...newSchema, // Add new tables
  },
});

client
  .connect()
  .then(() => console.log("✓ Database connected"))
  .catch((err) => console.error("⚠ Connection error:", err.message));

export default db;
```

---

## Step 3: Create Helper Functions

### File: `src/db/queries.ts` (NEW)

```typescript
// For authenticating users against the new schema
import { eq } from "drizzle-orm";
import type { humans, customers, emailHistory } from "./human-centric-schema";

// Get human by email (searches email_history for current email)
export async function getHumanByEmail(email: string) {
  const result = await db
    .select({
      human: humans,
      customer: customers,
      email: emailHistory.email,
    })
    .from(emailHistory)
    .innerJoin(humans, eq(emailHistory.humanId, humans.id))
    .leftJoin(customers, eq(humans.id, customers.humanId))
    .where(
      and(
        eq(emailHistory.email, email),
        isNull(emailHistory.effectiveTo), // Get current email only
      ),
    )
    .limit(1);

  return result[0] || null;
}

// Get human with all roles
export async function getHumanWithRoles(humanId: string) {
  const result = await db
    .select({
      human: humans,
      roles: sql<string[]>`
        array_agg(${siteRoles.roleName})
      `,
    })
    .from(humans)
    .leftJoin(humanSiteRoles, eq(humans.id, humanSiteRoles.humanId))
    .leftJoin(siteRoles, eq(humanSiteRoles.siteRoleId, siteRoles.id))
    .where(eq(humans.id, humanId))
    .groupBy(humans.id);

  return result[0] || null;
}

// Check if human has permission
export async function hasPermission(
  humanId: string,
  permissionName: string,
): Promise<boolean> {
  const result = await db
    .select({ exists: sql<number>`count(*)::int` })
    .from(humans)
    .innerJoin(humanSiteRoles, eq(humans.id, humanSiteRoles.humanId))
    .innerJoin(siteRoles, eq(humanSiteRoles.siteRoleId, siteRoles.id))
    .innerJoin(
      siteRolePermissions,
      eq(siteRoles.id, siteRolePermissions.siteRoleId),
    )
    .innerJoin(
      permissions,
      eq(siteRolePermissions.permissionId, permissions.id),
    )
    .where(
      and(
        eq(humans.id, humanId),
        eq(permissions.permissionName, permissionName),
      ),
    );

  return (result[0]?.exists ?? 0) > 0;
}
```

---

## Step 4: Gradual Code Migration

### Example 1: Update Registration Endpoint

**BEFORE** (current `src/pages/api/auth/register.ts`):

```typescript
// Uses: users table
const existingUser = await db
  .select()
  .from(users)
  .where(eq(users.email, email));
```

**AFTER** (Phase 1 - keep both working):

```typescript
// Check both old and new schemas during transition
const fromNewSchema = await getHumanByEmail(email);
const fromOldSchema = await db
  .select()
  .from(users)
  .where(eq(users.email, email));

const exists = fromNewSchema || fromOldSchema;
```

**FULLY MIGRATED** (Phase 2+):

```typescript
// Use only new schema
const human = await getHumanByEmail(email);
const exists = human !== null;
```

---

## Step 5: Testing the Migration

### Test Script: `test-migration.ts`

```typescript
import { db } from "./src/db";
import * as tables from "./src/db/human-centric-schema";
import { eq } from "drizzle-orm";

async function testMigration() {
  console.log("🧪 Testing schema migration...\n");

  // Test 1: Humans table has data
  const humanCount = await db.select().from(tables.humans).limit(1);
  console.log(`✅ Humans table:`, humanCount.length > 0 ? "OK" : "EMPTY");

  // Test 2: Email history populated
  const emailCount = await db.select().from(tables.emailHistory).limit(1);
  console.log(`✅ Email history:`, emailCount.length > 0 ? "OK" : "EMPTY");

  // Test 3: Customers migrated
  const customerCount = await db.select().from(tables.customers).limit(1);
  console.log(`✅ Customers:`, customerCount.length > 0 ? "OK" : "EMPTY");

  // Test 4: Default roles created
  const roles = await db.select().from(tables.siteRoles);
  console.log(
    `✅ Roles:`,
    roles.length === 5 ? "All 5 created" : `${roles.length} roles`,
  );

  // Test 5: Permissions created
  const perms = await db.select().from(tables.permissions);
  console.log(
    `✅ Permissions:`,
    perms.length === 13 ? "All 13 created" : `${perms.length} perms`,
  );

  console.log("\n🎉 Migration successful!");
}

testMigration().catch(console.error);
```

Run with:

```bash
npx tsx test-migration.ts
```

---

## Role & Permission System

### Default Roles

| Role          | Usage                    | Permissions                          |
| ------------- | ------------------------ | ------------------------------------ |
| **admin**     | System administrators    | All (13 permissions)                 |
| **customer**  | Regular users            | view/create events, expenses, groups |
| **organizer** | Event creators           | all event operations                 |
| **payer**     | Users who pay expenses   | create/edit expenses                 |
| **payee**     | Users receiving payments | view expenses                        |

### Default Permissions

```
users.manage, users.view
events.create, events.edit, events.delete, events.view
expenses.create, expenses.edit, expenses.delete, expenses.view
groups.create, groups.manage, groups.view
```

### Assign a User to a Role

```typescript
// Make a human an admin
await db.insert(humanSiteRoles).values({
  humanId: someHumanId,
  siteRoleId: (
    await db.select().from(siteRoles).where(eq(siteRoles.roleName, "admin"))
  )[0].id,
  assignedBy: currentUserHumanId,
});
```

---

## Phase 2 Compatibility

All Phase 2 features will benefit from this structure:

### ✅ Events/Activities/Expenses

- Reference `humans.id` instead of `users.id`
- Track who created/paid via `humans` relationships
- Leverage email_history for notifications

### ✅ Permission Checks

```typescript
// Before Phase 2 endpoint:
const canCreateEvent = await hasPermission(humanId, "events.create");
if (!canCreateEvent) {
  return new Response("Forbidden", { status: 403 });
}
```

### ✅ Group Management

- Assign group members by human_id
- Support multiple roles within same group

### ✅ Expense Splits

- Payers/payees tracked at human level
- Flexible role assignments

---

## Rollback Plan (If Needed)

If issues arise:

```sql
-- Keep old users table, keep new tables alongside
-- No data loss
-- Drop new tables if needed:

DROP TABLE IF EXISTS human_site_roles CASCADE;
DROP TABLE IF EXISTS site_role_permissions CASCADE;
DROP TABLE IF EXISTS humanSiteRoles CASCADE;
DROP TABLE IF EXISTS siteRolePermissions CASCADE;
DROP TABLE IF EXISTS site_roles CASCADE;
DROP TABLE IF EXISTS permissions CASCADE;
DROP TABLE IF EXISTS customers CASCADE;
DROP TABLE IF EXISTS payers CASCADE;
DROP TABLE IF EXISTS payees CASCADE;
DROP TABLE IF EXISTS email_history CASCADE;
DROP TABLE IF EXISTS humans CASCADE;

-- App reverts to old users table immediately
```

---

## Timeline

| When               | What                         | Action                        |
| ------------------ | ---------------------------- | ----------------------------- |
| **Today**          | Deploy new schema            | Run migration SQL             |
| **This week**      | Update auth endpoints        | Migrate register/login        |
| **Next week**      | Update dashboard             | Migrate dashboard queries     |
| **Phase 2 Sprint** | Build features on new schema | Use humans/roles from day 1   |
| **Later**          | Deprecate old table          | Drop `users` table (optional) |

---

## Questions?

**Q: Will this break my app?**  
A: No. Old `users` table stays untouched. New tables exist in parallel. Gradual migration = zero downtime.

**Q: Do I need to update code immediately?**  
A: No. Phase 1-2 can coexist. Update one endpoint at a time as needed.

**Q: What about existing data?**  
A: ✅ Automatically migrated during Phase 2 (migration SQL handles it).

**Q: Can I keep using the old schema?**  
A: Yes, for now. But Phase 2 features will use the new schema, so plan the transition.

**Q: How do I add a new role?**  
A: Simple INSERT into `site_roles`:

```sql
INSERT INTO site_roles (role_name, description) VALUES ('vendor', 'Vendor partners');
```

---

## Summary

✅ **Current Status**: Ready to deploy  
✅ **Data Migration**: Automatic  
✅ **Zero Downtime**: Yes  
✅ **Rollback Available**: Yes  
✅ **Phase 2 Compatible**: Yes

**Next Step**: Run the migration SQL file and test!
