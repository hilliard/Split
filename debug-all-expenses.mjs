import { db } from './src/db/index.ts';
import { events, expenses } from './src/db/schema.ts';

console.log('🔍 Debugging total expenses calculation...\n');

try {
  const allExpenses = await db.select().from(expenses);
  
  console.log(`Total expenses in DB: ${allExpenses.length}\n`);
  
  let grandTotal = 0;
  
  allExpenses.forEach((exp) => {
    const amount = exp.amount / 100; // Convert from cents to dollars
    const tip = parseFloat(exp.tipAmount) || 0;
    const total = amount + tip;
    grandTotal += total;
    console.log(`${exp.description}: $${amount.toFixed(2)} + $${tip.toFixed(2)} tip = $${total.toFixed(2)}`);
  });
  
  console.log(`\n💰 GRAND TOTAL: $${grandTotal.toFixed(2)}`);
  
} catch (error) {
  console.error('❌ Error:', error);
  process.exit(1);
}
