import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load .env.production
dotenv.config({ path: resolve('.env.production') });

import { db } from './src/db/index';
import { expenses, events, expenseSplits } from './src/db/schema';
import { eq, notInArray } from 'drizzle-orm';
import postgres from 'postgres';

async function cleanupOrphans() {
  try {
    const sql = postgres(process.env.DATABASE_URL!);
    
    // Find expenses where the eventId does not exist in the events table
    const result = await sql`
      SELECT id, description, amount, event_id 
      FROM expenses 
      WHERE event_id IS NOT NULL 
      AND event_id NOT IN (SELECT id FROM events);
    `;
    
    console.log(`Found ${result.length} orphaned expenses!`);
    
    if (result.length > 0) {
      const orphanIds = result.map(row => row.id);
      
      // Delete their splits first just in case
      console.log('Deleting orphaned splits...');
      await sql`DELETE FROM expense_splits WHERE expense_id = ANY(${orphanIds})`;
      
      // Delete the expenses
      console.log('Deleting orphaned expenses...');
      await sql`DELETE FROM expenses WHERE id = ANY(${orphanIds})`;
      console.log('Successfully cleaned up orphans!');
    }
    
    await sql.end();
  } catch (e) {
    console.error(e);
  }
  process.exit(0);
}

cleanupOrphans();
