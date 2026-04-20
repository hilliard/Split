# Quick Reference: All Currency Conversions Found

## All `* 100` Multiplications (converting dollars to cents)

```
src/pages/api/expenses/update.ts:112
  tipInCents = Math.round(validatedData.tipAmount * 100);

src/pages/api/expenses/update.ts:115
  tipInCents = Math.round(parseFloat(expense.tipAmount as any) * 100);

src/pages/api/expenses/list.ts:84
  Math.round((expense.tipAmount as any) * 100)

src/pages/api/expenses/list.ts:85
  Math.round((expense.tipAmount as any) * 100)

src/pages/api/expenses/list.ts:86
  Math.round((expense.tipAmount as any) * 100)

src/pages/index.astro:51
  const tipCents = Math.round(tipDollars * 100);
```

## All `/ 100` Divisions (converting cents to dollars)

```
src/pages/api/expenses/list.ts:84
  centsToDollars(Math.round((expense.tipAmount as any) * 100))
  ↑ Problem: Does * 100 then / 100 (double conversion!)

debug-all-expenses.mjs:14
  const amount = exp.amount / 100; (debugging - acceptable)

debug-trip-totals.mjs:14
  Math.round((exp.tipAmount || 0) * 100) (debugging - acceptable)
```

## Using Utilities Correctly (Good Examples)

✅ src/pages/api/expenses/create.ts:134

```typescript
const tipInCents = dollarsToCents(validatedData.tipAmount);
```

✅ src/utils/currency.ts

```typescript
export function dollarsToCents(dollars: number | string): number {
  return Math.round(dollars * 100);
}

export function centsToDollars(cents: number | string): string {
  return (cents / 100).toFixed(2);
}
```

---

## Summary Statistics

| Metric                          | Count | Status                           |
| ------------------------------- | ----- | -------------------------------- |
| Files with direct `* 100`       | 3     | ❌ Should use `dollarsToCents()` |
| Files with direct `/ 100`       | 2     | ❌ Should use `centsToDollars()` |
| Direct multiplication instances | 8     | ❌ Fix                           |
| Direct division instances       | 7+    | ❌ Fix                           |
| parseFloat() + conversions      | 5+    | ❌ Fix                           |
| Using utilities correctly       | 1     | ✅ Good                          |
| Test/debug files (acceptable)   | 5+    | ⚠️ Not priority                  |

---

## Current DB Schema Problem

```typescript
// In src/db/schema.ts, line 123-124:

amount: integer('amount').notNull(),           // ✅ CORRECT: Stored as cents
tipAmount: decimal('tip_amount', { precision: 10, scale: 2 })  // ❌ WRONG: Stored as dollars
```

### This inconsistency causes:

- 8 places doing `* 100` conversions
- Confusing code: sometimes 'amount' needs no conversion (it's cents), sometimes 'tipAmount' needs `* 100`
- Data integrity issues: developers might forget which unit applies where
- Floating-point rounding errors with decimal storage

---

## What Needs to Change

### To achieve "all dollars in database at one base":

1. **Change schema**: tipAmount from `DECIMAL(10,2)` → `INTEGER`
   - Both `amount` and `tipAmount` now stored as cents

2. **Create migration**: Convert existing data

   ```sql
   ALTER TABLE expenses ALTER COLUMN tip_amount TYPE integer
   USING (CAST(tip_amount * 100 AS INTEGER));
   ```

3. **Update code to use utilities**:
   - Replace `* 100` → use `dollarsToCents()`
   - Replace `/ 100` → use `centsToDollars()`
   - Remove parseFloat conversions

4. **Result**:
   - ✅ Database: All amounts in cents (integers)
   - ✅ Utilities: Handle conversions in one place
   - ✅ API: Takes dollars, sends dollars (utilities handle conversion)
   - ✅ UI: Displays dollars (utilities handle conversion)
   - ✅ No magic numbers: No more `* 100` or `/ 100` in business logic

---

## Files to Review/Fix

### PRIORITY: Production Code

1. `src/db/schema.ts` - Schema definition
2. `src/pages/api/expenses/create.ts` - Form submission
3. `src/pages/api/expenses/update.ts` - Edit expense
4. `src/pages/api/expenses/list.ts` - List expenses
5. `src/pages/index.astro` - Dashboard display

### SECONDARY: Diagnostic (can leave as-is initially)

- check-breakfast-splits.mjs
- debug-all-expenses.mjs
- debug-trip-totals.mjs
- fix-corrupted-tips.mjs
- etc. (these are dev tools, not production)
