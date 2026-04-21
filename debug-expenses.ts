import { db } from "./src/db/index.ts";
import { events, expenses } from "./src/db/schema.ts";
import { sum, eq } from "drizzle-orm";

try {
  // Get a sample event
  const [firstEvent] = await db.select().from(events).limit(1);
  
  if (!firstEvent) {
    console.log("No events found");
    process.exit(0);
  }
  
  console.log(`Checking event: ${firstEvent.title} (${firstEvent.id})\n`);
  
  // Get all expenses for this event with details
  const eventExpenses = await db
    .select()
    .from(expenses)
    .where(eq(expenses.eventId, firstEvent.id));
    
  console.log(`Found ${eventExpenses.length} expenses:\n`);
  eventExpenses.forEach((exp, i) => {
    console.log(`  ${i + 1}. amount=${exp.amount} cents ($${(exp.amount / 100).toFixed(2)}), tip=${exp.tipAmount} cents ($${(exp.tipAmount / 100).toFixed(2)})`);
  });
  
  // Get the aggregates
  const [aggData] = await db
    .select({
      totalAmount: sum(expenses.amount),
      totalTip: sum(expenses.tipAmount),
    })
    .from(expenses)
    .where(eq(expenses.eventId, firstEvent.id));
    
  console.log(`\nAggregate results:`);
  console.log(`  totalAmount (raw): ${aggData?.totalAmount}`);
  console.log(`  totalTip (raw): ${aggData?.totalTip}`);
  console.log(`  Total in cents: ${Number(aggData?.totalAmount || 0) + Number(aggData?.totalTip || 0)}`);
  console.log(`  Total in dollars: $${((Number(aggData?.totalAmount || 0) + Number(aggData?.totalTip || 0)) / 100).toFixed(2)}`);
  
  process.exit(0);
} catch (error) {
  console.error("Error:", error);
  process.exit(1);
}
