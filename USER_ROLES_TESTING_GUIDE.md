# User Privileges & Role Testing Guide

## Overview

Your Split application uses a **two-tier role-based authorization system**:

1. **System Roles** (app-level): Determine what users can do across the entire app
   - `admin` - Full system access, can manage users and view all data
   - `user` - Regular user with standard permissions

2. **Group Roles** (group-level): Determine permissions within a specific group
   - `owner` - Full control (creator of group)
   - `admin` - Can manage members and events
   - `member` - Can create and participate in events
   - `viewer` - Read-only access

---

## Quick Start: Create Test Users

### Option 1: Run the Seed Script (Recommended)

```bash
npm install bcryptjs
node seed-test-users-with-roles.mjs
```

This creates 4 test users with different privilege levels:

| Username      | Password             | Role  | Purpose                 |
| ------------- | -------------------- | ----- | ----------------------- |
| `admin_test`  | `admin_password123`  | admin | System administrator    |
| `user_test`   | `user_password123`   | user  | Regular user            |
| `viewer_test` | `viewer_password123` | user  | Test viewer permissions |
| `power_test`  | `power_password123`  | user  | Test group admin/owner  |

### Option 2: Manual SQL

```sql
-- Ensure system roles exist
INSERT INTO system_roles (name, description) VALUES
  ('admin', 'System administrator'),
  ('user', 'Regular user')
ON CONFLICT (name) DO NOTHING;

-- Create test admin user
INSERT INTO humans (id, first_name, last_name)
VALUES ('10000001-0000-0000-0000-000000000001', 'Test', 'Admin');

INSERT INTO customers (id, human_id, username, password_hash)
VALUES (
  '00000001-0000-0000-0000-000000000001',
  '10000001-0000-0000-0000-000000000001',
  'admin_test',
  '$2b$10$...' -- bcrypt hash of password
);

-- Assign admin role
INSERT INTO human_system_roles (human_id, system_role_id)
SELECT
  '10000001-0000-0000-0000-000000000001',
  id
FROM system_roles
WHERE name = 'admin';
```

---

## Testing System Roles (via API)

### Assign Admin Role to User

```curl
curl -X POST http://localhost:3000/api/admin/roles/assign-system-role \
  -H "Content-Type: application/json" \
  -H "Cookie: session_id=YOUR_SESSION_ID" \
  -d '{
    "humanId": "USER_ID_HERE",
    "role": "admin"
  }'
```

**Response:**

```json
{
  "success": true,
  "humanId": "USER_ID_HERE",
  "role": "admin",
  "message": "Assigned admin role to user"
}
```

### Programmatic Usage (in your code)

```typescript
import { assignSystemRole, revokeSystemRole, getUserSystemRoles } from '../../utils/roles.ts';

// Assign admin role
await assignSystemRole(humanId, 'admin');

// Revoke admin role
await revokeSystemRole(humanId, 'admin');

// Get user's roles
const result = await getUserSystemRoles(humanId);
console.log(result.roles); // ['admin', 'user']

// Check if user is admin
import { isAdmin } from '../../utils/roles.ts';
const isUserAdmin = await isAdmin(humanId);
```

---

## Testing Group Roles

### Assign Group Role to User

```curl
curl -X POST http://localhost:3000/api/admin/roles/assign-group-role \
  -H "Content-Type: application/json" \
  -H "Cookie: session_id=YOUR_SESSION_ID" \
  -d '{
    "groupId": "GROUP_ID_HERE",
    "humanId": "USER_ID_HERE",
    "role": "admin"
  }'
```

**Response:**

```json
{
  "success": true,
  "groupId": "GROUP_ID_HERE",
  "humanId": "USER_ID_HERE",
  "role": "admin",
  "message": "Assigned admin role to user in group"
}
```

### Programmatic Usage

```typescript
import {
  assignGroupRole,
  getUserGroupRole,
  canUserEditGroup,
  canUserViewGroup,
} from '../../utils/roles.ts';

// Assign group role
await assignGroupRole(groupId, humanId, 'member');

// Get user's role in group
const result = await getUserGroupRole(groupId, humanId);
console.log(result.role); // 'member'

// Check permissions
const canEdit = await canUserEditGroup(groupId, humanId);
const canView = await canUserViewGroup(groupId, humanId);
```

---

## Testing Scenarios

### Scenario 1: Admin Can View All Groups

**Setup:**

1. Create User A with `admin` system role
2. Create Group 1 (owned by User B)

**Test:**

- Admin sees all groups in dashboard
- Regular user only sees their own groups

**Implementation:**

```typescript
// In your API endpoint to list groups
import { isAdmin } from '../../utils/roles.ts';

const showAllGroups = await isAdmin(currentUserId);
const groups = showAllGroups
  ? await db.select().from(expenseGroups)
  : await db.select().from(expenseGroups).where(eq(expenseGroups.createdBy, currentUserId));
```

### Scenario 2: Group Owner Can Manage Members

**Setup:**

1. Create Group (User A is owner)
2. Add User B as member
3. Try to promote User B to admin

**Test:**

- User A can promote User B (owner permission)
- User B cannot promote other members (not owner/admin)

**Implementation:**

