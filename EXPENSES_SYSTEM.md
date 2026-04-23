# Expense & Payment Tracking System

## Overview

The expense tracking system allows groups to record what was spent, who paid, and automatically calculate who owes whom.

**Key Features:**

- ✅ Track expenses with multiple payment methods
- ✅ Split expenses among multiple people
- ✅ Automatic balance calculation
- ✅ Settlement suggestions to minimize transactions
- ✅ Per-activity expense tracking

---

## Core Concepts

### 1. **Expenses** - The actual costs

```typescript
Expense {
  id: UUID
  eventId: UUID
  amount: decimal        // What was paid (e.g., $34.95)
  category: string       // Type: "meal", "transport", "accommodation"
  description: string    // What was bought: "Breakfast at Denny's"
  paidBy: UUID          // User ID who paid
  activityId: UUID      // Optional: Link to activity
}
```

### 2. **Expense Splits** - How the cost is divided

```typescript
ExpenseSplit {
  id: UUID
  expenseId: UUID       // Links to expense
  userId: UUID          // Person who owes this share
  amount: integer       // Their share in cents
}
```

### 3. **Balances** - Who owes whom

```
Alice paid $100 for dinner split 4 ways
├─ Alice paid: $100, owes: $25 → net: +$75 (owed money)
├─ Bob paid: $0, owes: $25 → net: -$25 (owes $25)
├─ Carol paid: $0, owes: $25 → net: -$25 (owes $25)
└─ Dave paid: $0, owes: $25 → net: -$25 (owes $25)

Settlement:
- Bob sends Alice $25
- Carol sends Alice $25
- Dave sends Alice $25
```

---

## API Endpoints

### Create Expense

**POST** `/api/expenses/create`

Create a new expense and automatically split it among people.

**Request:**

```json
{
  "eventId": "550e8400-e29b-41d4-a716-446655440000",
  "amount": 34.95,
  "category": "meal",
  "description": "Breakfast at Denny's",
  "paidBy": "user-id-alice",
  "splitAmong": ["user-id-alice", "user-id-bob", "user-id-carol"],
  "activityId": "optional-activity-id"
}
```

**Response:**

```json
{
  "success": true,
  "expense": {
    "id": "expense-12345",
    "amount": 34.95,
    "category": "meal",
    "splitPerPerson": 11.65,
    "splitAmong": ["alice", "bob", "carol"]
  }
}
```

---

### List Expenses

**GET** `/api/expenses/list?eventId=EVENT_ID`

Get all expenses for an event with split details.

**Response:**

```json
{
  "success": true,
  "total": 2,
  "totalAmount": 87.9,
  "expenses": [
    {
      "id": "exp-001",
      "amount": 34.95,
      "category": "meal",
      "description": "Breakfast at Denny's",
      "paidBy": "user-alice",
      "payerName": "Alice Smith",
      "splits": [
        {
          "userId": "user-alice",
          "amountDollars": "11.65"
        },
        {
          "userId": "user-bob",
          "amountDollars": "11.65"
        },
        {
          "userId": "user-carol",
          "amountDollars": "11.65"
        }
      ]
    }
  ]
}
```

---

### Get Balances & Settlements

**GET** `/api/expenses/balances?eventId=EVENT_ID`

Calculate who owes whom and settlement transactions needed.

**Response:**

```json
{
  "success": true,
  "balances": [
    {
      "userId": "user-alice",
      "name": "Alice Smith",
      "paidAmount": 100.0,
      "owesAmount": 25.0,
      "netBalance": 75.0
    },
    {
      "userId": "user-bob",
      "name": "Bob Jones",
      "paidAmount": 0.0,
      "owesAmount": 25.0,
      "netBalance": -25.0
    }
  ],
  "settlements": [
    {
      "from": "user-bob",
      "fromName": "Bob Jones",
      "to": "user-alice",
      "toName": "Alice Smith",
      "amount": 25.0
    }
  ],
  "summary": {
    "totalExpenses": 100.0,
    "settlementsNeeded": 1
  }
}
```

---

### Update Expense

**PUT** `/api/expenses/update`

Modify an expense amount, category, or split.

**Request:**

```json
{
  "expenseId": "expense-12345",
  "amount": 35.95,
  "category": "meal",
  "description": "Breakfast (with tip)",
  "splitAmong": ["alice", "bob", "carol", "dave"]
}
```

---

### Delete Expense

**DELETE** `/api/expenses/delete?expenseId=EXPENSE_ID`

Remove an expense and all its splits.

---

## Using Utilities in Code

### Track Individual User's Payment Status

```typescript
import { getUserBalance, getUserTotalPaid, getUserTotalOwes } from '../utils/expenses.ts';

// Check user's balance
const balance = await getUserBalance(userId);
if (balance > 0) {
  console.log(`User is owed $${balance}`);
} else {
  console.log(`User owes $${Math.abs(balance)}`);
}
```

### Calculate Event Summary

