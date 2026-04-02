# Phase 2 Features: Enabled by Human-Centric Schema

## Overview

The human-centric database architecture enables seamless Phase 2 feature development. This document shows how each Phase 2 feature leverages the new schema.

---

## Phase 2 Feature List

1. ✅ **Enhanced Event/Activity Management**
2. ✅ **Expense Tracking & Splitting**
3. ✅ **Group Balances & Settlements**
4. ✅ **Permission-Based UI/API**
5. ✅ **Email Notifications**
6. ✅ **Multi-role Support**
7. ✅ **Admin Dashboard**

---

## Feature 1: Enhanced Event/Activity Management

### Current State (Phase 1)

- Basic event/activity creation
- Single creator

### Phase 2 Enhancement

- Multiple roles: organizer, participant, guest
- Permission-based event access
- Event templates and recurring events

### How New Schema Enables It

```typescript
// Get events created by current user + ones they're invited to
const myEvents = db
  .select()
  .from(events)
  .where(
    or(
      eq(events.creatorId, currentHumanId),
      inArray(events.id, sql`
        SELECT event_id FROM event_members
        WHERE human_id = ${currentHumanId}
      `)
    )
  );

// Check if user can edit event (must be organizer)
const canEdit = await hasPermission(currentHumanId, 'events.edit');

// Get all organizers for an event
const organizers = db
  .select({ human: humans })
  .from(eventMembers)
  .innerJoin(humans, eq(eventMembers.humanId, humans.id))
  .where(and(
    eq(eventMembers.eventId, eventId),
    eq(eventMembers.roleIn Event, 'organizer')
  ));
```

### New Tables Needed

```sql
CREATE TABLE event_members (
  id UUID PRIMARY KEY,
  event_id UUID REFERENCES events(id),
  human_id UUID REFERENCES humans(id),
  role_in_event VARCHAR(50), -- 'organizer', 'participant', 'guest'
  joined_at TIMESTAMP,
  UNIQUE(event_id, human_id)
);
```

---

## Feature 2: Expense Tracking & Splitting

### Current State (Phase 1)

- Expenses assigned to groups
- Basic expense_splits

### Phase 2 Enhancement

