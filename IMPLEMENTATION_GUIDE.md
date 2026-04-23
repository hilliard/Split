# Role-Based Authorization System - Implementation Guide

## What Was Implemented

A complete two-tier role-based authorization system that allows:

1. **System-level user management** - Grant/revoke admin privileges
2. **Group-level role management** - Assign roles within specific groups
3. **Event authorization** - Control who can create/edit/delete events
4. **Admin dashboard** - Manage all users and their system roles

## New Files Created

### Database

- `migrations/020-add-role-based-authorization.sql` - Database schema changes

### Drizzle ORM

- New tables in `src/db/schema.ts`:
  - `systemRoles` - System roles (admin, user)
  - `groupRoles` - Group roles (owner, admin, member, viewer)
  - `permissions` - Permission definitions
  - `humanSystemRoles` - User ↔ System role mapping
  - `groupRolePermissions` - Role ↔ Permission mapping

### Authorization Module

- Updated `src/db/authorization.ts` with:
  - `SystemRole` enum
  - `GroupRole` enum
  - `getUserSystemRole()` - Get user's system role
  - `isSystemAdmin()` - Check if user is admin
  - `getUserGroupRole()` - Get user's role in a group
  - `canUserInviteToGroup()` - Check invite permission
  - `canUserRemoveFromGroup()` - Check removal permission
  - Event authorization functions (maintained from before)

### API Endpoints

- `GET /api/users/list` - List all users with roles (admin only)
- `PUT /api/users/[id]/role` - Update user's system role (admin only)
- `DELETE /api/users/[id]` - Delete user (admin only)

### Admin Dashboard

- `src/pages/admin/users.astro` - Admin dashboard for user management

## Database Setup

### Option 1: Using SQL Client

Run the migration file directly:

```bash
# Using psql
psql -h your-host -U postgres -d your-db -f migrations/020-add-role-based-authorization.sql

# Or copy-paste the SQL from the migration file into your database client
```

### Option 2: Manual Setup

The migration automatically:

1. Creates the role and permission tables
2. Inserts default system roles (admin, user)
3. Inserts default group roles (owner, admin, member, viewer)
4. Creates default permissions (group.create, event.edit, etc.)
5. Maps roles to permissions
6. Auto-assigns group creators as OWNER

## Making Your First Admin

After running the migration, you need to assign yourself (or another user) as an admin:

```sql
-- Get the user ID of the person to make admin
SELECT id, first_name, last_name FROM humans WHERE first_name = 'Your Name';

-- Assign as system admin
INSERT INTO human_system_roles (human_id, system_role_id)
SELECT 'YOUR_USER_ID', id FROM system_roles WHERE name = 'admin';
```

## Using the Admin Dashboard

1. Log in as an admin user
2. Navigate to `/admin/users`
3. You'll see a table of all users
4. Click "Change Role" to promote/demote users
5. Click "Delete" to remove users

## Role Hierarchy Reference

### System Roles (App-Wide)

| Role      | Permissions                                                          |
| --------- | -------------------------------------------------------------------- |
| **ADMIN** | Manage all users, view admin dashboard, all group/event capabilities |
| **USER**  | Create groups, create events, participate in shared expenses         |

### Group Roles (Within a Group)

| Role       | Capabilities                                                        |
| ---------- | ------------------------------------------------------------------- |
| **OWNER**  | Full control - invite/remove members, manage events, delete group   |
| **ADMIN**  | Manage events created by others, invite members (not remove admins) |
| **MEMBER** | Create own events, participate in group                             |
| **VIEWER** | Read-only access to group and events                                |

## API Usage Examples

### List All Users (Admin Only)

```typescript
const response = await fetch('/api/users/list');
const users = await response.json();
// [
//   { id: '...', firstName: 'John', email: 'john@example.com', systemRole: 'admin' },
//   { id: '...', firstName: 'Jane', email: 'jane@example.com', systemRole: 'user' },
// ]
```

### Change User's Role (Admin Only)

```typescript
const response = await fetch('/api/users/USER_ID/role', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ systemRole: 'admin' }),
});
```

### Delete User (Admin Only)

```typescript
const response = await fetch('/api/users/USER_ID/role', {
  method: 'DELETE',
});
```

## Code Usage Examples

### Check if User is Admin

```typescript
import { isSystemAdmin } from '@/db/authorization';

const isAdmin = await isSystemAdmin(userId);
if (!isAdmin) {
  return new Response('Forbidden', { status: 403 });
}
```

### Get User's Role in Group

```typescript
import { getUserGroupRole, GroupRole } from '@/db/authorization';

const role = await getUserGroupRole(userId, groupId);

if (role === GroupRole.OWNER) {
  // User owns the group
}
```

### Check Permission for Action

```typescript
import { canUserEditEvent } from '@/db/authorization';

const canEdit = await canUserEditEvent(userId, eventId);
if (!canEdit) {
  return new Response('Cannot edit this event', { status: 403 });
}
```

## Migration from Old System

If you had the previous authorization system with just `isGroupOwner()` and `isGroupMember()`:

**Old Code:**

```typescript
const isOwner = await isGroupOwner(userId, groupId);
if (!isOwner) {
  return new Response('Unauthorized', { status: 403 });
}
```

**New Code (Fully Compatible):**

```typescript
const canManage = await canUserManageGroup(userId, groupId);
if (!canManage) {
  return new Response('Unauthorized', { status: 403 });
}
```

All old functions are still available and work as before. New code should use the new role-based functions.

## Next Steps

1. **Run the migration** on your database
2. **Make yourself an admin** using the SQL command above
3. **Visit `/admin/users`** to test the admin dashboard
4. **Invite other users** to the app and manage their roles
5. **(Optional) Create group admin role assignments** - Promote group members to admin

## Testing

### Test Admin Access

```bash
# After making yourself admin
curl http://localhost:3000/api/users/list \
  -H "Cookie: session=YOUR_SESSION_ID"
```

### Test Authorization Enforcement

```bash
# Try to access admin dashboard as non-admin
# Should redirect to /dashboard
```

## Troubleshooting

### "User not found" when setting role

- Make sure the user ID is correct
- Verify user exists in the humans table

### Admin dashboard shows "No users found"

- Check that you're running the migration
- Verify you have admin role assigned

### Cannot delete user

- Cannot delete your own admin account
- Make sure you have admin privileges

## Security Considerations

1. **Always check authorization** before modifying data
2. **Use specific permission functions** - Don't just check role names as strings
3. **Log admin actions** for audit trails (future enhancement)
4. **Rate limit** user management endpoints (future enhancement)
5. **Require confirmation** for destructive actions (already implemented)

## Future Enhancements

- [ ] Audit logging for admin actions
- [ ] Rate limiting on API endpoints
- [ ] User invitation system
- [ ] Two-factor authentication
- [ ] Permission override system
- [ ] Role templates
- [ ] Time-based role assignments