```typescript
import { calculateEventBalances, calculateSettlements } from '../utils/expenses.ts';

// Get all balances
const balances = await calculateEventBalances(eventId);
balances.forEach((balance) => {
  console.log(
    `${balance.name}: ${balance.netBalance > 0 ? 'owed' : 'owes'} $${Math.abs(balance.netBalance)}`
  );
});

// Get settlement plan
const settlements = await calculateSettlements(eventId);
settlements.forEach((settlement) => {
  console.log(`${settlement.fromName} sends $${settlement.amount} to ${settlement.toName}`);
});
```

### Check if Event is Settled

```typescript
import { areDebtsSettled } from '../utils/expenses.ts';

if (await areDebtsSettled(eventId)) {
  console.log('All debts are settled!');
} else {
  console.log('Pending settlements needed');
}
```

---

## Example Workflow

### Scenario: Trip with 3 people

**Day 1:**

```
Alice pays $49.95 for hotel (split 3 ways)
└─ Each person owes $16.65
```

**Day 2:**

```
Bob pays $34.95 for breakfast (split 3 ways)
└─ Each person owes $11.65
```

**Day 3:**

```
Carol pays $75.00 for rental car (split 3 ways)
└─ Each person owes $25.00
```

**Balances:**

```
Alice: Paid $49.95, Owes $27.65 → Net: +$22.30
Bob:   Paid $34.95, Owes $38.30 → Net: -$3.35
Carol: Paid $75.00, Owes $27.65 → Net: +$47.35
```

**Settlements:**

```
Bob sends Alice $3.35
Alice sends Carol $22.30 (Alice has leftover from what Bob owes her)
→ Actually: Bob sends Carol $3.35, Alice sends Carol $22.30
```

---

## Creating Expenses from UI

### Step 1: Create Expense

```typescript
import { formatDollars } from '../utils/expenses.ts';

const response = await fetch('/api/expenses/create', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    eventId,
    amount: 34.95,
    category: 'meal',
    description: 'Breakfast',
    paidBy: currentUserId,
    splitAmong: [userId1, userId2, userId3],
  }),
});
```

### Step 2: Display Balances

```typescript
const response = await fetch(`/api/expenses/balances?eventId=${eventId}`);
const { balances, settlements } = await response.json();

// Show each person's status
balances.forEach((balance) => {
  console.log(`${balance.name}: ${formatDollars(balance.netBalance)}`);
});

// Show who needs to pay whom
settlements.forEach((settlement) => {
  console.log(`${settlement.fromName} → ${settlement.toName}: ${formatDollars(settlement.amount)}`);
});
```

### Step 3: Handle Payments (Future)

```typescript
// When payment is made:
// 1. Record payment transaction
// 2. Update balances
// 3. Mark settlement as complete
```

---

## Data Accuracy

### Important Note on Monetary Values

**Storage Format:**

- `expenses.amount`: Stored as `decimal(10, 2)` - accurate to cents
- `expenseSplits.amount`: Stored in **cents** (integer) to avoid floating point errors

**Example:**

```
Breakfast $34.95 split 3 ways
= 3495 cents ÷ 3 = 1165 cents per person = $11.65

Not: 34.95 ÷ 3 = 11.649999... (floating point danger!)
```

---

## Testing the System

### Create Test Data

```bash
curl -X POST http://localhost:3000/api/expenses/create \
  -H "Content-Type: application/json" \
  -H "Cookie: sessionId=YOUR_SESSION" \
  -d '{
    "eventId": "550e8400-e29b-41d4-a716-446655440000",
    "amount": 34.95,
    "category": "meal",
    "description": "Breakfast at Denny'\''s",
    "paidBy": "USER_ID_ALICE",
    "splitAmong": ["USER_ID_ALICE", "USER_ID_BOB", "USER_ID_CAROL"]
  }'
```

### View Expenses

```bash
curl "http://localhost:3000/api/expenses/list?eventId=550e8400-e29b-41d4-a716-446655440000" \
  -H "Cookie: sessionId=YOUR_SESSION"
```

### Check Balances

```bash
curl "http://localhost:3000/api/expenses/balances?eventId=550e8400-e29b-41d4-a716-446655440000" \
  -H "Cookie: sessionId=YOUR_SESSION"
```

---

## Next Steps

1. ✅ **API Endpoints** - Created (create, list, update, delete, balances)
2. ✅ **Utilities** - Created (balance calculations, settlements)
3. 📋 **UI Pages** - To be built (expense form, balance display, settlement view)
4. 📋 **Payment Tracking** - To be added (record when payments are made)
5. 📋 **Notifications** - To be added (alert users of balances/settlements)

---

## Common Patterns

### Pattern: Show User Their Current Balance

```typescript
const balance = await getUserBalance(userId);
const message =
  balance > 0
    ? `You are owed ${formatDollars(balance)}`
    : `You owe ${formatDollars(Math.abs(balance))}`;
```

### Pattern: Validate Equal Split

```typescript
const splitAmong = groupMembers;
const perPersonAmount = expenseAmount / splitAmong.length;
if (perPersonAmount < 0.01) {
  return error('Split amount too small');
}
```

### Pattern: Handle Overpayment

```typescript
// If Alice paid $100 but only owes $50
// She's "owed money" that can be applied to future expenses
const netBalance = paid - owes;
if (netBalance > 0) {
  creditAccount(userId, netBalance);
}
```
