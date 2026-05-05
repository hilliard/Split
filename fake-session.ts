import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load .env.local
dotenv.config({ path: resolve('.env.local') });

import { db } from './src/db/index';
import { sessions } from './src/db/schema';
import { eq } from 'drizzle-orm';
import postgres from 'postgres';

async function simulate() {
  try {
    const sql = postgres(process.env.DATABASE_URL!);
    
    // Get sonny's human_id
    const users = await sql`SELECT human_id, username FROM customers WHERE username = 'sonny'`;
    const sonnyId = users[0].human_id;
    console.log('Sonny human_id:', sonnyId);
    
    // Create a fake session
    const sessionId = 'test-session-12345';
    await db.insert(sessions).values({
      id: sessionId,
      userId: sonnyId,
      expiresAt: new Date(Date.now() + 10000000)
    });
    console.log('Created fake session:', sessionId);
    
    await sql.end();
  } catch (e) {
    console.error('Fatal error:', e);
  }
  process.exit(0);
}

simulate();
