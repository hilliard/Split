# Expense & Payment API Quick Reference

## File Structure

```
src/
├── pages/api/expenses/
│   ├── create.ts          # POST - Add new expense
│   ├── list.ts            # GET - Fetch all expenses for event
│   ├── update.ts          # PUT - Modify expense
│   ├── delete.ts          # DELETE - Remove expense
│   └── balances.ts        # GET - Calculate who owes whom
├── utils/
│   └── expenses.ts        # Utility functions
└── db/
    └── schema.ts          # Tables: expenses, expenseSplits
```

---

## API Endpoints Summary

| Method | Endpoint                           | Purpose                 | Auth     | Returns                    |
| ------ | ---------------------------------- | ----------------------- | -------- | -------------------------- |
| POST   | `/api/expenses/create`             | Create expense & splits | Required | New expense ID             |
| GET    | `/api/expenses/list?eventId=X`     | List all expenses       | Required | All expenses with splits   |
| PUT    | `/api/expenses/update`             | Modify expense          | Required | Success message            |
| DELETE | `/api/expenses/delete?expenseId=X` | Remove expense          | Required | Success message            |
| GET    | `/api/expenses/balances?eventId=X` | Calculate settlements   | Required | Balances & settlement plan |

---

## Real-World Example: Trip to Colorado

### Setup: 4 friends on a trip

- Alice (organizer, event creator)
- Bob
- Carol
- Dave

### Activity 1: Breakfast

```bash
curl -X POST http://localhost:3000/api/expenses/create \
  -H "Content-Type: application/json" \
  -H "Cookie: sessionId=abc123" \
  -d '{
    "eventId": "trip-colorado-2026",
    "amount": 33.96,
    "category": "meal",
    "description": "Breakfast at The Sink",
    "paidBy": "alice-id",
    "splitAmong": ["alice-id", "bob-id", "carol-id", "dave-id"]
  }'
```

**Result:** Each person owes $8.49

---

### Activity 2: Gas

```bash
curl -X POST http://localhost:3000/api/expenses/create \
  -H "Content-Type: application/json" \
  -H "Cookie: sessionId=abc123" \
  -d '{
    "eventId": "trip-colorado-2026",
    "amount": 52.00,
    "category": "transport",
    "description": "Gas for rental car",
    "paidBy": "bob-id",
    "splitAmong": ["alice-id", "bob-id", "carol-id", "dave-id"]
  }'
```

**Result:** Each person owes $13.00

---

### Activity 3: Hotel

```bash
curl -X POST http://localhost:3000/api/expenses/create \
  -H "Content-Type: application/json" \
  -H "Cookie: sessionId=abc123" \
  -d '{
    "eventId": "trip-colorado-2026",
    "amount": 400.00,
    "category": "accommodation",
    "description": "2 nights at Mountain View Hotel",
    "paidBy": "carol-id",
    "splitAmong": ["alice-id", "bob-id", "carol-id", "dave-id"]
  }'
```

**Result:** Each person owes $100.00

---

### View Expenses

```bash
curl "http://localhost:3000/api/expenses/list?eventId=trip-colorado-2026" \
  -H "Cookie: sessionId=abc123"
```

**Response:**

```json
{
  "success": true,
  "total": 3,
  "totalAmount": 485.96,
  "expenses": [
    {
      "id": "exp-001",
      "amount": 33.96,
      "category": "meal",
      "description": "Breakfast at The Sink",
      "paidBy": "alice-id",
      "payerName": "Alice Smith",
      "splits": [
        { "userId": "alice-id", "amountDollars": "8.49" },
        { "userId": "bob-id", "amountDollars": "8.49" },
        { "userId": "carol-id", "amountDollars": "8.49" },
        { "userId": "dave-id", "amountDollars": "8.49" }
      ]
    },
    {
      "id": "exp-002",
      "amount": 52.0,
      "category": "transport",
      "description": "Gas for rental car",
      "paidBy": "bob-id",
      "payerName": "Bob Jones",
      "splits": [
        { "userId": "alice-id", "amountDollars": "13.00" },
        { "userId": "bob-id", "amountDollars": "13.00" },
        { "userId": "carol-id", "amountDollars": "13.00" },
        { "userId": "dave-id", "amountDollars": "13.00" }
      ]
    },
    {
      "id": "exp-003",
      "amount": 400.0,
      "category": "accommodation",
      "description": "2 nights at Mountain View Hotel",
      "paidBy": "carol-id",
      "payerName": "Carol White",
      "splits": [
        { "userId": "alice-id", "amountDollars": "100.00" },
        { "userId": "bob-id", "amountDollars": "100.00" },
        { "userId": "carol-id", "amountDollars": "100.00" },
        { "userId": "dave-id", "amountDollars": "100.00" }
      ]
    }
  ]
}
```

---

### Calculate Balances

```bash
curl "http://localhost:3000/api/expenses/balances?eventId=trip-colorado-2026" \
  -H "Cookie: sessionId=abc123"
```

**Response:**

