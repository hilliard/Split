import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load .env.local
dotenv.config({ path: resolve('.env.local') });

import postgres from 'postgres';

async function cleanupGroupDuplicates() {
  try {
    const sql = postgres(process.env.DATABASE_URL!);
    
    // Find duplicate group members and keep the oldest one
    const result = await sql`
      DELETE FROM group_members a
      USING group_members b
      WHERE a.group_id = b.group_id
      AND a.user_id = b.user_id
      AND a.id > b.id;
    `;
    
    console.log(`Successfully cleaned up duplicate group members!`);
    
    await sql.end();
  } catch (e) {
    console.error(e);
  }
  process.exit(0);
}

cleanupGroupDuplicates();
