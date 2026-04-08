# User Roles & Authorization Strategy for Split

## Current (Placeholder) Roles Analysis

❌ The placeholder roles don't map well to Split's domain:
- **admin** - Good, but vague scope (app-level? group-level?)
- **customer** - Too generic for an expense app
- **organizer** - Not specific enough
- **payer** - Expense-level concern, not a user role
- **payee** - Expense-level concern, not a user role

## Proposed Role Hierarchy for Split

### TIER 1: System-Level Roles (App-wide)

These roles determine what a user can do across the entire app.

| Role | Scope | Capabilities | Use Case |
|------|-------|--------------|----------|
| **ADMIN** | System-wide | Manage users, view all groups, system settings, audit logs | You, support team |
| **USER** | Personal | Create groups, manage own data, join groups | Everyone else |

**Structure:**
```
System Admin
└── Can view/manage any user, group, event
└── Can grant/revoke roles
└── Can access admin dashboard

Regular User
└── Can create groups (becomes group owner)
└── Can join groups (invited)
└── Can create events within groups
└── Can view own data
```

---

### TIER 2: Group-Level Roles (Within a specific group)

When a user is part of a group, they have a role within that group.

| Role | Scope | Capabilities | How Assigned |
|------|-------|--------------|--------------|
| **OWNER** | Single group | Full control - manage members, delete group, events | Auto: User who created group |
| **ADMIN** | Single group | Invite members, delete/edit events, manage group | Owner assigns |
| **MEMBER** | Single group | Create/edit own events, view group data | Accept invite, auto-add by admin |
| **VIEWER** | Single group | Read-only access | Owner assigns (for reporting, auditing) |

**Structure:**
```
Group
├── OWNER (creator)
│   └── Can invite/remove members
│   └── Can delete group
│   └── Can create/edit/delete ANY event
│   └── Can promote members to ADMIN
│
├── ADMIN (promoted by owner)
│   └── Can invite members
│   └── Can create/edit/delete ANY event
│   └── Can remove MEMBERS
│   └── Cannot delete group or manage admins
│
├── MEMBER
│   └── Can create own events
│   └── Can edit own events
│   └── Can participate in group expenses
│
└── VIEWER
    └── Read-only access (no create/edit)
```

---

### TIER 3: Event-Level Roles (Within a specific event)

When a user participates in an event, they implicitly have roles based on their actions.

| Role | Scope | Description |
|------|-------|-------------|
| **CREATOR** | Single event | User who created the event |
| **PARTICIPANT** | Single event | Part of this event's expenses |
| **PAYER** | Single expense | User who paid for an expense |
| **PAYEE** | Single expense | User who owes money on an expense |

**Note:** These are **automated** based on actions, not explicitly assigned.

---

## Authorization Decision Tree

### User wants to CREATE a GROUP
```
Q: Is user authenticated?
  NO  → 401 Unauthorized
  YES → User becomes GROUP OWNER
```

### User wants to INVITE someone to a GROUP
```
Q: Is user authenticated?
  NO  → 401 Unauthorized
  YES:
    Q: User's role in group?
      OWNER/ADMIN → Allow ✅
      MEMBER      → Deny 403
      VIEWER      → Deny 403
```

### User wants to DELETE someone from a GROUP
```
Q: Is user authenticated?
  NO  → 401 Unauthorized
  YES:
    Q: User's role in group?
      OWNER       → Allow (delete anyone) ✅
      ADMIN       → Allow (delete MEMBERS only) ✅
      MEMBER      → Deny 403
      VIEWER      → Deny 403
```

### User wants to DELETE the GROUP
```
Q: Is user authenticated?
  NO  → 401 Unauthorized
  YES:
    Q: User's role in group?
      OWNER → Allow ✅
      ANY_OTHER → Deny 403
```

