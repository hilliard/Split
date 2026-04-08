# Role-Based Authorization System

## Overview

The Split application uses a **two-tier role-based authorization** system:

1. **System Roles** (app-level) - What you can do app-wide
2. **Group Roles** (group-level) - What you can do within a specific group

This ensures data security and proper access control across all resources.

## Role Hierarchy

### System Roles (App-Level)

```typescript
enum SystemRole {
  ADMIN = 'admin',  // System administrator - full app access
  USER = 'user',    // Regular user - personal and group access
}
```

**Rules:**
- **ADMIN**: Can manage users, view all groups/events, access admin dashboard
- **USER**: Can create groups, events, and participate in shared expenses

### Group Roles (Group-Level)

```typescript
enum GroupRole {
  OWNER = 'owner',      // Group creator - full control
  ADMIN = 'admin',      // Promoted by owner - manage events/members
  MEMBER = 'member',    // Can create/edit own events
  VIEWER = 'viewer',    // Read-only access
  NONE = 'none',        // Not a member
}
```

**Rules:**
- **OWNER**: User who created the group (automatic)
- **ADMIN**: User promoted by the group owner
- **MEMBER**: User invited to and accepted membership
- **VIEWER**: User with read-only access (assigned by owner/admin)
- **NONE**: User is not a member

## Authorization Rules

### Group Management

| Action | OWNER | ADMIN | MEMBER | VIEWER | Non-Member |
|--------|-------|-------|--------|--------|-----------|
| View | ✅ | ✅ | ✅ | ✅ | ❌ |
| Edit | ✅ | ❌ | ❌ | ❌ | ❌ |
| Delete | ✅ | ❌ | ❌ | ❌ | ❌ |
| Invite Members | ✅ | ✅ | ❌ | ❌ | ❌ |
| Remove Members | ✅ | ⚠️* | ❌ | ❌ | ❌ |

*Admin can remove MEMBER and VIEWER but not other ADMINs or the OWNER

### Event Management (Within a Group)

| Action | OWNER | ADMIN | MEMBER | VIEWER | Non-Member |
|--------|-------|-------|--------|--------|-----------|
| Create | ✅ | ✅ | ✅ | ❌ | ❌ |
| Read | ✅ | ✅ | ✅ | ✅ | ⚠️** |
| Edit | ✅ | ✅ | ❌ | ❌ | ❌ |
| Delete | ✅ | ✅ | ❌ | ❌ | ❌ |

**OWNER**: User who created the event (always can read/edit/delete)
**ADMIN**: User with group ADMIN role (can edit/delete any event)
**MEMBER**: User with group MEMBER role (can create/read, but only edit own events)
**VIEWER**: User with group VIEWER role (can only read)
**Non-Member**: Can read if event is public

*Non-members can only read if event.isPublic = true

### User Management (System Admin Only)

| Action | System Admin | Regular User |
|--------|-------------|--------------|
| View All Users | ✅ | ❌ |
| Change User Role | ✅ | ❌ |
| Delete User | ✅ | ❌ |
| View Own Profile | ✅ | ✅ |
| Edit Own Profile | ✅ | ✅ |

## Implementation
- **VIEWER**: Event is public (`isPublic = true`)
- **NONE**: Event is private and user has no access

## Authorization Functions

### Location: `src/db/authorization.ts`

#### Group Functions

```typescript
// Check if user is owner of a group
isGroupOwner(userId: string, groupId: string): Promise<boolean>

// Check if user is member of a group
isGroupMember(userId: string, groupId: string): Promise<boolean>

// Get user's role for a group
getGroupRole(userId: string, groupId: string): Promise<Role>

// Check if user can manage a group (owner only)
canUserManageGroup(userId: string, groupId: string): Promise<boolean>

// Check if user can view a group (owner or member)
canUserViewGroup(userId: string, groupId: string): Promise<boolean>
```

#### Event Functions

```typescript
// Get user's role for an event
getEventRole(userId: string, eventId: string): Promise<Role>

// Check if user can read/view an event
canUserReadEvent(userId: string, eventId: string): Promise<boolean>

// Check if user can edit an event (owner or group admin)
canUserEditEvent(userId: string, eventId: string): Promise<boolean>

// Check if user can delete an event (owner or group admin)
canUserDeleteEvent(userId: string, eventId: string): Promise<boolean>
```

## Using Authorization in Endpoints

### Pattern 1: Check Permission and Return Error

```typescript
import { canUserEditEvent } from '@/db/authorization';

export const PUT: APIRoute = async (context) => {
  // ... validate session ...

  // Get resource
  const [event] = await db.select().from(events).where(eq(events.id, eventId));
  if (!event) return new Response('Not found', { status: 404 });

  // Check permission
  const canEdit = await canUserEditEvent(session.userId, eventId);
  if (!canEdit) {
    return new Response(
      JSON.stringify({ error: 'Not authorized to edit this event' }),
      { status: 403 }
    );
  }

  // Proceed with update...
};
```

