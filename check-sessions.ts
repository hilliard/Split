import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load .env.production
dotenv.config({ path: resolve('.env.production') });

import postgres from 'postgres';

async function checkSessions() {
  try {
    const sql = postgres(process.env.DATABASE_URL!);
    
    // Get sonny's human_id
    const users = await sql`SELECT human_id, username FROM customers WHERE username = 'sonny'`;
    const sonnyId = users[0].human_id;
    console.log('Sonny human_id:', sonnyId);
    
    // Check sessions
    const activeSessions = await sql`SELECT * FROM sessions WHERE user_id = ${sonnyId}`;
    console.log('Active sessions for Sonny:', activeSessions);
    
    await sql.end();
  } catch (e) {
    console.error('Fatal error:', e);
  }
  process.exit(0);
}

checkSessions();
