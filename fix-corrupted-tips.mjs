import { db } from './src/db/index.ts';
import { expenses } from './src/db/schema.ts';
import { sql } from 'drizzle-orm';

console.log('🔧 Starting tip amount fix...\n');

try {
  // Get all expenses with non-zero tips
  const allExpenses = await db.select().from(expenses);

  const corruptedExpenses = allExpenses.filter((e) => {
    const tip = parseFloat(e.tipAmount);
    return tip > 100; // Tips > $100 are likely corrupted (storing cents as dollars)
  });

  console.log(`Found ${corruptedExpenses.length} potentially corrupted expenses:\n`);

  corruptedExpenses.forEach((exp) => {
    const currentTip = parseFloat(exp.tipAmount);
    const fixedTip = currentTip / 100;
    console.log(`  ID: ${exp.id}`);
    console.log(`    Current tip: $${currentTip.toFixed(2)}`);
    console.log(`    Fixed tip:   $${fixedTip.toFixed(2)}`);
    console.log(`    Description: ${exp.description}\n`);
  });

  if (corruptedExpenses.length === 0) {
    console.log('✅ No corrupted tips found!');
    process.exit(0);
  }

  // Fix the corrupted tips
  console.log(`\n⚠️  About to fix ${corruptedExpenses.length} expenses...\n`);

  for (const exp of corruptedExpenses) {
    const currentTip = parseFloat(exp.tipAmount);
    const fixedTip = (currentTip / 100).toFixed(2);

    await db
      .update(expenses)
      .set({ tipAmount: fixedTip })
      .where(sql`id = ${exp.id}`);

    console.log(`✅ Fixed: ${exp.description} - $${currentTip.toFixed(2)} → $${fixedTip}`);
  }

  console.log(`\n✅ Successfully fixed ${corruptedExpenses.length} expense records!`);
  process.exit(0);
} catch (error) {
  console.error('❌ Error fixing tips:', error);
  process.exit(1);
}
