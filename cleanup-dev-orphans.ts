import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load .env.local
dotenv.config({ path: resolve('.env.local') });

import postgres from 'postgres';

async function cleanupDevOrphans() {
  try {
    const sql = postgres(process.env.DATABASE_URL!);
    
    // Check if there are expenses with NULL event_id or event_id that doesn't exist
    const orphans = await sql`
      SELECT id, description, amount, event_id, group_id, activity_id
      FROM expenses 
      WHERE (event_id IS NOT NULL AND event_id NOT IN (SELECT id FROM events))
         OR (group_id IS NOT NULL AND group_id NOT IN (SELECT id FROM expense_groups))
         OR (activity_id IS NOT NULL AND activity_id NOT IN (SELECT id FROM activities))
         OR (event_id IS NULL AND group_id IS NULL);
    `;
    
    console.log(`Found ${orphans.length} orphaned expenses!`);
    
    if (orphans.length > 0) {
      console.log(orphans);
      const orphanIds = orphans.map((row: any) => row.id);
      
      // Delete their splits first
      await sql`DELETE FROM expense_splits WHERE expense_id = ANY(${orphanIds})`;
      
      // Delete the expenses
      await sql`DELETE FROM expenses WHERE id = ANY(${orphanIds})`;
      console.log('Successfully cleaned up orphans in local DB!');
    }
    
    // Also check for orphaned splits
    const orphanedSplits = await sql`
      SELECT id FROM expense_splits WHERE expense_id NOT IN (SELECT id FROM expenses);
    `;
    if (orphanedSplits.length > 0) {
      const splitIds = orphanedSplits.map((row: any) => row.id);
      await sql`DELETE FROM expense_splits WHERE id = ANY(${splitIds})`;
      console.log(`Cleaned up ${orphanedSplits.length} orphaned splits.`);
    }
    
    // Also check for orphaned settlements
    const orphanedSettlements = await sql`
      SELECT id FROM settlements 
      WHERE (event_id IS NOT NULL AND event_id NOT IN (SELECT id FROM events))
         OR (group_id IS NOT NULL AND group_id NOT IN (SELECT id FROM expense_groups));
    `;
    if (orphanedSettlements.length > 0) {
      const settleIds = orphanedSettlements.map((row: any) => row.id);
      await sql`DELETE FROM settlements WHERE id = ANY(${settleIds})`;
      console.log(`Cleaned up ${orphanedSettlements.length} orphaned settlements.`);
    }
    
    // Also check for orphaned group members
    const orphanedMembers = await sql`
      SELECT id FROM group_members WHERE group_id NOT IN (SELECT id FROM expense_groups);
    `;
    if (orphanedMembers.length > 0) {
      const memIds = orphanedMembers.map((row: any) => row.id);
      await sql`DELETE FROM group_members WHERE id = ANY(${memIds})`;
      console.log(`Cleaned up ${orphanedMembers.length} orphaned group members.`);
    }
    
    await sql.end();
  } catch (e) {
    console.error(e);
  }
  process.exit(0);
}

cleanupDevOrphans();
