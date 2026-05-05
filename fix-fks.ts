import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load .env.production
dotenv.config({ path: resolve('.env.production') });

import postgres from 'postgres';

async function addForeignKeys() {
  try {
    const sql = postgres(process.env.DATABASE_URL!);
    
    console.log('Adding missing foreign keys to expenses table...');
    
    try {
      await sql`
        ALTER TABLE expenses
        ADD CONSTRAINT expenses_event_id_fkey
        FOREIGN KEY (event_id)
        REFERENCES events(id)
        ON DELETE CASCADE;
      `;
      console.log('Added event_id foreign key constraint!');
    } catch (e: any) {
      console.log('Event ID foreign key might already exist:', e.message);
    }
    
    try {
      await sql`
        ALTER TABLE expenses
        ADD CONSTRAINT expenses_group_id_fkey
        FOREIGN KEY (group_id)
        REFERENCES expense_groups(id)
        ON DELETE SET NULL;
      `;
      console.log('Added group_id foreign key constraint!');
    } catch (e: any) {
      console.log('Group ID foreign key might already exist:', e.message);
    }
    
    try {
      await sql`
        ALTER TABLE expenses
        ADD CONSTRAINT expenses_activity_id_fkey
        FOREIGN KEY (activity_id)
        REFERENCES activities(id)
        ON DELETE SET NULL;
      `;
      console.log('Added activity_id foreign key constraint!');
    } catch (e: any) {
      console.log('Activity ID foreign key might already exist:', e.message);
    }
    
    await sql.end();
  } catch (e) {
    console.error('Fatal error:', e);
  }
  process.exit(0);
}

addForeignKeys();
