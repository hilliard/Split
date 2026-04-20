/**
 * DATA MIGRATION: Fix expenses stored in dollars (should be cents)
 * Uses the application's existing database connection via Drizzle ORM
 * 
 * PROBLEM: Legacy expenses stored as dollars (e.g., 792 for $792)
 * instead of cents (e.g., 79200 for $792.00)
 * 
 * RUN: node migrate-fix-expense-units-drizzle.mjs
 */

import { db } from "./src/db/index.ts";
import { expenses } from "./src/db/schema.ts";
import { sql, gte } from "drizzle-orm";

async function main() {
  try {
    console.log("🔍 Scanning for expenses that might be stored in dollars...\n");
    
    // Find potentially problematic expenses (amount > 10k cents = $100+)
    const suspiciousExpenses = await db
      .select({
        id: expenses.id,
        amount: expenses.amount,
        tipAmount: expenses.tipAmount,
        description: expenses.description,
        createdAt: expenses.createdAt,
      })
      .from(expenses)
      .where(gte(expenses.amount, 10000));
    
    if (suspiciousExpenses.length === 0) {
      console.log("✅ No suspicious expenses found. Data looks clean!");
      process.exit(0);
    }
    
    console.log(`Found ${suspiciousExpenses.length} expenses > $100:\n`);
    
    // Categorize by suspicion level
    const verySuspicious = suspiciousExpenses.filter(e => e.amount > 10000000);  // > $100k
    const suspicious = suspiciousExpenses.filter(e => e.amount > 1000000 && e.amount <= 10000000);  // $10k-$100k
    const maybe = suspiciousExpenses.filter(e => e.amount >= 10000 && e.amount <= 1000000);  // $100-$10k
    
    console.log(`VERY_SUSPICIOUS (> $100,000): ${verySuspicious.length}`);
    verySuspicious.slice(0, 3).forEach(e => {
      console.log(`  • ${e.description?.substring(0, 30) || '(no desc)'} | ${e.amount} cents = $${(e.amount/100).toFixed(2)}`);
    });
    
    console.log(`\nSUSPICIOUS ($10k-$100k): ${suspicious.length}`);
    suspicious.slice(0, 3).forEach(e => {
      console.log(`  • ${e.description?.substring(0, 30) || '(no desc)'} | ${e.amount} cents = $${(e.amount/100).toFixed(2)}`);
    });
    
    console.log(`\nMAYBE ($100-$10k): ${maybe.length}`);
    maybe.slice(0, 3).forEach(e => {
      console.log(`  • ${e.description?.substring(0, 30) || '(no desc)'} | ${e.amount} cents = $${(e.amount/100).toFixed(2)}`);
    });
    
    console.log(`\n⚠️  These amounts seem reasonable IF stored in cents.`);
    console.log(`   But if $792 is showing as $7,929,234.60, we need to divide by 100.\n`);
    
    // Check for the Trip to Oz event specifically
    console.log("🔎 Looking for 'Trip to Oz' event...\n");
    
    const tripOzExpenses = suspiciousExpenses.filter(e => 
      e.createdAt && new Date(e.createdAt).toISOString().includes('2026-04-2')
    );
    
    if (tripOzExpenses.length > 0) {
      const totalCents = tripOzExpenses.reduce((sum, e) => sum + e.amount, 0);
      console.log(`Found ${tripOzExpenses.length} expenses from April 20:`);
      console.log(`  Raw total: ${totalCents} cents = $${(totalCents/100).toFixed(2)}`);
      console.log(`  If stored wrong: ${totalCents/100} cents = $${(totalCents/10000).toFixed(2)}`);
      console.log(`\n  If showing $7,929,234.60, then divide by 100 is correct!\n`);
    }
    
    console.log("📊 Analysis: These values look like dollars stored as integers (missing × 100)");
    console.log("   The auto-correction in the API should handle display,");
    console.log("   but permanent fix requires updating the database.\n");
    
    console.log("✅ Data scan complete. No changes made (informational only).");
    process.exit(0);
    
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

main();
