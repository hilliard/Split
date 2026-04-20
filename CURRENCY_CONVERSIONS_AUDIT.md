# Currency Conversion Locations - Detailed Audit

## Summary counts

- **Direct `* 100` conversions**: 8 instances
- **Direct `/ 100` conversions**: 7+ instances
- **Manual `parseFloat()` + conversions**: 5+ instances
- **Using utility functions correctly**: 3 instances
- **Files needing fixes**: 4 main files + debugging scripts

---

## DETAILED FILE-BY-FILE BREAKDOWN

### 1️⃣ src/pages/api/expenses/create.ts

**STATUS**: MIXED - Partially correct, partially wrong

**Correct Usage:**

- Line 134: `const tipInCents = dollarsToCents(validatedData.tipAmount);` ✅
  - Uses utility to convert form input (dollars) to cents

**INCORRECT Usage:**

- Line 153: `tipAmount: validatedData.tipAmount.toString(),`
  - Stores the ORIGINAL DOLLAR VALUE as string instead of cents!
  - Should be: `tipAmount: tipInCents,`

**Context:**

```typescript
const tipInCents = dollarsToCents(validatedData.tipAmount); // Line 134 - correct
// ...
const insertValues = {
  amount: amountInCents, // Correct - in cents
  tipAmount: validatedData.tipAmount.toString(), // WRONG - stores dollars as string!
};
```

**Fix**: Change line 153 to store `tipInCents` instead

---

### 2️⃣ src/pages/api/expenses/update.ts

**STATUS**: INCORRECT - Multiple direct conversions

**Problem Areas:**

- Line 93: `updateData.tipAmount = validatedData.tipAmount;`
  - Comments say "store as decimal dollars"
  - Should convert to cents or change approach

- Line 112: `tipInCents = Math.round(validatedData.tipAmount * 100);` ❌
  - **Direct multiplication** instead of `dollarsToCents()`
  - Should be: `const tipInCents = dollarsToCents(validatedData.tipAmount);`

- Line 115: `tipInCents = Math.round(parseFloat(expense.tipAmount as any) * 100);` ❌
  - **Direct calculation** with manual conversion
  - Tries to convert a DECIMAL field (which is dollars) to cents
  - Should use `dollarsToCents(parseFloat(expense.tipAmount))` at minimum
  - Better: change schema so tipAmount is already in cents

**Context:**

```typescript
if (validatedData.tipAmount !== undefined)
  updateData.tipAmount = validatedData.tipAmount; // Line 93
// Later...
tipInCents = Math.round(validatedData.tipAmount * 100); // Line 112 - WRONG
// ...
tipInCents = Math.round(parseFloat(expense.tipAmount as any) * 100); // Line 115 - WRONG
```

**Fix**:

- Use `dollarsToCents()` utility instead of `Math.round()` and `* 100`
- OR change schema to store tipAmount as integer cents

---

### 3️⃣ src/pages/api/expenses/list.ts

**STATUS**: VERY INCORRECT - Multiple conversions in wrong order

**Problem Areas:**

- Line 84: `Math.round((expense.tipAmount as any) * 100)` ❌
- Line 85: `(expense.amount as any) + Math.round((expense.tipAmount as any) * 100)` ❌ (mixing)
- Line 86: `Math.round((expense.tipAmount as any) * 100)` ❌

```typescript
tip: parseFloat(centsToDollars(Math.round((expense.tipAmount as any) * 100))),
total: parseFloat(centsToDollars((expense.amount as any) + Math.round((expense.tipAmount as any) * 100))),
tipAmount: parseFloat(centsToDollars(Math.round((expense.tipAmount as any) * 100))),
```

**What's happening here:**

1. `expense.tipAmount` comes from DB as DECIMAL (dollars)
2. Multiply by 100: `expense.tipAmount * 100` (now cents)
3. Then call `centsToDollars()` which divides by 100 again!
4. This is doing `dollars → cents → dollars` - wasteful and confusing

