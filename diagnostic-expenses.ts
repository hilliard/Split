/**
 * Diagnostic: Check expense data format
 * Shows raw amounts and what they'd be if corrected
 */

import { db } from "./src/db/index.ts";
import { events, expenses } from "./src/db/schema.ts";
import { eq, desc, gte } from "drizzle-orm";

async function diagnose() {
  try {
    console.log("🔍 DIAGNOSTIC: Checking expense storage format...\n");
    
    // Get Trip to Oz event and its expenses
    const tripOz = await db
      .select()
      .from(events)
      .where(eq(events.title, "Trip to Oz"))
      .limit(1);
    
    if (tripOz.length === 0) {
      console.log("ℹ️  'Trip to Oz' event not found.");
      
      // Show first event instead
      const [firstEvent] = await db.select().from(events).orderBy(desc(events.createdAt)).limit(1);
      if (firstEvent) {
        console.log(`Showing first event instead: ${firstEvent.title}\n`);
        await showExpensesForEvent(firstEvent.id);
      }
    } else {
      console.log(`Found 'Trip to Oz' event\n`);
      await showExpensesForEvent(tripOz[0].id);
    }
    
  } catch (error) {
    console.error("Error:", error);
  } finally {
    process.exit(0);
  }
}

async function showExpensesForEvent(eventId: string) {
  const eventExpenses = await db
    .select()
    .from(expenses)
    .where(eq(expenses.eventId, eventId));
  
  if (eventExpenses.length === 0) {
    console.log("No expenses found.");
    return;
  }
  
  console.log(`Total expenses: ${eventExpenses.length}\n`);
  console.log("Amount | As-Stored Dollars | If-Fixed Dollars | Description");
  console.log("--- | --- | --- | ---");
  
  let totalRaw = 0;
  let totalIfFixed = 0;
  
  eventExpenses.forEach(exp => {
    const asStoredDollars = (exp.amount / 100).toFixed(2);
    const ifFixedDollars = (exp.amount / 10000).toFixed(2);
    totalRaw += exp.amount;
    totalIfFixed += Math.round(exp.amount / 100);
    
    console.log(
      `${exp.amount} | $${asStoredDollars} | $${ifFixedDollars} | ${exp.description?.substring(0, 30) || '(empty)'}`
    );
  });
  
  console.log("\n=== TOTALS ===");
  console.log(`Raw Sum: ${totalRaw} cents`);
  console.log(`  = $${(totalRaw / 100).toFixed(2)} (treating raw as dollars)`);
  console.log(`  = $${(totalRaw / 10000).toFixed(2)} (if actually cents)\n`);
  
  console.log("📊 ANALYSIS:");
  if (totalRaw > 10000000) {
    console.log(`✅ Amounts > $100,000 - likely STORED IN DOLLARS`);
    console.log(`   Dashboard auto-correction divides by 100`);
    console.log(`   Fix: SQL UPDATE to multiply by 100\n`);
  } else {
    console.log(`✅ Amounts look normal - likely already in cents`);
    console.log(`   No correction needed\n`);
  }
}

diagnose();