### User wants to CREATE an EVENT
```
Q: Is user authenticated?
  NO  → 401 Unauthorized
  YES:
    Q: What scope?
      GROUP event:
        Q: User's role in group?
          OWNER/ADMIN/MEMBER → Allow ✅
          VIEWER             → Deny 403
      
      PERSONAL event:
        Allow (always) ✅
```

### User wants to EDIT an EVENT
```
Q: Is user authenticated?
  NO  → 401 Unauthorized
  YES:
    Q: User is creator?
      YES → Allow ✅
      NO:
        Q: Event in group?
          YES:
            Q: User's group role?
              OWNER/ADMIN → Allow ✅
              MEMBER      → Deny 403
              VIEWER      → Deny 403
          NO:
            Deny (only creator) 403
```

---

## Implementation in Code

### Database Structure

```sql
-- System Roles (app-level)
CREATE TABLE system_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(50) UNIQUE NOT NULL, -- 'admin', 'user'
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Group Roles
CREATE TABLE group_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(50) UNIQUE NOT NULL, -- 'owner', 'admin', 'member', 'viewer'
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User's system role
CREATE TABLE human_system_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  human_id UUID NOT NULL REFERENCES humans(id) ON DELETE CASCADE,
  system_role_id UUID NOT NULL REFERENCES system_roles(id),
  assigned_by UUID REFERENCES humans(id),
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(human_id, system_role_id) -- One role per user per system
);

-- User's role within a group
CREATE TABLE group_memberships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  human_id UUID NOT NULL REFERENCES humans(id) ON DELETE CASCADE,
  group_id UUID NOT NULL REFERENCES expense_groups(id) ON DELETE CASCADE,
  group_role_id UUID NOT NULL REFERENCES group_roles(id),
  invited_by UUID REFERENCES humans(id),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(human_id, group_id) -- One role per user per group
);

-- Permissions (used to define what each role can do)
CREATE TABLE permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  resource VARCHAR(50) NOT NULL,  -- 'group', 'event', 'expense', 'user'
  action VARCHAR(50) NOT NULL,    -- 'create', 'read', 'update', 'delete'
  description TEXT,
  PRIMARY KEY (resource, action)
);

-- Map roles to permissions
CREATE TABLE group_role_permissions (
  group_role_id UUID NOT NULL REFERENCES group_roles(id),
  permission_id UUID NOT NULL REFERENCES permissions(id),
  PRIMARY KEY (group_role_id, permission_id)
);
```

### TypeScript Authorization Functions

```typescript
// src/db/authorization.ts

export enum SystemRole {
  ADMIN = 'admin',
  USER = 'user',
}

export enum GroupRole {
  OWNER = 'owner',
  ADMIN = 'admin',
  MEMBER = 'member',
  VIEWER = 'viewer',
}

/**
 * Get user's system-level role
 */
export async function getUserSystemRole(userId: string): Promise<SystemRole | null> {
  const [result] = await db
    .select({ roleName: system_roles.name })
    .from(human_system_roles)
    .innerJoin(system_roles, eq(human_system_roles.systemRoleId, system_roles.id))
    .where(eq(human_system_roles.humanId, userId))
    .limit(1);

  return result?.roleName as SystemRole || null;
}

/**
 * Check if user is system admin
 */
export async function isSystemAdmin(userId: string): Promise<boolean> {
  const role = await getUserSystemRole(userId);
  return role === SystemRole.ADMIN;
}

/**
 * Get user's role within a group
 */
export async function getUserGroupRole(
  userId: string,
  groupId: string
): Promise<GroupRole | null> {
  const [result] = await db
    .select({ roleName: group_roles.name })
    .from(group_memberships)
    .innerJoin(group_roles, eq(group_memberships.groupRoleId, group_roles.id))
    .where(
      and(
        eq(group_memberships.humanId, userId),
        eq(group_memberships.groupId, groupId)
      )
    )
    .limit(1);

  return result?.roleName as GroupRole || null;
}

/**
 * Check if user can perform action on group
 */
export async function canUserManageGroupMember(
  userId: string,
  groupId: string,
  targetUserId: string
): Promise<boolean> {
  const role = await getUserGroupRole(userId, groupId);
  
  if (role === GroupRole.OWNER) return true; // Owner can do anything
  
  if (role === GroupRole.ADMIN) {
    // Admin can remove members but not admins
    const targetRole = await getUserGroupRole(targetUserId, groupId);
    return targetRole === GroupRole.MEMBER;
  }

  return false;
}

/**
 * Check if user can delete group
 */
export async function canUserDeleteGroup(
  userId: string,
  groupId: string
): Promise<boolean> {
  const role = await getUserGroupRole(userId, groupId);
  return role === GroupRole.OWNER;
}

/**
 * Check if user can invite to group
 */
export async function canUserInviteToGroup(
  userId: string,
  groupId: string
): Promise<boolean> {
  const role = await getUserGroupRole(userId, groupId);
  return role === GroupRole.OWNER || role === GroupRole.ADMIN;
}
```

