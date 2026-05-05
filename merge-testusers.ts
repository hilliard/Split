import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load .env.production
dotenv.config({ path: resolve('.env.production') });

import postgres from 'postgres';

async function mergeTestUsers() {
  try {
    const sql = postgres(process.env.DATABASE_URL!);
    
    console.log('Merging duplicate testusers...');
    
    const realId = 'ab387893-b5a2-4bdf-8fe1-6d59d0fa5fc0';
    const dupIds = [
      'c9a566f3-0415-43ec-8beb-ace776b39c6a',
      'd7176e8c-194c-4d11-bccb-a4125d2c5eee'
    ];
    
    for (const dupId of dupIds) {
      console.log(`\nMerging duplicate ${dupId}...`);
      
      await sql`UPDATE expenses SET paid_by = ${realId} WHERE paid_by = ${dupId}`;
      console.log(`- Updated expenses paid_by`);
      
      await sql`UPDATE expense_splits SET user_id = ${realId} WHERE user_id = ${dupId}`;
      console.log(`- Updated expense_splits`);
      
      await sql`UPDATE settlements SET from_user_id = ${realId} WHERE from_user_id = ${dupId}`;
      await sql`UPDATE settlements SET to_user_id = ${realId} WHERE to_user_id = ${dupId}`;
      console.log(`- Updated settlements`);
      
      const groups = await sql`SELECT group_id FROM group_members WHERE user_id = ${dupId}`;
      for (const row of groups) {
        const existing = await sql`SELECT id FROM group_members WHERE group_id = ${row.group_id} AND user_id = ${realId}`;
        if (existing.length > 0) {
          await sql`DELETE FROM group_members WHERE group_id = ${row.group_id} AND user_id = ${dupId}`;
        } else {
          await sql`UPDATE group_members SET user_id = ${realId} WHERE group_id = ${row.group_id} AND user_id = ${dupId}`;
        }
      }
      console.log(`- Merged group memberships`);
      
      // Update pending_group_invitations
      await sql`UPDATE pending_group_invitations SET invited_by = ${realId} WHERE invited_by = ${dupId}`;
      console.log(`- Updated pending invitations`);
      
      // Finally, delete the old human
      await sql`DELETE FROM humans WHERE id = ${dupId}`;
      console.log(`- Deleted duplicate human record`);
    }
    
    await sql.end();
  } catch (e) {
    console.error('Fatal error:', e);
  }
  process.exit(0);
}

mergeTestUsers();
