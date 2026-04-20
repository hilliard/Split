/**
 * Currency Conversion Utilities
 * 
 * CORE PRINCIPLE:
 * - Application stores all monetary values as CENTS (integers) in the database
 * - UI always displays and receives DOLLARS (with decimals)
 * - All conversions happen through these functions to prevent double-conversion bugs
 * 
 * Usage:
 * - Frontend form input (dollars) → dollarsToCents() → send to API
 * - API receives dollars, stores as cents using dollarsToCents()
 * - API retrieves cents from DB, displays with centsToDollars()
 * - Frontend receives dollars from API, displays directly
 */

/**
 * Convert dollars to cents for storage in database
 * @param dollars - Amount in dollars (e.g., 33.45)
 * @returns Amount in cents as integer (e.g., 3345)
 */
export function dollarsToCents(dollars: number | string): number {
  const dollarAmount = typeof dollars === 'string' ? parseFloat(dollars) : dollars;
  
  if (isNaN(dollarAmount)) {
    return 0;
  }
  
  // Round to nearest cent to avoid floating point issues
  return Math.round(dollarAmount * 100);
}

/**
 * Convert cents from database to dollars for display
 * @param cents - Amount in cents as integer (e.g., 3345)
 * @returns Amount in dollars as string with 2 decimals (e.g., "33.45")
 */
export function centsToDollars(cents: number | string): string {
  const centAmount = typeof cents === 'string' ? parseInt(cents) : cents;
  
  if (isNaN(centAmount)) {
    return "0.00";
  }
  
  return (centAmount / 100).toFixed(2);
}

/**
 * Format cents directly as a dollar string
 * @param cents - Amount in cents
 * @returns Formatted string like "$33.45"
 */
export function formatCentsAsDollars(cents: number): string {
  return `$${centsToDollars(cents)}`;
}

/**
 * Parse a dollar input and return cents
 * Typically used when processing form inputs
 * @param dollarInput - User input (e.g., "33.45" or "33")
 * @returns Amount in cents (e.g., 3345)
 */
export function parseUserInput(dollarInput: string): number {
  const cleaned = dollarInput.replace(/[$,]/g, '').trim();
  return dollarsToCents(cleaned);
}

/**
 * Validate that an amount in dollars is positive
 * @param dollars - Amount in dollars
 * @returns true if positive, false otherwise
 */
export function isValidAmount(dollars: number): boolean {
  return !isNaN(dollars) && dollars > 0;
}

/**
 * Calculate split amount per person
 * @param totalCents - Total amount in cents
 * @param numPeople - Number of people to split among
 * @returns Amount per person in cents (rounded down)
 */
export function calculateSplitPerPerson(totalCents: number, numPeople: number): number {
  if (numPeople <= 0) return 0;
  return Math.floor(totalCents / numPeople);
}

/**
 * Add multiple amounts in cents
 * @param amounts - Array of amounts in cents
 * @returns Sum in cents
 */
export function sumCents(...amounts: number[]): number {
  return amounts.reduce((sum, amount) => sum + (amount || 0), 0);
}
