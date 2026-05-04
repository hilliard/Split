import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load .env.production
dotenv.config({ path: resolve('.env.production') });

import { db } from './src/db/index';
import { sql } from 'drizzle-orm';

async function fix() {
  try {
    await db.execute(sql`ALTER TABLE settlements ALTER COLUMN event_id DROP NOT NULL;`);
    console.log('Fixed NOT NULL constraint on event_id for NEON PROD');
  } catch (error) {
    console.error('Error:', error);
  }
  process.exit(0);
}

fix();