```json
{
  "success": true,
  "balances": [
    {
      "userId": "carol-id",
      "name": "Carol White",
      "paidAmount": 400.0,
      "owesAmount": 121.49,
      "netBalance": 278.51
    },
    {
      "userId": "alice-id",
      "name": "Alice Smith",
      "paidAmount": 33.96,
      "owesAmount": 121.49,
      "netBalance": -87.53
    },
    {
      "userId": "bob-id",
      "name": "Bob Jones",
      "paidAmount": 52.0,
      "owesAmount": 121.49,
      "netBalance": -69.49
    },
    {
      "userId": "dave-id",
      "name": "Dave Brown",
      "paidAmount": 0.0,
      "owesAmount": 121.49,
      "netBalance": -121.49
    }
  ],
  "settlements": [
    {
      "from": "dave-id",
      "fromName": "Dave Brown",
      "to": "carol-id",
      "toName": "Carol White",
      "amount": 121.49
    },
    {
      "from": "bob-id",
      "fromName": "Bob Jones",
      "to": "carol-id",
      "toName": "Carol White",
      "amount": 69.49
    },
    {
      "from": "alice-id",
      "fromName": "Alice Smith",
      "to": "carol-id",
      "toName": "Carol White",
      "amount": 87.53
    }
  ],
  "summary": {
    "totalExpenses": 485.96,
    "settlementsNeeded": 3
  }
}
```

---

## Utilities Examples

### Get User's Balance

```typescript
import { getUserBalance, formatDollars } from '../utils/expenses.ts';

const balance = await getUserBalance('alice-id');
console.log(`Alice: ${formatDollars(balance)}`);
// Output: Alice: -$87.53 (owes money)
```

### Check All Debts Settled

```typescript
import { areDebtsSettled } from '../utils/expenses.ts';

const settled = await areDebtsSettled('trip-colorado-2026');
if (settled) {
  console.log('✅ Trip is all settled up!');
} else {
  console.log('⚠️ Pending payments needed');
}
```

### Get Settlement Plan

```typescript
import { calculateSettlements, formatDollars } from '../utils/expenses.ts';

const plan = await calculateSettlements('trip-colorado-2026');
plan.forEach((settlement) => {
  console.log(`${settlement.fromName} → ${settlement.toName}: ${formatDollars(settlement.amount)}`);
});
```

---

## Modifying Expenses

### Change Breakfast Cost (tip added)

```bash
curl -X PUT http://localhost:3000/api/expenses/update \
  -H "Content-Type: application/json" \
  -H "Cookie: sessionId=abc123" \
  -d '{
    "expenseId": "exp-001",
    "amount": 38.00,
    "description": "Breakfast at The Sink (with tip)"
  }'
```

### Change Gas Split (exclude one person)

```bash
curl -X PUT http://localhost:3000/api/expenses/update \
  -H "Content-Type: application/json" \
  -H "Cookie: sessionId=abc123" \
  -d '{
    "expenseId": "exp-002",
    "splitAmong": ["alice-id", "bob-id", "carol-id"]
  }'
```

---

## Deleting Expenses

```bash
curl -X DELETE "http://localhost:3000/api/expenses/delete?expenseId=exp-001" \
  -H "Cookie: sessionId=abc123"
```

---

## Testing Checklist

- [ ] Create expense with 2 people
- [ ] Create expense with 4 people
- [ ] List expenses for event
- [ ] Check balances show correct amounts
- [ ] Update expense amount
- [ ] Update split recipients
- [ ] Delete expense and verify splits removed
- [ ] Verify balances recalculated after delete
- [ ] Test with different exchange rates (if international)
- [ ] Test rounding (e.g., $10 ÷ 3 = $3.33 each)

---

## Key Implementation Details

### Currency Handling

- `expenses.amount`: Stored as `decimal(10, 2)` (accurate)
- `expenseSplits.amount`: Stored as `integer` (cents, no float errors)
- All calculations done in cents, converted to dollars for display

### Authorization

- Only **event creator** can add/modify expenses
- Users can see expenses for events they participate in
- Future: Group admins can also manage expenses

### Calculation Algorithm

- Greedy algorithm for settlements (minimize transaction count)
- Rounds settlement amounts to nearest cent
- Filters out settlements < $0.01 (rounding artifacts)

---

## Common Issues & Solutions

### Issue: Uneven Split

**Problem:** $10 ÷ 3 people = $3.33 each, but 3 × $3.33 = $9.99

**Solution:** Store in cents (1000 ÷ 3 = 333, 333, 334 = 1000 ✓)

### Issue: Circular Debts

**Problem:** Alice → Bob → Carol → Alice (circular)

**Solution:** Settlement algorithm optimizes to minimize transactions

### Issue: User Paid More Than Their Share

**Problem:** Alice paid $100 for meal, only owed $50

**Solution:** `netBalance = 50` (Alice is owed $50 for future expenses)

---

## Future Enhancements

1. **Payment Tracking** - Record when settlements are made
2. **Recurring Expenses** - Monthly rent/utilities
3. **Partial Splits** - Custom percentages (80/20 not just equal)
4. **Categories** - Dashboard breakdown by expense type
5. **Notifications** - Alert users of pending payments
6. **Venmo/PayPal Integration** - Send payment links
7. **Tax Export** - Generate reports for tax/accounting
8. **Currency Conversion** - Multi-currency support
