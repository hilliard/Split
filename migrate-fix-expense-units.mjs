/**
 * DATA MIGRATION: Fix expenses stored in dollars (should be cents)
 * 
 * PROBLEM: Some legacy expenses are stored as dollars (e.g., 50 for $50)
 * instead of cents (e.g., 5000 for $50.00)
 * 
 * Detection: If expense amount > 1,000,000 cents (~$10,000) and doesn't look like
 * an aggregated value, it might be dollars instead of cents.
 * 
 * SOLUTION: Identify expenses to fix and multiply by 100
 * 
 * RUN MANUALLY: node migrate-fix-expense-units.mjs
 */

import postgres from 'postgres';
import * as dotenv from 'dotenv';
import * as readline from 'readline';

dotenv.config({ path: '.env.local' });

const sql = postgres();

// Create readline interface for user confirmation
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      resolve(answer.toLowerCase());
    });
  });
}

async function main() {
  try {
    console.log('🔍 Scanning for expenses that might be stored in dollars...\n');
    
    // Find potentially problematic expenses
    const suspiciousExpenses = await sql`
      SELECT 
        id,
        event_id,
        amount,
        tip_amount,
        description,
        created_at,
        ROUND(amount::NUMERIC / 100, 2) as "dollars_if_cents",
        CASE 
          WHEN amount > 10000000 THEN 'VERY_SUSPICIOUS (>$100k)'
          WHEN amount > 1000000 THEN 'SUSPICIOUS (>$10k)'
          WHEN amount > 100000 THEN 'MAYBE (>$1k)'
          ELSE 'OK'
        END as "suspicion_level"
      FROM expenses
      WHERE amount > 10000  -- More than $100 seems reasonable to start
      ORDER BY amount DESC
      LIMIT 20
    `;
    
    if (suspiciousExpenses.length === 0) {
      console.log('✅ No suspicious expenses found. Data looks clean!');
      rl.close();
      process.exit(0);
    }
    
    console.log(`Found ${suspiciousExpenses.length} potentially problematic expenses:\n`);
    console.log('ID | Amount (raw) | If Cents→Dollars | Suspicion Level | Description');
    console.log('--- | --- | --- | --- | ---');
    
    suspiciousExpenses.forEach((exp) => {
      const displayAmount = exp.amount.toString().padEnd(12);
      const asdollars = exp.dollars_if_cents.toString().padEnd(16);
      console.log(
        `${exp.id.substring(0, 8)}... | ${displayAmount} | $${asdollars} | ${exp.suspicion_level} | "${exp.description?.substring(0, 30) || '(empty)'}"`
      );
    });
    
    console.log('\n');
    
    // Ask for confirmation
    const response = await question(
      '⚠️  Do you want to multiply the VERY_SUSPICIOUS expenses by 100? (yes/no): '
    );
    
    if (response !== 'yes' && response !== 'y') {
      console.log('❌ Cancelled. No changes made.');
      rl.close();
      process.exit(0);
    }
    
    // Get only VERY_SUSPICIOUS for fixing
    const toFix = suspiciousExpenses.filter(exp => 
      exp.suspicion_level.includes('VERY_SUSPICIOUS')
    );
    
    if (toFix.length === 0) {
      console.log('No VERY_SUSPICIOUS expenses to fix.');
      rl.close();
      process.exit(0);
    }
    
    console.log(`\n🔧 Fixing ${toFix.length} expenses...\n`);
    
    // Fix each expense
    let fixed = 0;
    let failed = 0;
    
    for (const exp of toFix) {
      try {
        const newAmount = exp.amount * 100;
        const newTip = (exp.tip_amount || 0) * 100;
        
        await sql`
          UPDATE expenses
          SET amount = ${newAmount}, tip_amount = ${newTip}
          WHERE id = ${exp.id}
        `;
        
        console.log(`✅ Fixed: ${exp.id.substring(0, 8)}... | ${exp.amount} → ${newAmount} cents ($${(newAmount/100).toFixed(2)})`);
        fixed++;
      } catch (error) {
        console.error(`❌ Failed to fix ${exp.id}:`, error.message);
        failed++;
      }
    }
    
    console.log(`\n📊 Migration complete:`);
    console.log(`   ✅ Fixed: ${fixed}`);
    console.log(`   ❌ Failed: ${failed}`);
    
    // Verify the fix
    console.log(`\n🔍 Verifying fix...`);
    const afterFix = await sql`
      SELECT 
        COUNT(*) as total,
        MIN(amount) as min_amount,
        MAX(amount) as max_amount,
        AVG(amount)::INTEGER as avg_amount
      FROM expenses
      WHERE amount > 0
    `;
    
    console.log(`Updated expenses stats:`);
    console.log(`   Total: ${afterFix[0].total}`);
    console.log(`   Min: ${afterFix[0].min_amount} cents ($${(afterFix[0].min_amount/100).toFixed(2)})`);
    console.log(`   Max: ${afterFix[0].max_amount} cents ($${(afterFix[0].max_amount/100).toFixed(2)})`);
    console.log(`   Avg: ${afterFix[0].avg_amount} cents ($${(afterFix[0].avg_amount/100).toFixed(2)})`);
    
    rl.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    rl.close();
    process.exit(1);
  }
}

main();
