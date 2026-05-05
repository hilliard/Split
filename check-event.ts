import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load .env.production
dotenv.config({ path: resolve('.env.production') });

import { db } from './src/db/index';
import { events } from './src/db/schema';
import { eq } from 'drizzle-orm';
import postgres from 'postgres';

async function checkEvent() {
  try {
    const eventId = '765856eb-d894-4ea8-ac27-60941d365a41';
    const event = await db.query.events.findFirst({
      where: eq(events.id, eventId)
    });
    
    if (event) {
      console.log(`Event STILL EXISTS: ${event.title}`);
    } else {
      console.log('Event DOES NOT EXIST in the database!');
      
      // Check foreign keys
      const sql = postgres(process.env.DATABASE_URL!);
      const fks = await sql`
        SELECT
            tc.table_name, 
            kcu.column_name, 
            ccu.table_name AS foreign_table_name,
            ccu.column_name AS foreign_column_name, 
            rc.delete_rule
        FROM 
            information_schema.table_constraints AS tc 
            JOIN information_schema.key_column_usage AS kcu
              ON tc.constraint_name = kcu.constraint_name
              AND tc.table_schema = kcu.table_schema
            JOIN information_schema.constraint_column_usage AS ccu
              ON ccu.constraint_name = tc.constraint_name
              AND ccu.table_schema = tc.table_schema
            JOIN information_schema.referential_constraints AS rc
              ON rc.constraint_name = tc.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_name='expenses';
      `;
      console.log('Foreign keys on expenses table:', fks);
      await sql.end();
    }
  } catch (e) {
    console.error(e);
  }
  process.exit(0);
}

checkEvent();
