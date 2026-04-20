import { db } from './src/db/index.ts';
import { events, expenses } from './src/db/schema.ts';
import { eq, desc } from 'drizzle-orm';

const recentEvents = await db.select().from(events).orderBy(desc(events.createdAt)).limit(5);

for (const event of recentEvents) {
  const eventExpenses = await db.select().from(expenses).where(eq(expenses.eventId, event.id));
  
  const totalAmount = eventExpenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
  const totalTips = eventExpenses.reduce((sum, exp) => {
    const tipCents = typeof exp.tipAmount === 'string' 
      ? Math.round(parseFloat(exp.tipAmount) * 100)
      : Math.round((exp.tipAmount || 0) * 100);
    return sum + tipCents;
  }, 0);
  
  const totalCents = totalAmount + totalTips;
  const totalDollars = (totalCents / 100).toFixed(2);
  
  console.log(`\n${event.title} (${event.id})`);
  console.log(`  Expenses: ${eventExpenses.length}`);
  console.log(`  Amount in DB: ${totalAmount} cents = $${(totalAmount / 100).toFixed(2)}`);
  console.log(`  Tips in DB: ${totalTips} cents = $${(totalTips / 100).toFixed(2)}`);
  console.log(`  Total: $${totalDollars}`);
  
  eventExpenses.forEach((exp, i) => {
    const tip = typeof exp.tipAmount === 'string' 
      ? parseFloat(exp.tipAmount)
      : (exp.tipAmount || 0);
    console.log(`    ${i+1}. $${(exp.amount / 100).toFixed(2)} + $${tip.toFixed(2)} tip = $${((exp.amount / 100) + tip).toFixed(2)} - ${exp.description}`);
  });
}
