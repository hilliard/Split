import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load .env.local
dotenv.config({ path: resolve('.env.local') });

import postgres from 'postgres';

async function fixExpenseSplits() {
  try {
    const sql = postgres(process.env.DATABASE_URL!);
    
    // Find expenses with duplicate splits
    const badExpenses = await sql`
      SELECT expense_id, user_id, COUNT(*) as cnt
      FROM expense_splits
      GROUP BY expense_id, user_id
      HAVING COUNT(*) > 1;
    `;
    
    console.log(`Found ${badExpenses.length} bad expense splits!`);
    
    // We will just delete all splits for those expenses and recreate them equally
    for (const row of badExpenses) {
      const expenseId = row.expense_id;
      
      // Get the total amount of the expense
      const [expense] = await sql`
        SELECT amount, tip_amount FROM expenses WHERE id = ${expenseId};
      `;
      
      const totalAmount = expense.amount + (expense.tip_amount || 0);
      
      // Get the unique users that SHOULD be on this split
      const users = await sql`
        SELECT DISTINCT user_id FROM expense_splits WHERE expense_id = ${expenseId};
      `;
      
      // Delete all existing splits for this expense
      await sql`
        DELETE FROM expense_splits WHERE expense_id = ${expenseId};
      `;
      
      // Calculate new split amount per person
      const splitAmount = Math.floor(totalAmount / users.length);
      const remainder = totalAmount % users.length;
      
      // Re-insert splits correctly
      for (let i = 0; i < users.length; i++) {
        const amount = splitAmount + (i < remainder ? 1 : 0);
        await sql`
          INSERT INTO expense_splits (id, expense_id, user_id, amount)
          VALUES (gen_random_uuid(), ${expenseId}, ${users[i].user_id}, ${amount});
        `;
      }
      
      console.log(`Fixed expense ${expenseId}: ${totalAmount} split among ${users.length} users`);
    }
    
    await sql.end();
  } catch (e) {
    console.error(e);
  }
  process.exit(0);
}

fixExpenseSplits();
