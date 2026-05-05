import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load .env.production
dotenv.config({ path: resolve('.env.production') });

import postgres from 'postgres';

async function checkSonny() {
  try {
    const sql = postgres(process.env.DATABASE_URL!);
    
    const users = await sql`SELECT human_id, username FROM customers WHERE username = 'sonny'`;
    if (users.length === 0) {
      console.log('No sonny found');
      process.exit(1);
    }
    const sonnyId = users[0].human_id;
    console.log('Sonny human_id:', sonnyId);
    
    const groups = await sql`
      SELECT g.id, g.name 
      FROM group_members gm
      JOIN expense_groups g ON gm.group_id = g.id
      WHERE gm.user_id = ${sonnyId}
    `;
    
    console.log('Sonny groups:', groups);
    
    await sql.end();
  } catch (e) {
    console.error('Fatal error:', e);
  }
  process.exit(0);
}

checkSonny();
