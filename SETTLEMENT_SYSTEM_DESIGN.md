# Settlement System Design

## Overview

The Settlement System tracks when users pay each other to settle debts from shared expenses. It bridges the gap between:

- **Calculated Balances** (`/api/expenses/balances`) - Shows what's theoretically owed
- **Actual Payments** - Records when real money changes hands
- **Updated Balances** - Reflects cleared debts

---

## Current State Analysis

### ✅ What We Have

1. **Balances API** (`/api/expenses/balances?eventId=X`)
   - Calculates who owes whom using a greedy algorithm
   - Returns: individual balances, settlement recommendations, minimized transactions
   - Example: "Dave owes Carol $121.49"

2. **UI Display** (Event detail page)
   - Shows balances per person (Paid, Owes, Net)
   - Displays settlement summary with recommended transactions
   - Visual status: "All settled up!" vs. pending payments

3. **Data Foundation**
   - `expenses` table - Who paid what
   - `expenseSplits` table - Who owes how much
   - `events` table - Groups expenses
   - Both use **integer amounts in cents**

### ❌ What's Missing

1. **No settlement recording** - No way to mark debts as paid
2. **No settlement history** - Can't see who paid whom and when
3. **No payment proof** - No receipt/confirmation mechanism
4. **No notification** - Users don't know when they're owed money

---

## Proposed Schema

### New Table: `settlements`

**Purpose**: Track actual payment transactions between users

```sql
CREATE TABLE "settlements" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "event_id" uuid NOT NULL REFERENCES events(id) ON DELETE cascade,
  "group_id" uuid REFERENCES expense_groups(id) ON DELETE set null,
  "from_user_id" uuid NOT NULL REFERENCES humans(id) ON DELETE restrict,
  "to_user_id" uuid NOT NULL REFERENCES humans(id) ON DELETE restrict,
  "amount" integer NOT NULL,                    -- in cents
  "description" varchar(500) DEFAULT '',       -- optional note about payment
  "status" varchar(50) DEFAULT 'pending',      -- pending, completed, disputed, cancelled
  "payment_method" varchar(100),                -- optional: venmo, cash, bank transfer, etc.
  "created_at" timestamp DEFAULT now() NOT NULL,
  "completed_at" timestamp,                    -- when payment confirmed
  "updated_at" timestamp DEFAULT now() NOT NULL
);

-- Indexes for quick lookups
CREATE INDEX settlements_event_idx ON settlements(event_id);
CREATE INDEX settlements_from_user_idx ON settlements(from_user_id);
CREATE INDEX settlements_to_user_idx ON settlements(to_user_id);
CREATE INDEX settlements_status_idx ON settlements(status);
CREATE INDEX settlements_created_at_idx ON settlements(created_at);
```

### Settlement Status Flow

```
pending   → completed   (payment made)
        ↘  disputed     (payment contested)
        ↘  cancelled    (user changed mind)
```

---

## API Endpoints

### 1. Record a Settlement Payment

**POST** `/api/settlements/create`

**Purpose**: User records they paid someone to settle a debt

**Request:**

```json
{
  "eventId": "trip-colorado-2026",
  "fromUserId": "dave-id",
  "toUserId": "carol-id",
  "amountCents": 12149,
  "paymentMethod": "venmo",
  "description": "Paid for hotel"
}
```

**Response:**

```json
{
  "success": true,
  "settlementId": "settlement-123",
  "status": "pending",
  "createdAt": "2026-04-21T10:30:00Z"
}
```

**Authorization**: Only `fromUserId` (the payer) can record
**Validation**:

- Amount matches calculated balance for this pair
- Both users are part of the event
- Settlement doesn't already exist

---

### 2. Get Unsettled Balances

**GET** `/api/expenses/balances?eventId=X`

**Enhanced Response** (add settlement tracking):

```json
{
  "success": true,
  "balances": [
    {
      "userId": "dave-id",
      "name": "Dave Brown",
      "paidAmount": 0.0,
      "owesAmount": 121.49,
      "netBalance": -121.49,
      "unsettledAmount": 121.49 // ← NEW: amount still unpaid
    }
  ],
  "settlements": [
    {
      "from": "dave-id",
      "fromName": "Dave Brown",
      "to": "carol-id",
      "toName": "Carol White",
      "amount": 121.49,
      "status": "pending" // ← NEW: track status
    }
  ]
}
```

---

### 3. Confirm Settlement Payment

**PUT** `/api/settlements/:settlementId/confirm`

**Purpose**: Receiver confirms they got paid (optional verification layer)

**Request:**

```json
{
  "confirmedAt": "2026-04-21T11:00:00Z"
}
```

**Response:**

```json
{
  "success": true,
  "status": "completed",
  "confirmedAt": "2026-04-21T11:00:00Z"
}
```

**Authorization**: Only `toUserId` (receiver) can confirm
**Effect**: Marks settlement as complete, no longer shows in balance calculations

---

### 4. Get User's Settlement History

**GET** `/api/settlements/history?userId=X&eventId=Y`

**Purpose**: See all payments sent/received for an event

**Response:**

```json
{
  "success": true,
  "paid": [
    {
      "settlementId": "settlement-123",
      "to": "carol-id",
      "toName": "Carol White",
      "amount": 121.49,
      "status": "completed",
      "paidOn": "2026-04-21T10:30:00Z",
      "confirmedOn": "2026-04-21T11:00:00Z"
    }
  ],
  "received": [
    {
      "settlementId": "settlement-124",
      "from": "alice-id",
      "fromName": "Alice Smith",
      "amount": 87.53,
      "status": "pending",
      "paidOn": "2026-04-21T12:00:00Z"
    }
  ]
}
```

