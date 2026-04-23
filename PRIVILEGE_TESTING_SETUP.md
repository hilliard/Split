# User Privilege & Role Testing Implementation Summary

## What Was Added

This implementation provides a complete system for managing user privileges and roles for testing purposes (and production use).

### New Files Created

#### 1. **Seed Script** - `seed-test-users-with-roles.mjs`

Creates 4 test users with different privilege levels:

- `admin_test` (System Admin)
- `user_test` (Regular User)
- `viewer_test` (Viewer/Limited User)
- `power_test` (Power User - for group admin testing)

**Run:** `node seed-test-users-with-roles.mjs`

---

#### 2. **Role Management Utilities** - `src/utils/roles.ts`

TypeScript utilities for managing user roles:

- `assignSystemRole(humanId, role)` - Assign app-level role
- `revokeSystemRole(humanId, role)` - Remove app-level role
- `getUserSystemRoles(humanId)` - Get user's system roles
- `isAdmin(humanId)` - Check if user is admin
- `assignGroupRole(groupId, humanId, role)` - Assign group-level role
- `getUserGroupRole(groupId, humanId)` - Get user's role in group
- `canUserEditGroup(groupId, humanId)` - Check edit permission
- `canUserViewGroup(groupId, humanId)` - Check view permission

**Usage:**

```typescript
import { assignSystemRole, isAdmin } from '../utils/roles.ts';

// Assign admin role
await assignSystemRole(userId, 'admin');

// Check if admin
const isUserAdmin = await isAdmin(userId);
```

---

#### 3. **Auth Middleware** - `src/utils/auth-middleware.ts`

Authentication middleware for protecting API endpoints:

- `getAuthContext(cookies)` - Extract user from session
- `requireAuth(cookies)` - Require authenticated user
- `requireAdmin(cookies)` - Require admin role
- `requireGroupEdit(cookies, groupId)` - Require group edit permission
- `requireGroupView(cookies, groupId)` - Require group view permission
- `withAuth(handler)` - Wrapper for authenticated endpoints
- `withAdminAuth(handler)` - Wrapper for admin-only endpoints
- Response helpers: `unauthorizedResponse()`, `forbiddenResponse()`, `successResponse()`

**Usage:**

```typescript
import { withAdminAuth } from '../../utils/auth-middleware.ts';

export const GET: APIRoute = withAdminAuth(async (req, context, auth) => {
  // Your admin-only code here
  // auth.userId contains current user ID
  // auth.isAdmin is always true (middleware verified)
});
```

---

#### 4. **System Role Assignment API** - `src/pages/api/admin/roles/assign-system-role.ts`

HTTP POST endpoint to assign system roles to users.

**Endpoint:** `POST /api/admin/roles/assign-system-role`

**Authentication:** Admin-only

**Request Body:**

```json
{
  "humanId": "USER_ID",
  "role": "admin" // or "user"
}
```

**Example:**

```bash
curl -X POST http://localhost:3000/api/admin/roles/assign-system-role \
  -H "Content-Type: application/json" \
  -H "Cookie: session_id=YOUR_SESSION" \
  -d '{"humanId": "10000001-0000-0000-0000-000000000001", "role": "admin"}'
```

---

#### 5. **Group Role Assignment API** - `src/pages/api/admin/roles/assign-group-role.ts`

HTTP POST endpoint to assign roles within specific groups.

**Endpoint:** `POST /api/admin/roles/assign-group-role`

**Authentication:** Group owner/admin only

**Request Body:**

```json
{
  "groupId": "GROUP_ID",
  "humanId": "USER_ID",
  "role": "member" // or "owner", "admin", "viewer"
}
```

**Example:**

```bash
curl -X POST http://localhost:3000/api/admin/roles/assign-group-role \
  -H "Content-Type: application/json" \
  -H "Cookie: session_id=YOUR_SESSION" \
  -d '{
    "groupId": "GROUP_ID",
    "humanId": "USER_ID",
    "role": "admin"
  }'
```

---

#### 6. **List Users API** - `src/pages/api/admin/users/index.ts`

HTTP GET endpoint listing all users with their roles.

**Endpoint:** `GET /api/admin/users`

**Authentication:** Admin-only

**Response:**

```json
{
  "success": true,
  "total": 4,
  "users": [
    {
      "id": "10000001-0000-0000-0000-000000000001",
      "firstName": "Admin",
      "lastName": "User",
      "roles": ["admin"],
      "createdAt": "2026-04-08T12:00:00Z"
    },
    {
      "id": "10000002-0000-0000-0000-000000000002",
      "firstName": "Regular",
      "lastName": "User",
      "roles": ["user"],
      "createdAt": "2026-04-08T12:00:00Z"
    }
  ]
}
```

---

