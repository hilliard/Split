# CRUD Architecture for Split Entities

## Overview

This document outlines the CRUD (Create, Read, Update, Delete) architecture for the Split application's main entities.

## Directory Structure

```
src/
├── pages/
│   ├── api/
│   │   ├── users/
│   │   │   ├── create.ts         (POST)
│   │   │   ├── list.ts           (GET)
│   │   │   ├── [id]/
│   │   │   │   ├── get.ts        (GET)
│   │   │   │   ├── update.ts     (PUT)
│   │   │   │   └── delete.ts     (DELETE)
│   │   │
│   │   ├── groups/
│   │   │   ├── create.ts         (POST)
│   │   │   ├── list.ts           (GET)
│   │   │   ├── [id]/
│   │   │   │   ├── get.ts        (GET - optional, use members.ts)
│   │   │   │   ├── update.ts     (PUT)
│   │   │   │   ├── delete.ts     (DELETE)
│   │   │   │   ├── members.ts    (GET - list members)
│   │   │   │   └── invite.ts     (POST - send invitation)
│   │   │
│   │   ├── events/
│   │   │   ├── create.ts         (POST)
│   │   │   ├── list.ts           (GET)
│   │   │   ├── [id]/
│   │   │   │   ├── get.ts        (GET)
│   │   │   │   ├── update.ts     (PUT)
│   │   │   │   └── delete.ts     (DELETE)
│   │   │
│   │   └── activities/
│   │       ├── create.ts         (POST)
│   │       ├── list.ts           (GET)
│   │       ├── [id]/
│   │       │   ├── get.ts        (GET)
│   │       │   ├── update.ts     (PUT)
│   │       │   └── delete.ts     (DELETE)
│   │
│   └── [entity]/
│       ├── create.astro          (Create page)
│       ├── [id]/
│       │   ├── index.astro       (View page)
│       │   ├── edit.astro        (Edit page)
│       │   └── manage.astro      (Management page - group specific)
│
└── db/
    ├── schema.ts                  (All table definitions)
    └── queries.ts                 (Reusable queries - optional but recommended)
```

## API Endpoint Pattern

### Standard CRUD Endpoints

Each entity should follow this pattern:

#### 1. **CREATE** - POST `/api/[entity]/create`

**Request:**

```json
{
  "name": "string",
  "description": "string",
  ...other fields
}
```

**Response (201 - Created):**

```json
{
  "success": true,
  "data": { ...created entity }
}
```

**Error (400, 401, 403, 500):**

```json
{
  "error": "error message"
}
```

#### 2. **LIST** - GET `/api/[entity]/list`

**Query Params (optional):**

- `page`: pagination
- `limit`: items per page
- `filter`: search filter
- `sort`: sort field

**Response (200):**

```json
{
  "items": [...],
  "count": 10,
  "page": 1,
  "total": 100,
  "pageCount": 10
}
```

#### 3. **READ** - GET `/api/[entity]/[id]`

**Response (200):**

```json
{
  "success": true,
  "data": { ...entity details }
}
```

#### 4. **UPDATE** - PUT `/api/[entity]/[id]`

**Request:**

```json
{
  "field": "new value",
  ...only changed fields
}
```

**Response (200):**

```json
{
  "success": true,
  "data": { ...updated entity }
}
```

#### 5. **DELETE** - DELETE `/api/[entity]/[id]`

**Response (200):**

```json
{
  "success": true,
  "message": "Entity deleted"
}
```

## Current Implementation Status

### ✅ Groups (Mostly Complete)

- [x] Create: `POST /api/groups/create`
- [x] List: `GET /api/groups/list`
- [x] Get: Via `/api/groups/list?id={id}` (could be `/api/groups/[id]/get`)
- [x] Update: `PUT /api/groups/[id]/update`
- [x] Delete: `DELETE /api/groups/[id]/delete`
- [x] Members: `GET /api/groups/[id]/members`
- [x] Invite: `POST /api/groups/[id]/invite`

**Pages:**

- [x] Create: `/groups/create`
- [x] Manage: `/groups/[id]/manage`
- [x] Edit: `/groups/[id]/edit`

### 🟡 Events (Partial)

- [x] Create: `POST /api/events/create`
- [x] List: `GET /api/events/list`
- [ ] Get: `GET /api/events/[id]` (missing)
- [ ] Update: `PUT /api/events/[id]/update` (missing)
- [ ] Delete: `DELETE /api/events/[id]/delete` (missing)

**Pages:**

- [x] Create: `/events/create`
- [ ] View: `/events/[id]` (missing)
- [ ] Edit: `/events/[id]/edit` (missing)

### ❌ Activities (Not Started)

- [ ] Create
- [ ] List
- [ ] Get
- [ ] Update
- [ ] Delete

**Pages:**

- [ ] All missing

### ❌ Users (Not Started)

- [ ] Create (via auth/register exists)
- [ ] List
- [ ] Get: `/api/auth/me` (exists)
- [ ] Update: (missing)
- [ ] Delete: (missing)

**Pages:**

- [ ] Profile: (missing)
- [ ] Edit Profile: (missing)

## Best Practices

### 1. Authentication

- Always check session in every endpoint
- Verify user has permission to perform action
- Return 401 for auth errors, 403 for permission errors

### 2. Validation

- Use Zod schemas for input validation
- Return 400 with specific error messages
- Validate permissions before executing

### 3. Error Handling

```typescript
try {
  // operation
} catch (error) {
  console.error('Error doing thing:', error);
  return new Response(JSON.stringify({ error: 'Failed to do thing' }), {
    status: 500,
    headers: { 'Content-Type': 'application/json' },
  });
}
```

### 4. Consistency

- Use same response structure for all endpoints
- Use consistent naming conventions
- Follow the same patterns for similar operations

### 5. Documentation

- Add comments above complex queries
- Document required permissions
- Keep API.md updated with examples

## Next Steps

1. **Implement Event endpoints:**
   - `GET /api/events/[id]` - Get single event
   - `PUT /api/events/[id]/update` - Update event
   - `DELETE /api/events/[id]/delete` - Delete event
   - Create view/edit pages

2. **Implement Activity endpoints:**
   - Full CRUD for activities within events
   - Create activity management pages

3. **Implement User profile endpoints:**
   - `PUT /api/users/[id]/update` - Update profile
   - `DELETE /api/users/[id]/delete` - Delete account
   - Create profile edit pages

4. **Create shared query utilities:**
   - Reusable database queries in `src/db/queries.ts`
   - Common permission checks
   - Pagination helpers

5. **Add pagination and filtering:**
   - Implement consistent pagination
   - Add search/filter to list endpoints
   - Update list pages with navigation

## Entity Relationships

```
User (humans)
├── Sessions (authentication)
├── Groups membership (groupMembers)
├── Events created (events.creatorId)
├── Activities created
└── Expenses paid (expenses.paidBy)

Group (expenseGroups)
├── Members (groupMembers)
├── Events (events.groupId)
├── Pending Invitations (pendingGroupInvitations)
└── Expenses

Event
├── Activities (activities.eventId)
├── Expenses (expenses.eventId)
└── Group (optional)

Activity
└── Expenses (expenses.activityId)

Expense
├── Splits (expenseSplits)
└── Payer (humans.id)
```

## Files to Create/Modify

### High Priority

1. Event Get/Update/Delete endpoints
2. Event view/edit pages
3. User profile endpoints

### Medium Priority

1. Activity CRUD endpoints
2. Activity pages
3. Pagination utilities

### Low Priority

1. Advanced filtering
2. Search functionality
3. Bulk operations