---

## Initial Setup

### 1. Create System Roles

```sql
INSERT INTO system_roles (name, description) VALUES
  ('admin', 'System administrator - full access'),
  ('user', 'Regular user - personal and group access');
```

### 2. Create Group Roles

```sql
INSERT INTO group_roles (name, description) VALUES
  ('owner', 'Group creator - full control'),
  ('admin', 'Group admin - invite/manage events'),
  ('member', 'Group member - can participate'),
  ('viewer', 'Read-only access');
```

### 3. Create Permissions

```sql
INSERT INTO permissions (resource, action, description) VALUES
  ('group', 'create', 'Create a new group'),
  ('group', 'read', 'View group details'),
  ('group', 'update', 'Edit group'),
  ('group', 'delete', 'Delete group'),
  ('group.member', 'invite', 'Invite user to group'),
  ('group.member', 'remove', 'Remove user from group'),
  
  ('event', 'create', 'Create event in group'),
  ('event', 'read', 'View event'),
  ('event', 'update', 'Edit event'),
  ('event', 'delete', 'Delete event'),
  
  ('expense', 'create', 'Add expense'),
  ('expense', 'read', 'View expense'),
  ('expense', 'edit', 'Edit expense'),
  
  ('user', 'manage', 'Manage users (admin only)');
```

### 4. Map Permissions to Group Roles

```sql
-- OWNER has all permissions
INSERT INTO group_role_permissions (group_role_id, permission_id)
SELECT (SELECT id FROM group_roles WHERE name = 'owner'), id FROM permissions;

-- ADMIN has most permissions (not member management)
INSERT INTO group_role_permissions (group_role_id, permission_id)
SELECT (SELECT id FROM group_roles WHERE name = 'admin'), id FROM permissions
WHERE resource NOT IN ('group.member');

-- MEMBER can create/read/edit own events and expenses
INSERT INTO group_role_permissions (group_role_id, permission_id)
SELECT (SELECT id FROM group_roles WHERE name = 'member'), id FROM permissions
WHERE resource IN ('event', 'expense');

-- VIEWER can only read
INSERT INTO group_role_permissions (group_role_id, permission_id)
SELECT (SELECT id FROM group_roles WHERE name = 'viewer'), id FROM permissions
WHERE action = 'read';
```

---

## Summary

### System Roles (2)
- ADMIN: App-level admin
- USER: Regular user

### Group Roles (4)
- OWNER: Group creator (full control)
- ADMIN: Promoted by owner (invite, manage events)
- MEMBER: Group participant
- VIEWER: Read-only

### Event/Expense
- Automated based on actions (not explicit roles)
- CREATOR: Made the event
- PAYER: Paid the expense
- PAYEE: Owes money

This gives you:
✅ Clear hierarchy
✅ Scalable permissions
✅ Flexible for future roles
✅ Easy to implement in code