- Flexible splitting methods:
  - Equal split (divide by # of people)
  - Percentage-based (80/20)
  - Custom amounts
  - By weight (e.g., meals at different restaurants)
- Tracking who paid and who owes
- Settlement suggestions

### How New Schema Enables It

```typescript
// Get all expenses for a group with payer details
const groupExpenses = db
  .select({
    expense: expenses,
    payer: customers,
    payerHuman: humans,
    splits: sql`array_agg(
      json_build_object(
        'human_id', split_human.id,
        'name', split_human.first_name || ' ' || split_human.last_name,
        'amount', expense_splits.amount
      )
    )`,
  })
  .from(expenses)
  .innerJoin(humans.as("payer_human"), eq(expenses.paidBy, humans.id))
  .leftJoin(customers, eq(humans.id, customers.humanId))
  .leftJoin(expenseSplits, eq(expenses.id, expenseSplits.expenseId))
  .leftJoin(humans.as("split_human"), eq(expenseSplits.userId, humans.id))
  .where(eq(expenses.groupId, groupId))
  .groupBy(expenses.id);

// Calculate debt: Who owes who?
const settlement = db
  .select({
    debtor: sql`split_human.first_name || ' ' || split_human.last_name`,
    creditor: sql`payer_human.first_name || ' ' || payer_human.last_name`,
    amount: sql`SUM(expense_splits.amount)`,
  })
  .from(expenseSplits)
  .innerJoin(expenses, eq(expenseSplits.expenseId, expenses.id))
  .innerJoin(humans.as("payer_human"), eq(expenses.paidBy, humans.id))
  .innerJoin(humans.as("split_human"), eq(expenseSplits.userId, humans.id))
  .where(eq(expenses.groupId, groupId))
  .groupBy(humans.id);
```

### Benefits of New Schema

- ✅ Easy to query "who owes who" across complex relationships
- ✅ Track both payer and payee through human entity
- ✅ Email notifications use email_history (current email only)
- ✅ Permissions control who can add/edit expenses

### New Split Methods

```typescript
// Method 1: Equal split
const numPeople = participants.length;
participants.forEach((p) => {
  const amount = Math.round(totalAmount / numPeople);
  insertSplit(p.humanId, amount);
});

// Method 2: Percentage-based
percentages.forEach(({ humanId, percentage }) => {
  const amount = Math.round(totalAmount * (percentage / 100));
  insertSplit(humanId, amount);
});

// Method 3: By itemized purchases
items.forEach(({ price, persons }) => {
  const pricePerPerson = Math.round(price / persons.length);
  persons.forEach((p) => {
    insertSplit(p.humanId, splitAmount);
  });
});
```

---

## Feature 3: Group Balances & Settlements

### Current State (Phase 1)

- Group members exist
- No balance calculations

### Phase 2 Enhancement

- Automatic balance calculation
- Settlement suggestions ("Alice pay Bob $50")
- Mark payments as complete
- Payment history

### How New Schema Enables It

```typescript
// Calculate total balance for each person in group
const groupBalances = db
  .select({
    human: humans,
    totalPaid: sql`COALESCE(SUM(CASE WHEN expenses.paid_by = humans.id THEN expenses.amount ELSE 0 END), 0)`,
    totalOwes: sql`COALESCE(SUM(expense_splits.amount), 0)`,
    balance: sql`COALESCE(SUM(CASE WHEN expenses.paid_by = humans.id THEN expenses.amount ELSE 0 END), 0) - COALESCE(SUM(expense_splits.amount), 0)`,
  })
  .from(expenses)
  .innerJoin(expenseSplits, eq(expenses.id, expenseSplits.expenseId))
  .innerJoin(humans, eq(expenseSplits.userId, humans.id))
  .where(eq(expenses.groupId, groupId))
  .groupBy(humans.id);

// Settlement algorithm: Who should pay who?
function getSettlements(balances) {
  const creditors = balances.filter((b) => b.balance > 0); // People owed money
  const debtors = balances.filter((b) => b.balance < 0); // People owing money

  const settlements = [];

  for (let i = 0; i < creditors.length; i++) {
    for (let j = 0; j < debtors.length; j++) {
      const credit = creditors[i].balance;
      const debt = Math.abs(debtors[j].balance);
      const amount = Math.min(credit, debt);

      if (amount > 0) {
        settlements.push({
          from: debtors[j].human,
          to: creditors[i].human,
          amount,
        });

        creditors[i].balance -= amount;
        debtors[j].balance += amount;
      }
    }
  }

  return settlements;
}
```

### New Tables Needed

```sql
CREATE TABLE payments (
  id UUID PRIMARY KEY,
  group_id UUID REFERENCES expense_groups(id),
  from_human_id UUID REFERENCES humans(id),
  to_human_id UUID REFERENCES humans(id),
  amount DECIMAL,
  paid_at TIMESTAMP,
  created_at TIMESTAMP
);

-- Track when settlements are marked complete
CREATE TABLE settlements (
  id UUID PRIMARY KEY,
  group_id UUID REFERENCES expense_groups(id),
  debtor_id UUID REFERENCES humans(id),
  creditor_id UUID REFERENCES humans(id),
  amount DECIMAL,
  settled_at TIMESTAMP
);
```

---

## Feature 4: Permission-Based UI/API

### Current State (Phase 1)

- All logged-in users can do everything
- No fine-grained access control

### Phase 2 Enhancement

- Organizers can manage events
- Only group members see group details
- Admins can override anything
- Audit trail of changes

### How New Schema Enables It

```typescript
// Middleware: Check permission before action
async function requirePermission(permissionName: string) {
  return async (context: AstroContext) => {
    const humanId = context.locals.humanId; // From session

    const hasIt = await db.query.humans.findFirst({
      where: (h, { eq }) => eq(h.id, humanId),
      with: {
        rolesAssigned: {
          with: {
            role: {
              with: {
                permissions: {
                  with: { permission: true },
                },
              },
            },
          },
        },
      },
    });

    const allPermissions =
      hasIt?.rolesAssigned.flatMap((r) =>
        r.role.permissions.map((rp) => rp.permission.permissionName),
      ) ?? [];

    if (!allPermissions.includes(permissionName)) {
      throw new Error("Forbidden");
    }
  };
}

// Usage in API:
export const POST: APIRoute = async (context) => {
  // Ensure user is logged in and has permission
  await requirePermission("events.create")(context);

  // Now we know they can create events
  const newEvent = await db.insert(events).values({
    creatorId: context.locals.humanId,
    name: context.request.body.name,
    // ...
  });
};
```

### Audit Trail

```sql
CREATE TABLE audit_log (
  id UUID PRIMARY KEY,
  human_id UUID REFERENCES humans(id),
  action VARCHAR(255),
  entity_type VARCHAR(50),
  entity_id UUID,
  old_values JSONB,
  new_values JSONB,
  created_at TIMESTAMP
);

-- Example entry:
-- human_id: alice's id
-- action: 'expense.created'
-- entity_type: 'expense'
-- entity_id: expense #123
-- old_values: {}
-- new_values: { amount: 50, description: 'Dinner', paid_by: bob_id }
-- created_at: now
```

---

## Feature 5: Email Notifications

### Current State (Phase 1)

- No notifications

### Phase 2 Enhancement

- Notify when invited to group
- Notify when expense added
- Notify when owed money
- Remind to settle

### How New Schema Enables It

```typescript
// Find all group members to notify
const groupMembers = db
  .select({
    human: humans,
    email: emailHistory.email
  })
  .from(groupMembers)
  .innerJoin(humans, eq(groupMembers.userId, humans.id))
  .leftJoin(emailHistory, and(
    eq(humans.id, emailHistory.humanId),
    isNull(emailHistory.effectiveTo)  // ← Gets CURRENT email!
  ))
  .where(eq(groupMembers.groupId, groupId));

// Send notification email
for (const member of groupMembers) {
  await sendEmail({
    to: member.email,
    subject: `New expense added to ${groupName}`,
    template: 'expense-notification',
    data: { humanName: member.human.firstName, expenseAmount: ... }
  });
}

// Reminder email for outstanding balances
const debtorsWithEmail = db
  .select({
    human: humans,
    email: emailHistory.email,
    debtAmount: sql`ABS(balance)`
  })
  .from(groupBalances)
  .innerJoin(emailHistory, and(
    eq(groupBalances.humanId, emailHistory.humanId),
    isNull(emailHistory.effectiveTo)
  ))
  .where(and(
    eq(groupBalances.groupId, groupId),
    sql`balance < 0`  // They owe money
  ));
```

### Benefits of New Schema

- ✅ `email_history` ensures you send to CURRENT email
- ✅ Temporal tracking means old emails never spam users
- ✅ Easy to query group membership across humans
- ✅ Audit trail shows who did what

---

## Feature 6: Multi-Role Support

### Current State (Phase 1)

- All users have "customer" role

### Phase 2 Enhancement

- Users can be admins, organizers, payers, payees
- Different permissions per role
- Role assignment by other admins
- Role expiration (optional)

### How New Schema Enables It

```typescript
// Assign multiple roles to one human
async function assignRoles(humanId: string, roleNames: string[]) {
  for (const roleName of roleNames) {
    const role = await db.query.siteRoles.findFirst({
      where: (r, { eq }) => eq(r.roleName, roleName),
    });

    await db.insert(humanSiteRoles).values({
      humanId,
      siteRoleId: role.id,
      assignedBy: currentAdminId,
    });
  }
}

// Example: Make Alice both organizer and admin
await assignRoles("alice-id", ["organizer", "admin"]);

// Example: Get all admins for notification
const admins = db
  .select({ email: emailHistory.email, humanName: humans.firstName })
  .from(humanSiteRoles)
  .innerJoin(siteRoles, eq(humanSiteRoles.siteRoleId, siteRoles.id))
  .innerJoin(humans, eq(humanSiteRoles.humanId, humans.id))
  .leftJoin(
    emailHistory,
    and(eq(humans.id, emailHistory.humanId), isNull(emailHistory.effectiveTo)),
  )
  .where(eq(siteRoles.roleName, "admin"));
```

### Dynamic Role Adding

```typescript
// Add new role without schema change!
async function addNewRole(roleName: string, permissions: string[]) {
  // 1. Create role
  const newRole = await db.insert(siteRoles).values({
    roleName,
    description: `${roleName} role`,
  });

  // 2. Get all permissions
  const allPerms = await db.query.permissions.findMany({
    where: (p, { inArray }) => inArray(p.permissionName, permissions),
  });

  // 3. Assign permissions to role
  for (const perm of allPerms) {
    await db.insert(siteRolePermissions).values({
      siteRoleId: newRole.id,
      permissionId: perm.id,
    });
  }
}

// Usage: Add "accountant" role
await addNewRole("accountant", [
  "expenses.view",
  "expenses.edit",
  "groups.manage",
]);
```

---

## Feature 7: Admin Dashboard

### Current State (Phase 1)

- None

### Phase 2 Enhancement

- View all users, groups, expenses
- Manage permissions
- View audit logs
- System statistics

### How New Schema Enables It

```typescript
// Dashboard stats
const stats = {
  totalHumans: await db.query.humans.findMany().then((h) => h.length),
  totalGroups: await db.query.expenseGroups.findMany().then((g) => g.length),
  totalExpenses: await db.query.expenses.findMany().then((e) => e.length),
  totalAmount: await db.query.expenses
    .findMany()
    .then((e) => e.reduce((sum, ex) => sum + ex.amount, 0)),
  adminCount: await db
    .select({ count: sql`COUNT(*)` })
    .from(humanSiteRoles)
    .innerJoin(siteRoles, eq(humanSiteRoles.siteRoleId, siteRoles.id))
    .where(eq(siteRoles.roleName, "admin")),
};

// List all users with their current emails and roles
const usersWithDetails = db
  .select({
    human: humans,
    email: emailHistory.email,
    roles: sql`array_agg(${siteRoles.roleName})`,
  })
  .from(humans)
  .leftJoin(
    emailHistory,
    and(eq(humans.id, emailHistory.humanId), isNull(emailHistory.effectiveTo)),
  )
  .leftJoin(humanSiteRoles, eq(humans.id, humanSiteRoles.humanId))
  .leftJoin(siteRoles, eq(humanSiteRoles.siteRoleId, siteRoles.id))
  .groupBy(humans.id, emailHistory.email);

// View recent activity
const recentActivity = db
  .select()
  .from(auditLog)
  .orderBy(desc(auditLog.createdAt))
  .limit(100);
```

---

## Summary: How Human-Centric Schema Powers Phase 2

| Feature             | Benefit of New Schema                                       |
| ------------------- | ----------------------------------------------------------- |
| Event Management    | Organize humans by roles (organizers, participants, guests) |
| Expense Tracking    | Easy queries joining payers/payees through human entity     |
| Settlements         | Calculate balances across complex human relationships       |
| Permissions         | RBAC system already built in                                |
| Email Notifications | email_history ensures current email is always used          |
| Multi-Role Support  | Unlimited roles per human, no schema changes needed         |
| Admin Dashboard     | Audit trails, role assignments, statistics all queryable    |

---

## Implementation Order

**Phase 2 Sprint 1: Weeks 1-2**

1. Event/Activity role management
2. Permission-based API
3. Basic permissions in UI

**Phase 2 Sprint 2: Weeks 3-4**

1. Expense splitting (all methods)
2. Group balances calculation
3. Settlement suggestions

**Phase 2 Sprint 3: Weeks 5-6**

1. Email notifications
2. Payment tracking
3. Audit logs

**Phase 2 Sprint 4: Weeks 7-8**

1. Admin dashboard
2. Role management UI
3. Multi-role assignment

---

## Next Steps

1. ✅ Understand human-centric architecture
2. ✅ Review Phase 2 feature mapping
3. **Next**: Run migration SQL
4. **Then**: Update Phase 1 code
5. **Finally**: Begin Phase 2 sprint

All Phase 2 development will build directly on this foundation!
