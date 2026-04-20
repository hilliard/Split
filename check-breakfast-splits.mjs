import { db } from './src/db/index.ts';
import { expenses, expenseSplits } from './src/db/schema.ts';
import { eq } from 'drizzle-orm';

try {
  // Get the Breakfast expense
  const breakfastExpense = await db
    .select()
    .from(expenses)
    .where(eq(expenses.description, 'Breakfast'));

  console.log('\n📋 Breakfast Expense(s):');
  if (breakfastExpense.length > 0) {
    breakfastExpense.forEach(exp => {
      console.log(`  ID: ${exp.id}`);
      console.log(`  Amount: ${exp.amount} cents = $${(exp.amount / 100).toFixed(2)}`);
      console.log(`  Tip: ${exp.tipAmount}`);
    });
  } else {
    console.log('  ❌ No Breakfast expense found');
  }

  // Get splits for Breakfast
  if (breakfastExpense.length > 0) {
    const splits = await db
      .select()
      .from(expenseSplits)
      .where(eq(expenseSplits.expenseId, breakfastExpense[0].id));

    console.log(`\n💔 Splits for Breakfast (${splits.length} total):`);
    splits.forEach(split => {
      console.log(`  User ${split.userId}: ${split.amount} cents = $${(split.amount / 100).toFixed(2)}`);
    });
  }

  process.exit(0);
} catch (error) {
  console.error('Error:', error);
  process.exit(1);
}