---

### 5. List All Settlements for Event

**GET** `/api/settlements/event?eventId=X&status=pending`

**Purpose**: See all outstanding or completed settlements for an event

**Response:**

```json
{
  "success": true,
  "total": 3,
  "pending": 2,
  "completed": 1,
  "settlements": [
    {
      "id": "settlement-123",
      "from": "dave-id",
      "fromName": "Dave Brown",
      "to": "carol-id",
      "toName": "Carol White",
      "amount": 121.49,
      "status": "pending",
      "paymentMethod": "venmo",
      "createdAt": "2026-04-21T10:30:00Z"
    }
  ]
}
```

---

## Updated Balance Calculation Logic

### Key Change: Filter Out Settled Payments

**Old Logic** (current `/api/expenses/balances`):

```
For all expense splits:
  Calculate what each person paid vs. owed
```

**New Logic**:

```
For all expense splits:
  Calculate what each person paid vs. owed

Then:
  For each completed settlement:
    Reduce the balance by that amount

Return:
  balances (after settlement deductions)
  unsettled (what still remains)
```

### Example

```
Before Settlement:
├─ Alice: paid $100, owes $25 → net: +$75 (owed $75)
└─ Bob: paid $0, owes $100 → net: -$100 (owes $100)

Settlement 1: Bob pays Alice $75
├─ Alice: +$75 received → new balance: $0
└─ Bob: -$75 paid → new balance: -$25

Remaining:
├─ Alice: SETTLED ✅
└─ Bob: Still owes Alice $25
```

---

## UI Components to Add

### 1. Settlement Recording Modal

```
Modal: "Record a Payment"
├─ From: [Current User] (auto-filled)
├─ To: [Dropdown of people they owe]
├─ Amount: [Auto-filled from balance]
├─ Payment Method: [Venmo/Cash/Bank/Other]
├─ Description: [Optional note]
└─ [Cancel] [Record Payment]
```

### 2. Settlement Status Badge

```
Settlement Card:
├─ Dave sent Carol $100
├─ Status: ⏳ Pending (Carol to confirm)
├─ Or: ✅ Confirmed on Apr 21
├─ Or: ❌ Disputed
└─ [Cancel] [Contact User]
```

### 3. Updated Event Summary

```
Settlement Progress:
├─ Total Owed: $1,500
├─ Still Pending: $300 (80% settled)
└─ Progress Bar: [=======>....] 80%
```

---

## Implementation Roadmap

### Phase 1: Foundation (Database + APIs)

- [ ] Create `settlements` table & migration
- [ ] Implement `POST /api/settlements/create`
- [ ] Implement `PUT /api/settlements/:id/confirm`
- [ ] Update balances calculation to exclude settled payments

### Phase 2: History & Query (APIs)

- [ ] Implement `GET /api/settlements/history`
- [ ] Implement `GET /api/settlements/event`
- [ ] Add settlement list to event API

### Phase 3: UI & UX

- [ ] Add "Record Payment" button to event summary
- [ ] Show settlement history in event detail page
- [ ] Display settlement status badges
- [ ] Add notification when payment received

### Phase 4: Advanced Features

- [ ] Payment verification flow
- [ ] Dispute mechanism
- [ ] Settlement reminders/notifications
- [ ] Export settlement history

---

## Data Integrity Rules

### Monetary Storage

- **All amounts in cents (integers)** - Never store as decimals
- `amount: integer NOT NULL` stores cents
- Convert to dollars only for UI display: `amount / 100.0`

### Foreign Keys & Cascades

- Settlement references `event_id` with CASCADE delete
- Both `from_user_id` and `to_user_id` with RESTRICT (can't delete users with settlements)
- Group reference with SET NULL (settlement exists without group if deleted)

### Status Validation

- Only `pending` → `completed` is normal flow
- `pending` → `disputed` if contested
- Only `from_user` can create
- Only `to_user` can confirm or dispute

---

## Edge Cases to Handle

1. **Partial Settlements**
   - User pays $50 of $100 owed - create new settlement for remainder
   - Or: enforce exact amounts?

2. **Multiple Payments Between Same Users**
   - Dave owes Carol $100 and $50 on separate expenses
   - One settlement per debt pair or consolidate?

3. **User Deletes Expense**
   - Cascades delete related settlements? Or mark cancelled?

4. **Concurrent Settlements**
   - Both users record same payment simultaneously?

5. **Currency Changes**
   - Event starts in USD, later switch to EUR?
   - (Out of scope for now)

---

## Testing Checklist

- [ ] Create settlement and verify in database
- [ ] Balances reduced after settlement recorded
- [ ] Can only create settlement for valid owed amount
- [ ] Confirm settlement updates status
- [ ] Settlement history shows correct paid/received
- [ ] Event with all settled shows 0 pending
- [ ] User authorization (can't settle for others)
- [ ] Amounts stored in cents, displayed as dollars
- [ ] Cascade delete removes settlements with event

---

## Success Criteria

✅ Users can record who paid whom to settle debts
✅ Balances automatically update after settlements
✅ Settlement history is queryable and displayable
✅ All amounts stored in cents, displayed in dollars
✅ Authorization prevents unauthorized operations
✅ Data integrity maintained with proper foreign keys
