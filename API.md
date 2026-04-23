# Invitation System API Reference

Complete documentation for the Group Invitations API endpoints.

## Base URL

```
http://localhost:3000/api
```

## Authentication

All endpoints require a valid `sessionId` cookie. The session is set when a user logs in.

```
Cookie: sessionId=<session_uuid>
```

## Endpoints

---

## POST `/groups/{id}/invite`

Send an invitation to a user to join a group.

**Authentication:** Required (must be group owner)

**Method:** `POST`

**Path Parameters:**
| Name | Type | Description |
|------|------|-------------|
| `id` | UUID | The group ID |

**Request Body:**

```json
{
  "email": "user@example.com"
}
```

**Request Fields:**
| Field | Type | Required | Validation |
|-------|------|----------|-----------|
| `email` | string | Yes | Valid email format |

**Response (200 OK):**

```json
{
  "success": true,
  "invitation": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "groupId": "550e8400-e29b-41d4-a716-446655440001",
    "status": "pending",
    "expiresAt": "2026-05-08T12:34:56.789Z",
    "invitedAt": "2026-04-08T12:34:56.789Z"
  }
}
```

**Error Responses:**

| Status | Error                        | Reason                                      |
| ------ | ---------------------------- | ------------------------------------------- |
| 400    | "Invalid email address"      | Email format is invalid                     |
| 400    | "Group ID required"          | Path parameter missing                      |
| 401    | "Unauthorized"               | No valid session                            |
| 401    | "Session expired"            | Session cookie expired                      |
| 403    | "Not the group creator"      | User is not the group owner                 |
| 404    | "Group not found"            | Group ID doesn't exist                      |
| 409    | "Invitation already pending" | Duplicate pending invitation for this email |
| 500    | "Failed to send invitation"  | Server error during creation                |

**Example Request (curl):**

```bash
curl -X POST http://localhost:3000/api/groups/550e8400-e29b-41d4-a716-446655440001/invite \
  -H "Content-Type: application/json" \
  -b "sessionId=your_session_id" \
  -d '{
    "email": "friend@example.com"
  }'
```

**Example Request (PowerShell):**

```powershell
$body = @{
  email = "friend@example.com"
} | ConvertTo-Json

$response = Invoke-WebRequest -Uri "http://localhost:3000/api/groups/550e8400-e29b-41d4-a716-446655440001/invite" `
  -Method POST `
  -ContentType "application/json" `
  -Body $body `
  -Headers @{"Cookie" = "sessionId=your_session_id"} `
  -SessionVariable session

$response.Content | ConvertFrom-Json
```

---

## POST `/groups/invitations/accept`

Accept a pending invitation and join a group.

**Authentication:** Required

**Method:** `POST`

**Request Body:**

```json
{
  "invitationId": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Request Fields:**
| Field | Type | Required | Validation |
|-------|------|----------|-----------|
| `invitationId` | string (UUID) | Yes | Valid UUID format |

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Invitation accepted. You've joined the group.",
  "membership": {
    "id": "550e8400-e29b-41d4-a716-446655440002",
    "groupId": "550e8400-e29b-41d4-a716-446655440001",
    "userId": "550e8400-e29b-41d4-a716-446655440003",
    "joinedAt": "2026-04-08T12:34:56.789Z"
  }
}
```

**Error Responses:**

| Status | Error                         | Reason                             |
| ------ | ----------------------------- | ---------------------------------- |
| 400    | "Invalid invitation ID"       | UUID format is invalid             |
| 401    | "Unauthorized"                | No valid session                   |
| 401    | "Session expired"             | Session cookie expired             |
| 404    | "Invitation not found"        | Invitation ID doesn't exist        |
| 409    | "Invitation already accepted" | Invitation was previously accepted |
| 410    | "Invitation expired"          | 30-day expiration has passed       |
| 500    | "Failed to accept invitation" | Server error during update         |

**Example Request (curl):**

```bash
curl -X POST http://localhost:3000/api/groups/invitations/accept \
  -H "Content-Type: application/json" \
  -b "sessionId=your_session_id" \
  -d '{
    "invitationId": "550e8400-e29b-41d4-a716-446655440000"
  }'
