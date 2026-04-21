# Settlement System Phase 1 - Testing Guide

## Migration Status ✅

- **Status**: Successfully applied to Neon database
- **Command used**: `node apply-settlements-migration.mjs`
- **Table created**: `settlements` with all required columns, indexes, and foreign keys
- **Columns**: id, event_id, group_id, from_user_id, to_user_id, amount, description, status, payment_method, created_at, completed_at, updated_at

## Server Status ✅

- **Dev Server**: Running on `http://localhost:4322`
- **Port**: 4322 (port 4321 was in use)
- **Framework**: Astro 6.1.3
- **Session Storage**: Filesystem

## Settlement APIs Available

### 1. **POST /api/settlements/create**

Create a new settlement record

**Authentication**: Required (sessionId cookie)

**Request Body**:

```json
{
  "eventId": "uuid",
  "fromUserId": "uuid",
  "toUserId": "uuid",
  "amountCents": 10000,
  "paymentMethod": "venmo",
  "description": "Paid for hotel"
}
```

**Response**:

```json
{
  "success": true,
  "settlementId": "uuid",
  "status": "pending",
  "createdAt": "2026-04-21T10:55:57.000Z"
}
```

**Test Steps**:

1. Log in as a user
2. Get an existing event ID and a friend's user ID
3. POST the payment data
4. Verify settlementId is returned with status "pending"

---

### 2. **PUT /api/settlements/:settlementId/confirm**

Confirm a payment (receiver acknowledges receipt)

**Authentication**: Required (toUserId must match session)

**Request Body**: None (URL parameter only)

**Response**:

```json
{
  "success": true,
  "settlementId": "uuid",
  "status": "completed",
  "completedAt": "2026-04-21T10:55:57.000Z"
}
```

**Test Steps**:

1. Log in as the receiver (toUserId)
2. PUT to /api/settlements/{settlementId}/confirm
3. Verify status changed to "completed"
4. Verify completedAt timestamp is set

---

### 3. **GET /api/settlements/history**

View settlement history for current user

**Authentication**: Required (gets current user from session)

**Query Parameters**:

- `userId` (optional): Override current user
- `eventId` (optional): Filter by event

**Response**:

```json
{
  "success": true,
  "userId": "uuid",
  "paid": [
    {
      "id": "uuid",
      "toUserName": "John Doe",
      "amount": 10000,
      "amountDisplay": "$100.00",
      "status": "pending|completed",
      "paymentMethod": "venmo",
      "description": "Paid for hotel",
      "createdAt": "2026-04-21T10:55:57.000Z",
      "completedAt": "2026-04-21T10:55:57.000Z"
    }
  ],
  "received": [
    {
      "id": "uuid",
      "fromUserName": "Jane Doe",
      "amount": 5000,
      "amountDisplay": "$50.00",
      "status": "pending|completed",
      "paymentMethod": "venmo",
      "description": "Paid for dinner",
      "createdAt": "2026-04-21T10:55:57.000Z",
      "completedAt": null
    }
  ],
  "total": {
    "sent": 10000,
    "sentDisplay": "$100.00",
    "received": 5000,
    "receivedDisplay": "$50.00"
  }
}
```

**Test Steps**:

1. Log in as a user
2. GET /api/settlements/history
3. Verify you see payments you've made in `paid` array
4. Verify you see payments you've received in `received` array
5. Verify totals are calculated correctly

---

### 4. **GET /api/settlements/event**

View all settlements for an event

**Authentication**: Required (verifies user access to event)

**Query Parameters**:

- `eventId` (required): The event to get settlements for
- `status` (optional): Filter by status (pending, completed, disputed, cancelled)

**Response**:

```json
{
  "success": true,
  "eventId": "uuid",
  "eventName": "Vegas Trip",
  "total": 45000,
  "totalDisplay": "$450.00",
  "statusCounts": {
    "pending": 2,
    "completed": 1,
    "disputed": 0,
    "cancelled": 0
  },
  "settlements": [
    {
      "id": "uuid",
      "fromUserName": "Alice",
      "toUserName": "Bob",
      "amount": 10000,
      "amountDisplay": "$100.00",
      "status": "pending",
      "paymentMethod": "venmo",
      "description": "Paid for hotel",
      "createdAt": "2026-04-21T10:55:57.000Z",
      "completedAt": null
    }
  ]
}
```

**Test Steps**:

1. Log in as a user
2. GET /api/settlements/event?eventId={eventId}
3. Verify event name displays correctly
4. Verify settlements list shows all payments for that event
5. Verify status counts are accurate

---

## Manual Testing Workflow

### Quick Test Path (5 minutes)

1. Open `http://localhost:4322` in browser
2. Log in with test user: `alice` / `AlicePass123`
3. Navigate to an event that has expenses
4. Open the event details (should show balances modal)
5. Check if balances are correctly calculated (should subtract completed settlements)
6. Check "Owes" stat on dashboard

### Full Test Path (15 minutes)

1. **User A Logs In**
   - Log in as alice
   - Go to an event where alice owes money
   - Navigate to /api/settlements/history
   - Should see $0 paid/received initially

2. **Create Settlement (User A perspective)**
   - POST to /api/settlements/create with:
     - toUserId: bob's id
     - amountCents: 5000 ($50)
   - Verify settlement created with status "pending"
   - Check /api/settlements/history shows 5000 in "paid"

3. **Confirm Settlement (User B perspective)**
   - Log in as bob
   - Navigate to /api/settlements/history
   - Should see 5000 in "received" with status "pending"
   - PUT to /api/settlements/{settlementId}/confirm
   - Verify status changed to "completed"

4. **Verify Final State**
   - Log in as alice
   - Check /api/settlements/history
   - Should show completed payment
   - Check event balances modal
   - Balance for bob should be reduced by 5000

---

## Database Verification

To verify the migration was successful, run this query in Neon console:

```sql
SELECT * FROM settlements;
SELECT
  table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'settlements'
ORDER BY ordinal_position;
```

Should return 11 columns:

- id (uuid)
- event_id (uuid)
- group_id (uuid, nullable)
- from_user_id (uuid)
- to_user_id (uuid)
- amount (integer)
- description (varchar)
- status (varchar)
- payment_method (varchar, nullable)
- created_at (timestamp)
- completed_at (timestamp, nullable)
- updated_at (timestamp)

---

## Troubleshooting

### 401 Unauthorized Error

- **Cause**: No valid sessionId cookie
- **Solution**: Log in first at http://localhost:4322/api/auth/login

### 404 Not Found on /api/settlements/\*

- **Cause**: API endpoints not deployed
- **Solution**: Restart server with `npm run dev`

### Settlement not showing in history

- **Cause**: Wrong user ID or expired session
- **Solution**: Verify current user with `/api/auth/me` endpoint

### Database connection error

- **Cause**: Migration failed or .env.local not configured
- **Solution**: Re-run `node apply-settlements-migration.mjs`

---

## Next Steps (Phase 2)

- [ ] Add settlement list pagination
- [ ] Add settlement statistics endpoint
- [ ] Add date range filtering
- [ ] Add settlement dispute mechanism
- [ ] UI components for settlement recording

---

## Notes

- All amounts stored as INTEGER representing cents
- Status transitions: pending → completed (or disputed, cancelled)
- Foreign key constraints prevent deleting users or events with active settlements
- Indexes optimize queries for event_id, user_id, status, created_at
- Settlement history accessible to involved parties and event organizer