**Correct approach:**

- Since tipAmount is already dollars in DB, just use `centsToDollars(expense.tipAmount)` directly
- OR store as cents in DB and use this pattern

---

### 4️⃣ src/pages/index.astro

**STATUS**: INCORRECT - Manual conversions

**Lines 49-52:**

```typescript
const tipDollars = parseFloat(exp.tipAmount as any) || 0;
const tipCents = Math.round(tipDollars * 100); // ← Direct conversion, not using utility!
const totalExpCents = amountCents + tipCents;
```

**Issue:**

- `parseFloat()` on tipAmount (which is decimal/dollars)
- Then `Math.round(...* 100)` to convert to cents
- Should use: `dollarsToCents(exp.tipAmount)` utility

**Current logic is:**

```typescript
exp.amount (INTEGER cents) + Math.round(parseFloat(exp.tipAmount) * 100)
```

**Should be:**

```typescript
exp.amount + dollarsToCents(exp.tipAmount);
```

---

## CURRENCY UTILITY FILE (Reference)

**Location**: src/utils/currency.ts

**Available Functions:**
✅ `dollarsToCents(dollars: number | string): number`
✅ `centsToDollars(cents: number | string): string`  
✅ `formatCentsAsDollars(cents: number): string`
✅ `parseUserInput(dollarInput: string): number`
✅ `calculateSplitPerPerson(totalCents: number, numPeople: number): number`
✅ `sumCents(...amounts: number[]): number`

**These should be used everywhere instead of manual `* 100` or `/ 100`**

---

## SCHEMA INCONSISTENCY

| Column in DB  | Current Type  | Stores                | Issue               |
| ------------- | ------------- | --------------------- | ------------------- |
| `amount`      | INTEGER       | Cents (e.g., 3345)    | ✅ Correct          |
| `tipAmount`   | DECIMAL(10,2) | Dollars (e.g., 33.45) | ❌ **INCONSISTENT** |
| `budgetCents` | INTEGER       | Cents                 | ✅ Correct          |

---

## MIGRATION NEEDED

To fix properly, we need:

1. **Drizzle schema change**: `tipAmount` from decimal to integer
2. **Database migration**: Convert existing tipAmount data (dollars → cents)
3. **Code updates**: All APIs and pages use utilities

---

## RECOMMENDED FIX ORDER

1. Create migration: `025-standardize-tip-amount-to-cents.sql`
   - Convert `tip_amount` from DECIMAL(10,2) to INTEGER
   - `ALTER TABLE expenses ALTER COLUMN tip_amount TYPE integer USING (CAST(tip_amount * 100 AS INTEGER))`

2. Update `src/db/schema.ts`
   - Change: `tipAmount: decimal('tip_amount', { precision: 10, scale: 2 })`
   - To: `tipAmount: integer('tip_amount')`

3. Fix **src/pages/api/expenses/create.ts** (Line 153)
   - Change: `tipAmount: validatedData.tipAmount.toString()`
   - To: `tipAmount: tipInCents,`

4. Fix **src/pages/api/expenses/update.ts** (Lines 93, 112, 115)
   - Replace all `* 100` with `dollarsToCents()`

5. Fix **src/pages/api/expenses/list.ts** (Lines 84-86)
   - Remove double conversions
   - Just use `centsToDollars(expense.tipAmount)` directly if already in cents

6. Fix **src/pages/index.astro** (Lines 49-52)
   - Use `dollarsToCents(exp.tipAmount)` instead of `Math.round(parseFloat() * 100)`

---

## VALIDATION COMMANDS

```bash
# Search for remaining manual conversions after fixes:
grep -r "* 100" src/ --include="*.ts" --include="*.astro" | grep -v ".mjs" | grep -v test
grep -r "/ 100" src/ --include="*.ts" --include="*.astro" | grep -v ".mjs" | grep -v test

# Should return: None (all removed)
```