```typescript
import { canUserEditGroup, assignGroupRole } from '../../utils/roles.ts';

const canEdit = await canUserEditGroup(groupId, currentUserId);
if (!canEdit) {
  return new Response(JSON.stringify({ error: 'Permission denied' }), {
    status: 403,
  });
}

await assignGroupRole(groupId, targetUserId, 'admin');
```

### Scenario 3: Viewer Has Read-Only Access

**Setup:**

1. Create Group
2. Add User A as 'viewer' role

**Test:**

- Viewer can see group and events
- Viewer cannot create/edit/delete events
- Viewer cannot add members

**Implementation:**

```typescript
// In event create endpoint
import { getUserGroupRole } from '../../utils/roles.ts';

const userRole = await getUserGroupRole(groupId, currentUserId);
if (userRole.role === 'viewer') {
  return new Response(JSON.stringify({ error: 'Viewers cannot create events' }), { status: 403 });
}
```

---

## Database Schema Reference

### System Roles Table

```sql
CREATE TABLE system_roles (
  id UUID PRIMARY KEY,
  name VARCHAR(50) UNIQUE NOT NULL, -- 'admin', 'user'
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Group Roles Table

```sql
CREATE TABLE group_roles (
  id UUID PRIMARY KEY,
  name VARCHAR(50) UNIQUE NOT NULL, -- 'owner', 'admin', 'member', 'viewer'
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Human System Roles (User → System Role Mapping)

```sql
CREATE TABLE human_system_roles (
  id UUID PRIMARY KEY,
  human_id UUID FOREIGN KEY,
  system_role_id UUID FOREIGN KEY,
  assigned_by UUID FOREIGN KEY,
  assigned_at TIMESTAMP DEFAULT NOW()
);
```

### Group Members (User → Group with Role Assignment)

```sql
CREATE TABLE group_members (
  id UUID PRIMARY KEY,
  group_id UUID FOREIGN KEY,
  user_id UUID FOREIGN KEY,
  group_role_id UUID FOREIGN KEY, -- References group_roles
  invited_at TIMESTAMP DEFAULT NOW(),
  joined_at TIMESTAMP
);
```

---

## Common Testing Patterns

### Pattern 1: Test Permission Denial

```typescript
// 1. Get non-admin user's session
const userSession = await getSessionForUser('regular_user');

// 2. Try to call admin-only endpoint
const response = await fetch('/api/admin/roles/assign-system-role', {
  method: 'POST',
  headers: { Cookie: `session_id=${userSession}` },
  body: JSON.stringify({ humanId: 'X', role: 'admin' }),
});

// 3. Expect 403 Forbidden
expect(response.status).toBe(403);
expect(response.body.error).toContain('Admin access required');
```

### Pattern 2: Test Role Assignment

```typescript
// 1. Assign role
await assignSystemRole(userId, 'admin');

// 2. Verify assignment
const roles = await getUserSystemRoles(userId);
expect(roles.roles).toContain('admin');

// 3. Verify admin can perform admin action
const isAdminNow = await isAdmin(userId);
expect(isAdminNow).toBe(true);
```

### Pattern 3: Test Group Role Cascade

```typescript
// 1. Create group (automatically makes creator = 'owner')
const group = await createGroup(adminUserId);

// 2. Add member as 'viewer'
await assignGroupRole(group.id, memberUserId, 'viewer');

// 3. Test viewer cannot edit
const canEdit = await canUserEditGroup(group.id, memberUserId);
expect(canEdit).toBe(false);

// 4. Promote to 'member'
await assignGroupRole(group.id, memberUserId, 'member');

// 5. Test member can now edit their own events (implementation-specific)
```

---

## Environment Setup

Add to your `.env.local`:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/split
SESSION_SECRET=your_secret_key_here
```

---

## Troubleshooting

### "Admin access required" Error

**Problem:** Regular user can't access admin endpoints

**Solution:** User needs `admin` system role

```bash
node seed-test-users-with-roles.mjs
# Then login as admin_test
```

### Role Not Taking Effect

**Problem:** Assigned role but permission denied persists

**Solution:**

1. Clear browser session/cookies
2. Log out and back in
3. Verify role in database: `SELECT * FROM human_system_roles WHERE human_id = 'USER_ID'`

### Can't Create Group Members

**Problem:** "group_role_id" is null or foreign key error

**Solution:** Ensure group roles exist

```sql
INSERT INTO group_roles (name, description) VALUES
  ('owner', 'Group owner'),
  ('admin', 'Group admin'),
  ('member', 'Group member'),
  ('viewer', 'Group viewer')
ON CONFLICT (name) DO NOTHING;
```

---

## API Endpoint Reference

| HTTP Method | Endpoint                              | Purpose            | Auth Required     |
| ----------- | ------------------------------------- | ------------------ | ----------------- |
| POST        | `/api/admin/roles/assign-system-role` | Assign system role | Admin             |
| POST        | `/api/admin/roles/assign-group-role`  | Assign group role  | Group Owner/Admin |
| GET         | `/api/admin/users/roles`              | List user roles    | Admin             |

---

## Next Steps

1. **Update API endpoints** to check `canUserEditGroup()` before allowing modifications
2. **Update UI** to show/hide actions based on current user's role
3. **Add middleware** to protect all admin endpoints
4. **Create admin dashboard** to manage user roles visually