```

**Example Request (PowerShell):**

```powershell
$body = @{
  invitationId = "550e8400-e29b-41d4-a716-446655440000"
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:3000/api/groups/invitations/accept" `
  -Method POST `
  -ContentType "application/json" `
  -Body $body `
  -WebSession $session
```

---

## POST `/groups/invitations/decline`

Decline a pending invitation.

**Authentication:** Required

**Method:** `POST`

**Request Body:**

```json
{
  "invitationId": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Request Fields:**
| Field | Type | Required | Validation |
|-------|------|----------|-----------|
| `invitationId` | string (UUID) | Yes | Valid UUID format |

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Invitation declined."
}
```

**Error Responses:**

| Status | Error                          | Reason                                        |
| ------ | ------------------------------ | --------------------------------------------- |
| 400    | "Invalid invitation ID"        | UUID format is invalid                        |
| 401    | "Unauthorized"                 | No valid session                              |
| 401    | "Session expired"              | Session cookie expired                        |
| 403    | "Unauthorized"                 | Invitation email doesn't match logged-in user |
| 404    | "Invitation not found"         | Invitation ID doesn't exist                   |
| 500    | "Failed to decline invitation" | Server error during update                    |

**Example Request (curl):**

```bash
curl -X POST http://localhost:3000/api/groups/invitations/decline \
  -H "Content-Type: application/json" \
  -b "sessionId=your_session_id" \
  -d '{
    "invitationId": "550e8400-e29b-41d4-a716-446655440000"
  }'
```

---

## GET `/dashboard/pending-invitations`

Retrieve all pending invitations for the logged-in user.

**Authentication:** Required

**Method:** `GET`

**Query Parameters:** None

**Response (200 OK):**

```json
{
  "success": true,
  "invitations": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "groupId": "550e8400-e29b-41d4-a716-446655440001",
      "groupName": "Vegas Trip 2026",
      "email": "user@example.com",
      "invitedByName": "John Doe",
      "invitedAt": "2026-04-05T10:00:00.000Z",
      "expiresAt": "2026-05-05T10:00:00.000Z"
    },
    {
      "id": "550e8400-e29b-41d4-a716-446655440010",
      "groupId": "550e8400-e29b-41d4-a716-446655440011",
      "groupName": "Weekend Getaway",
      "email": "user@example.com",
      "invitedByName": "Jane Smith",
      "invitedAt": "2026-04-07T14:30:00.000Z",
      "expiresAt": "2026-05-07T14:30:00.000Z"
    }
  ]
}
```

**Error Responses:**

| Status | Error                                 | Reason                 |
| ------ | ------------------------------------- | ---------------------- |
| 401    | "Unauthorized"                        | No valid session       |
| 401    | "Session expired"                     | Session cookie expired |
| 404    | "Customer not found"                  | User account not found |
| 500    | "Failed to fetch pending invitations" | Server error           |

**Example Request (curl):**

```bash
curl -X GET http://localhost:3000/api/dashboard/pending-invitations \
  -b "sessionId=your_session_id"
```

**Example Request (PowerShell):**

```powershell
Invoke-WebRequest -Uri "http://localhost:3000/api/dashboard/pending-invitations" `
  -Method GET `
  -WebSession $session | ConvertFrom-Json
```

---

## GET `/groups/{id}/members`

Retrieve members and pending invitations for a specific group.

**Authentication:** Required (must be member or owner)

**Method:** `GET`

**Path Parameters:**
| Name | Type | Description |
|------|------|-------------|
| `id` | UUID | The group ID |

**Response (200 OK):**

```json
{
  "success": true,
  "group": {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "name": "Vegas Trip 2026",
    "isOwner": true
  },
  "members": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440003",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com",
      "joinedAt": "2026-04-01T10:00:00.000Z"
    },
    {
      "id": "550e8400-e29b-41d4-a716-446655440004",
      "firstName": "Jane",
      "lastName": "Smith",
      "email": "jane@example.com",
      "joinedAt": "2026-04-03T14:30:00.000Z"
    }
  ],
  "pendingInvitations": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440005",
      "email": "pending@example.com",
      "invitedByName": "John Doe",
      "invitedAt": "2026-04-07T10:00:00.000Z",
      "expiresAt": "2026-05-07T10:00:00.000Z"
    }
  ]
}
```

**Error Responses:**

| Status | Error                           | Reason                   |
| ------ | ------------------------------- | ------------------------ |
| 400    | "Group ID required"             | Path parameter missing   |
| 401    | "Unauthorized"                  | No valid session         |
| 401    | "Session expired"               | Session cookie expired   |
| 403    | "Not a member of this group"    | User doesn't have access |
| 404    | "Group not found"               | Group ID doesn't exist   |
| 500    | "Failed to fetch group members" | Server error             |

**Example Request (curl):**

```bash
curl -X GET http://localhost:3000/api/groups/550e8400-e29b-41d4-a716-446655440001/members \
  -b "sessionId=your_session_id"
```

---

## Data Models

### PendingGroupInvitation

```typescript
{
  id: string;              // UUID
  groupId: string;         // UUID, FK -> expenseGroups.id
  email: string;           // Email address (max 255 chars)
  invitedBy: string;       // UUID, FK -> humans.id
  status: string;          // 'pending' | 'accepted' | 'rejected' | 'expired'
  invitedAt: Date;         // Timestamp when created
  expiresAt: Date;         // Timestamp for 30-day expiration
  acceptedAt?: Date;       // Timestamp when accepted (optional)
}
```

### GroupMember (Response)

```typescript
{
  id: string; // Human UUID
  firstName: string;
  lastName: string;
  email: string;
  joinedAt: Date; // Timestamp when added to group
}
```

### Group (Response)

```typescript
{
  id: string; // UUID
  name: string;
  isOwner: boolean; // True if current user created the group
}
```

---

## Common Status Codes

| Code | Meaning                                              |
| ---- | ---------------------------------------------------- |
| 200  | Success - Response body contains result              |
| 400  | Bad Request - Invalid input or malformed body        |
| 401  | Unauthorized - Missing or invalid session            |
| 403  | Forbidden - User lacks permission                    |
| 404  | Not Found - Resource doesn't exist                   |
| 409  | Conflict - Resource already exists or state conflict |
| 410  | Gone - Invitation expired                            |
| 500  | Server Error - Unexpected error                      |

---

## Rate Limiting

No rate limiting currently implemented. Use reasonable request frequency.

---

## Testing

All API endpoints can be tested using:

- **Postman Collection**: See `invitations.postman_collection.json`
- **curl**: Examples provided in each endpoint section
- **Vitest**: Automated tests in `src/tests/api/invitations.test.ts`

---

## Notes

- All list responses are filtered to show only non-expired, pending invitations
- Invitations expire 30 days after creation
- Users can only see invitations sent to their email address
- Only group owners can send invitations from their groups
- Accepting an invitation automatically adds the user to `groupMembers` table
- Email sending is optional (requires `RESEND_API_KEY` environment variable)

---

## Related Documentation

- [Invitation System Setup Guide](./EMAIL_SETUP.md)
- [User Testing Guide](./INVITATION_TESTING_GUIDE.md)
- [Group Management Page Guide](./INVITATION_UI_ROADMAP.md)
