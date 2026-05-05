import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load .env.production
dotenv.config({ path: resolve('.env.production') });

import postgres from 'postgres';

async function checkDuplicates() {
  try {
    const sql = postgres(process.env.DATABASE_URL!);
    
    console.log('Checking for dependencies of duplicate humans...');
    
    const duplicateIds = ['53255def-a006-44ec-b827-0cfc34da839d', 'b2e89904-4530-47b2-bd73-dc0f367e91ca']; // Need to get full IDs
    
    // Actually, let's just query humans that don't have customers linked to them
    const duplicates = await sql`
      SELECT h.id, h.first_name, h.last_name 
      FROM humans h
      LEFT JOIN customers c ON c.human_id = h.id
      WHERE c.id IS NULL AND (h.first_name = 'John' OR h.first_name = 'Janet');
    `;
    
    console.log('Found duplicate humans without logins:');
    for (const h of duplicates) {
      console.log(`- ${h.first_name} ${h.last_name} (${h.id})`);
      
      // Check group_members
      const groups = await sql`SELECT count(*) FROM group_members WHERE user_id = ${h.id}`;
      console.log(`  Groups: ${groups[0].count}`);
      
      // Check expenses
      const exps = await sql`SELECT count(*) FROM expenses WHERE paid_by = ${h.id}`;
      console.log(`  Expenses paid: ${exps[0].count}`);
      
      // Check splits
      const splits = await sql`SELECT count(*) FROM expense_splits WHERE user_id = ${h.id}`;
      console.log(`  Expense splits: ${splits[0].count}`);
    }
    
    await sql.end();
  } catch (e) {
    console.error('Fatal error:', e);
  }
  process.exit(0);
}

checkDuplicates();
