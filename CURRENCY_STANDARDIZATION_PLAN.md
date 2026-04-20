# Currency Storage Standardization Plan

## Current Problem

The database has **inconsistent currency storage**:

| Column               | Current Storage            | Issue                                        |
| -------------------- | -------------------------- | -------------------------------------------- |
| `expenses.amount`    | INTEGER (cents) ✅         | Correct - stored as integer cents            |
| `expenses.tipAmount` | DECIMAL(10,2) (dollars) ❌ | **INCONSISTENT** - mixing cents with dollars |
| Other amounts        | Various                    | Mixed implementations                        |

## Root Cause

- `amount` uses cents (e.g., 3345 = $33.45)
- `tipAmount` uses dollars (e.g., 3.45 = $3.45)
- This forces **manual conversions throughout the codebase**: `* 100`, `/ 100`, `parseFloat`, `Math.round()`
- Creates fragile code prone to rounding errors

## Files with Direct Conversions (×100 or ÷100)

### API Routes

1. **src/pages/api/expenses/create.ts** (Lines 134, 153)
   - Converts `tipAmount` from dollars to cents: `dollarsToCents(validatedData.tipAmount)`
   - But stores as string: `tipAmount: validatedData.tipAmount.toString()`
   - **Issue**: Storing dollars as string, then later parsing as decimal

2. **src/pages/api/expenses/update.ts** (Lines 93, 112, 115)
   - Line 112: `tipInCents = Math.round(validatedData.tipAmount * 100)`
   - Line 115: `tipInCents = Math.round(parseFloat(expense.tipAmount as any) * 100)`
   - **Issue**: Manual `* 100` conversions instead of using utility

3. **src/pages/api/expenses/list.ts** (Lines 84-86)
   - Line 84: `Math.round((expense.tipAmount as any) * 100)`
   - Line 85: `(expense.amount as any) + Math.round((expense.tipAmount as any) * 100)`
   - Line 86: `Math.round((expense.tipAmount as any) * 100)`
   - **Issue**: Direct `* 100` conversions, then converting back with `centsToDollars()`

### Pages/Components

4. **src/pages/index.astro** (Lines 49-52)
   ```typescript
   const tipDollars = parseFloat(exp.tipAmount as any) || 0;
   const tipCents = Math.round(tipDollars * 100); // Manual conversion
   const totalExpCents = amountCents + tipCents;
   ```

   - **Issue**: Manually doing `* 100` instead of using utility functions

### Debug/Test Files (acceptable - these are diagnostic)

- check-breakfast-splits.mjs, debug-trip-totals.mjs, fix-corrupted-tips.mjs
- These do conversions for display but aren't production code

## Solution: Standardize to Cents Base

### Step 1: Update Database Schema

Change `tipAmount` from DECIMAL(10,2) to INTEGER (cents):

```sql
ALTER TABLE expenses
  ALTER COLUMN tip_amount TYPE integer USING (CAST(CAST(tip_amount AS NUMERIC) * 100 AS INTEGER));
```

### Step 2: Update Drizzle Schema

Change field type in schema.ts:

```typescript
tipAmount: integer('tip_amount').notNull().default(0), // In cents (e.g., 345 = $3.45)
```

### Step 3: Use Existing Currency Utils Consistently

Replace **all** manual conversions with utility functions:

- Form input (dollars) → `dollarsToCents()` → API
- API stores result directly as integer
- API retrieves integer → `centsToDollars()` → display
- UI receives dollars string → displays directly

### Step 4: Remove Manual Conversions

Search and replace all instances of:

- `* 100` with `dollarsToCents()`
- `/ 100` with `centsToDollars()`
- `parseFloat(...) * 100` with `dollarsToCents(parseFloat(...))`

## Benefits

✅ Single source of truth - all amounts in cents (integers)
✅ No floating-point arithmetic errors
✅ Cleaner, more maintainable code
✅ Consistent across all monetary fields
✅ Reuse existing currency utility functions
✅ Type-safe through Drizzle schema

## Files to Update (in order)

1. **src/db/schema.ts** - Change tipAmount type
2. **migrations/** - Create migration to convert data
3. **src/pages/api/expenses/create.ts** - Use utilities
4. **src/pages/api/expenses/update.ts** - Use utilities
5. **src/pages/api/expenses/list.ts** - Use utilities
6. **src/pages/index.astro** - Use utilities
7. **Any other .astro/.ts files** - Use utilities

## Validation Checklist

- [ ] tipAmount in schema changed to integer
- [ ] Migration created and tested
- [ ] All `* 100` replacements done
- [ ] All `/ 100` replaced with `centsToDollars()`
- [ ] No raw numeric conversions in business logic
- [ ] All conversions go through currency.ts utilities
- [ ] Unit tests pass
- [ ] Manual testing with forms
