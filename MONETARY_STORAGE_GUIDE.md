/\*\*

- MONETARY VALUE STORAGE - IMPLEMENTATION GUIDE
-
- Split uses the industry-standard approach: store all money as integers (cents),
- preventing floating-point rounding errors that plague financial applications.
-
- Based on best practices from Stripe, Shopify, and other fintech platforms.
  \*/

// ============================================================================
// 1. DATABASE SCHEMA - STORE AS CENTS (INTEGER)
// ============================================================================

/\*
✅ CORRECT - In schema.ts:
amount: integer('amount').notNull(), // Stored in cents (e.g., 5025 = $50.25)
tipAmount: integer('tip_amount').notNull(), // Stored in cents
budgetCents: integer('budget_cents'), // Already named to be explicit

❌ WRONG - Never do this:
amount: numeric('amount'), // Decimal = floating point error risk
amount: real('amount'), // Float = precision loss
tipAmount: numeric('tip_amount'), // Decimal stored = rounding errors
\*/

// ============================================================================
// 2. CONVERSION WORKFLOW - Always use utility functions
// ============================================================================

import { dollarsToCents, centsToDollars } from '@/utils/currency';

// INCOMING DATA (from frontend form):
// User enters: $50.25
// Send to API: { amount: 50.25 } ← still dollars!
// API converts: const cents = dollarsToCents(50.25) → 5025
// Store in DB: INSERT INTO expenses (amount) VALUES (5025)

// OUTGOING DATA (to frontend for display):
// Retrieve from DB: SELECT amount FROM expenses → 5025
// Convert: centsToDollars(5025) → "50.25"
// Send to frontend: { amount: "50.25" }
// Display: <p>${data.amount}</p> → $50.25

// ============================================================================
// 3. CALCULATION RULES - Only integer math
// ============================================================================

// ✅ CORRECT - Integer calculations in cents
function calculateTotal(items: Array<{ amount: number }>) {
const totalCents = items.reduce((sum, item) => sum + item.amount, 0);
return totalCents; // Still in cents!
// Display: centsToDollars(totalCents) → "$250.75"
}

// ✅ CORRECT - Split calculation in cents
function splitExpense(totalCents: number, peopleCount: number) {
const splitCents = Math.round(totalCents / peopleCount);
return splitCents; // Returns integer cents
}

// ❌ WRONG - Mixing dollars and cents
function wrongSplit(totalDollars: number, peopleCount: number) {
const perPerson = totalDollars / peopleCount; // $25.333333...
return perPerson; // Floating point error!
}

// ============================================================================
// 4. API ROUTES - Conversion boundary layer
// ============================================================================

// Example: POST /api/expenses/create
export async function createExpense(req) {
const body = await req.json();

// INPUT: { amount: 50.25, tipAmount: 2.50 } ← dollars from frontend
const amountCents = dollarsToCents(body.amount); // 5025
const tipCents = dollarsToCents(body.tipAmount); // 250

// STORE: Insert with cents
await db.insert(expenses).values({
amount: amountCents, // 5025 (cents)
tipAmount: tipCents, // 250 (cents)
});

// OUTPUT: Return formatted dollars for display
return {
amount: centsToDollars(amountCents), // "50.25"
tipAmount: centsToDollars(tipCents), // "2.50"
};
}

// ============================================================================
// 5. VALIDATION - Ensure consistency
// ============================================================================

// Check that incoming dollars are valid
export function validateDollarAmount(dollars: string | number): boolean {
const num = typeof dollars === 'string' ? parseFloat(dollars) : dollars;

// Allow max 2 decimal places
const cents = Math.round(num \* 100);
const reconstructed = cents / 100;

// Should match within rounding tolerance
return Math.abs(num - reconstructed) < 0.001;
}

// ============================================================================
// 6. TESTING - Verify conversions work correctly
// ============================================================================

// Test cases for all conversions
const testCases = [
{ dollars: 0.01, cents: 1 }, // 1 penny
{ dollars: 1.00, cents: 100 }, // 1 dollar
{ dollars: 19.99, cents: 1999 }, // No floating point errors!
{ dollars: 100.50, cents: 10050 }, // Large amount
{ dollars: 0.001, cents: 0 }, // Rounds down (sub-cent)
];

testCases.forEach(test => {
const converted = dollarsToCents(test.dollars);
console.assert(converted === test.cents,
`Failed: $${test.dollars} should be ${test.cents} cents, got ${converted}`);
});

// ============================================================================
// 7. COMMON MISTAKES TO AVOID
// ============================================================================

// ❌ MISTAKE 1: Forgetting to convert input
const mistake1 = await db.insert(expenses).values({
amount: 50.25 // This stores as integer 50, not 5025!
});

// ✅ FIX 1: Always convert
const fix1 = await db.insert(expenses).values({
amount: dollarsToCents(50.25) // Now stores 5025
});

// ❌ MISTAKE 2: Double conversion
const mistake2 = centsToDollars(dollarsToCents(50.25)); // String "50.25", then try to use as number

// ✅ FIX 2: Keep in cents for calculations
const totalCents = 5025 + 250 + 100; // 5375 cents
const display = centsToDollars(totalCents); // "53.75" only for UI

// ❌ MISTAKE 3: Storing dollars in database
const mistake3 = await db.insert(expenses).values({
tipAmount: 2.50 // Stored as 2 (integer truncation) or 2.50 (type mismatch)
});

// ✅ FIX 3: Always cents
const fix3 = await db.insert(expenses).values({
tipAmount: dollarsToCents(2.50) // 250 cents
});

// ============================================================================
// 8. DATA INTEGRITY CHECKS
// ============================================================================

// Run this periodically to verify data health:
export async function auditMonetaryData() {
const expenses = await db.select().from(expensesTable);

let issues = 0;
expenses.forEach(expense => {
// Amounts should be reasonable integers
if (expense.amount % 1 !== 0) {
console.warn(`❌ Non-integer amount: ${expense.amount}`);
issues++;
}

    // Check for suspiciously large values (likely stored as dollars)
    if (expense.amount > 10000000) {  // > $100,000
      console.warn(`⚠️  Suspiciously large amount: ${expense.amount} cents = $${(expense.amount/100).toFixed(2)}`);
      issues++;
    }

    // Amounts should be positive
    if (expense.amount < 0) {
      console.warn(`❌ Negative amount: ${expense.amount}`);
      issues++;
    }

});

return { totalExpenses: expenses.length, issues };
}

// ============================================================================
// 9. FUTURE-PROOFING: Micro-units (advanced)
// ============================================================================

// If you need sub-cent precision (rare), store in micro-units:
// 1 cent = 100 micro-units
// So $50.25 = 502500 micro-units
// This allows for 0.01 cent precision if needed

export function dollarToMicroUnits(dollars: number): number {
return Math.round(dollars \* 100000);
}

export function microUnitsToDollars(microUnits: number): string {
return (microUnits / 100000).toFixed(5); // Up to 5 decimals
}

// ============================================================================
// 10. DOCUMENTATION FOR SCHEMA
// ============================================================================

/\*
In schema.ts, always comment the unit:

export const expenses = pgTable('expenses', {
id: uuid('id').primaryKey().defaultRandom(),
eventId: uuid('event_id'),

// All monetary amounts stored in CENTS to avoid floating-point errors
// $50.25 = 5025 cents
// Convert from cents using: centsToDollars(cents)
// Convert to cents using: dollarsToCents(dollars)
amount: integer('amount').notNull(),

tipAmount: integer('tip_amount').notNull().default(0),

// ... rest of fields ...
});
\*/