#### 7. **Testing Guide & Documentation** - `USER_ROLES_TESTING_GUIDE.md`

Comprehensive guide covering:

- Overview of the 2-tier role system
- How to create test users
- API examples for all role operations
- Testing scenarios and patterns
- Troubleshooting common issues
- Database schema reference

---

## Quick Start

### 1. Create Test Users

```bash
node seed-test-users-with-roles.mjs
```

### 2. Login with Different Users

Use these credentials to test different privilege levels:

| Username      | Password             | Role           |
| ------------- | -------------------- | -------------- |
| `admin_test`  | `admin_password123`  | Admin          |
| `user_test`   | `user_password123`   | Regular User   |
| `viewer_test` | `viewer_password123` | Limited Access |
| `power_test`  | `power_password123`  | Power User     |

### 3. Test Permission Restrictions

**Test Admin-Only Action:**

```bash
# Login as admin_test
# Try to access: GET /api/admin/users
# Result: Success (200)

# Logout, login as user_test
# Try to access: GET /api/admin/users
# Result: Forbidden (403)
```

**Test Group Role Restrictions:**

```bash
# Owner of group: Can edit, add members, change roles
# Admin in group: Can edit events, add members
# Member: Can create/edit own events
# Viewer: Can only view (read-only)
```

---

## Integration Into Your Codebase

### Protect Admin Endpoints

```typescript
import { withAdminAuth } from '../../utils/auth-middleware.ts';

export const POST: APIRoute = withAdminAuth(async (req, context, auth) => {
  // Your code here - only runs if user is admin
  // Use auth.userId for current user
});
```

### Protect Group Endpoints

```typescript
import { requireGroupEdit } from '../../utils/auth-middleware.ts';

try {
  const auth = await requireGroupEdit(cookies, groupId);
  // User has edit permission in this group
} catch (error) {
  return forbiddenResponse('Cannot edit this group');
}
```

### Check Permissions in Code

```typescript
import { isAdmin, canUserEditGroup } from '../utils/roles.ts';

// Check system admin
if (await isAdmin(userId)) {
  // Show admin dashboard
}

// Check group permission
if (await canUserEditGroup(groupId, userId)) {
  // Show edit button
}
```

---

## Testing Use Cases

### Use Case 1: Test Admin Dashboard Access

1. Create test admin user via seed script
2. Login as admin
3. Access `/api/admin/users` endpoint
4. Verify admin can see all users
5. Login as regular user
6. Try to access same endpoint
7. Verify 403 Forbidden response

### Use Case 2: Test Group Role Restrictions

1. Create 3 test users (owner, member, viewer)
2. Owner creates a group
3. Owner adds member and viewer to group
4. Test member can create events
5. Test viewer cannot create events (403)
6. Owner promotes viewer to admin
7. Test viewer can now create events

### Use Case 3: Test Multi-Role User

1. Create test user with both system roles
2. Verify `getUserSystemRoles()` returns both
3. Test `isAdmin()` returns true
4. Test user can access both admin and regular features
5. Revoke one role
6. Verify user can only access remaining features

---

## Database Changes (Auto-Handled)

The seed script automatically:

1. Creates `system_roles` entries (admin, user)
2. Creates test `humans` records
3. Creates test `customers` (auth) records
4. Assigns system roles via `human_system_roles`
5. Ensures `group_roles` exist (owner, admin, member, viewer)

No manual database migration needed!

---

## Next Steps

1. **Update UI** - Add role indicators to user list
2. **Add role management UI** - Create pages to manage roles
3. **Add permission checks** - Use `canUserEditGroup()` etc. in UI
4. **Create audit log** - Track who changed what role when
5. **Add role templates** - Pre-configured role sets for different scenarios

---

## Troubleshooting

### Issue: "Admin access required" for admin user

- Clear cookies and logout/login again
- Verify `human_system_roles` has admin role assigned in database

### Issue: Test users don't exist

- Run: `node seed-test-users-with-roles.mjs`
- Check DATABASE_URL environment variable is set

### Issue: Role changes don't take effect immediately

- Browser session caches user info
- Logout and login to refresh
- Or reload from `/api/auth/me` endpoint

---

## Files Created/Modified

**New Files:**

- ✅ `seed-test-users-with-roles.mjs` - Test data seeder
- ✅ `src/utils/roles.ts` - Role management functions
- ✅ `src/utils/auth-middleware.ts` - Auth middleware
- ✅ `src/pages/api/admin/roles/assign-system-role.ts` - System role endpoint
- ✅ `src/pages/api/admin/roles/assign-group-role.ts` - Group role endpoint
- ✅ `src/pages/api/admin/users/index.ts` - List users endpoint
- ✅ `USER_ROLES_TESTING_GUIDE.md` - Documentation

**No breaking changes to existing files** - All new functionality is additive.
