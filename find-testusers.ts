import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load .env.production
dotenv.config({ path: resolve('.env.production') });

import postgres from 'postgres';

async function findTestUsers() {
  try {
    const sql = postgres(process.env.DATABASE_URL!);
    
    // Find all humans named testuser
    const users = await sql`
      SELECT h.id as human_id, h.first_name, h.last_name, c.username, c.email 
      FROM humans h
      LEFT JOIN customers c ON c.human_id = h.id
      WHERE h.first_name = 'testuser' OR h.last_name = 'testuser' OR c.email LIKE '%testuser%' OR c.email = 'delivered@resend.dev';
    `;
    
    console.log(users);
    
    await sql.end();
  } catch (e) {
    console.error('Fatal error:', e);
  }
  process.exit(0);
}

findTestUsers();
