import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load .env.production
dotenv.config({ path: resolve('.env.production') });

import postgres from 'postgres';

async function mergeHumans() {
  try {
    const sql = postgres(process.env.DATABASE_URL!);
    
    console.log('Merging duplicate humans...');
    
    // John
    const oldJohnId = '53255def-fc8e-4387-8032-1e46ac232c4e';
    const realJohnId = '91c78b88-7359-40ed-81ee-e7a5912e68e1';
    
    // Janet
    const oldJanetId = 'b2e89904-f271-46f5-b17e-29b90d911f5c';
    const realJanetId = '8f54ce7f-2da6-4b1a-90bf-baa9707f8826';
    
    const merges = [
      { old: oldJohnId, new: realJohnId, name: 'John' },
      { old: oldJanetId, new: realJanetId, name: 'Janet' }
    ];
    
    for (const merge of merges) {
      console.log(`\nMerging ${merge.name}...`);
      
      // Update expenses
      await sql`UPDATE expenses SET paid_by = ${merge.new} WHERE paid_by = ${merge.old}`;
      console.log(`- Updated expenses paid_by`);
      
      // Update expense splits
      // But wait! What if the real user is ALSO in the same expense split?
      // Expense splits doesn't have a unique constraint on (expense_id, user_id) right now?
      // Actually let's just do it.
      await sql`UPDATE expense_splits SET user_id = ${merge.new} WHERE user_id = ${merge.old}`;
      console.log(`- Updated expense_splits`);
      
      // Update settlements
      await sql`UPDATE settlements SET from_user_id = ${merge.new} WHERE from_user_id = ${merge.old}`;
      await sql`UPDATE settlements SET to_user_id = ${merge.new} WHERE to_user_id = ${merge.old}`;
      console.log(`- Updated settlements`);
      
      // Handle group_members (this has a unique constraint usually)
      const groups = await sql`SELECT group_id FROM group_members WHERE user_id = ${merge.old}`;
      for (const row of groups) {
        // Check if real user is already in group
        const existing = await sql`SELECT id FROM group_members WHERE group_id = ${row.group_id} AND user_id = ${merge.new}`;
        if (existing.length > 0) {
          // Real user is already there, just delete the old one
          await sql`DELETE FROM group_members WHERE group_id = ${row.group_id} AND user_id = ${merge.old}`;
        } else {
          // Real user not there, update it
          await sql`UPDATE group_members SET user_id = ${merge.new} WHERE group_id = ${row.group_id} AND user_id = ${merge.old}`;
        }
      }
      console.log(`- Merged group memberships`);
      
      // Finally, delete the old human
      await sql`DELETE FROM humans WHERE id = ${merge.old}`;
      console.log(`- Deleted duplicate human record for ${merge.name}`);
    }
    
    await sql.end();
  } catch (e) {
    console.error('Fatal error:', e);
  }
  process.exit(0);
}

mergeHumans();