### Pattern 2: Get Role and Handle Accordingly

```typescript
import { getEventRole, Role } from '@/db/authorization';

export const GET: APIRoute = async (context) => {
  // ... validate session ...

  const role = await getEventRole(session.userId, eventId);

  // Different access levels based on role
  switch (role) {
    case Role.OWNER:
    case Role.ADMIN:
      // Return full details including sensitive info
      return fullEventDetails;
    
    case Role.MEMBER:
      // Return member-accessible info
      return memberVisibleDetails;
    
    case Role.VIEWER:
      // Return only public info
      return publicEventDetails;
    
    default:
      // No access
      return forbiddenError;
  }
};
```

## Current API Endpoints with Authorization

### Groups

✅ **POST** `/api/groups/create`
- Requires: Authenticated user
- Creates group, user becomes owner

✅ **GET** `/api/groups/list`
- Requires: Authenticated user
- Returns: Groups where user is member

✅ **PUT** `/api/groups/[id]/update`
- Requires: Group owner
- Returns: 403 if not owner

✅ **DELETE** `/api/groups/[id]/delete`
- Requires: Group owner
- Returns: 403 if not owner

✅ **GET** `/api/groups/[id]/members`
- Requires: Group member or owner
- Returns: 403 if not member

✅ **POST** `/api/groups/[id]/invite`
- Requires: Group owner (not implemented yet - TODO)
- Sends invitation to new member

### Events

✅ **POST** `/api/events/create`
- Requires: Authenticated user
- Creates event, user becomes owner

✅ **GET** `/api/events/list`
- Requires: Authenticated user
- Returns: All events user can access

✅ **GET** `/api/events/[id]`
- Requires: User can read event (owner, group member, or public)
- Returns: 403 if not authorized

✅ **PUT** `/api/events/[id]/update`
- Requires: Event owner or group admin
- Returns: 403 if not authorized

✅ **DELETE** `/api/events/[id]/delete`
- Requires: Event owner or group admin
- Returns: 403 if not authorized

## Best Practices

### 1. Always Check Authorization

```typescript
// ❌ WRONG - Don't skip authorization checks
const [event] = await db.select().from(events).where(eq(events.id, eventId));
// Just delete it without checking who's requesting
await db.delete(events).where(eq(events.id, eventId));

// ✅ CORRECT - Always verify permission
const canDelete = await canUserDeleteEvent(session.userId, eventId);
if (!canDelete) {
  return new Response('Forbidden', { status: 403 });
}
await db.delete(events).where(eq(events.id, eventId));
```

### 2. Use Specific Permission Functions

```typescript
// ❌ WRONG - Checking if owner is enough for events in groups
if (event.creatorId === session.userId) {
  // Allow edit
}

// ✅ CORRECT - Account for group admin
const canEdit = await canUserEditEvent(session.userId, eventId);
if (canEdit) {
  // Allow edit
}
```

### 3. Return Appropriate HTTP Status Codes

- **401 Unauthorized**: No session / session expired
- **403 Forbidden**: Authenticated but no permission
- **404 Not Found**: Resource doesn't exist (or hide from unauthorized)

```typescript
// Check session first
if (!session) return new Response(..., { status: 401 });

// Check resource exists
if (!resource) return new Response(..., { status: 404 });

// Check permission
if (!hasPermission) return new Response(..., { status: 403 });
```

## Future Enhancements

### 1. System Admins
- Add global admin role for system-level management
- Allow admins to delete any resource

### 2. RBAC (Role-Based Access Control)
- Define specific roles per group (admin, moderator, member, viewer)
- Store user's role in groupMembers table
- More granular permissions

### 3. Explicit Permissions
- Add permissions table for flexibility
- Allow custom permission definitions
- Support for feature-based access control

### 4. Audit Logging
- Track who accessed/modified what resource
- When was the action taken
- From what IP/device

### 5. Rate Limiting
- Limit API calls per user
- Prevent abuse
- Tiered limits based on user roles

## Testing Authorization

### Manual Testing

```bash
# Test as owner - should succeed
curl -X PUT http://localhost:3000/api/events/event-id/update \
  -H "Authorization: Bearer token-owner"

# Test as member - should fail with 403
curl -X PUT http://localhost:3000/api/events/event-id/update \
  -H "Authorization: Bearer token-member"

# Test as public - should return 403 for edit
curl -X PUT http://localhost:3000/api/events/event-id/update \
  -H "Authorization: Bearer token-public"
```

### Automated Testing

See `src/tests/` for test suite examples that verify authorization checks.

## Summary

The authorization system ensures:
- 🔒 Data security - Only authorized users can access/modify data
- 👥 Collaborative access - Multiple users can work on shared resources
- 🛡️ Privacy - Private resources are protected
- 📋 Audit trail - Who did what is traceable
