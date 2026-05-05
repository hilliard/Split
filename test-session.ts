import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load .env.production
dotenv.config({ path: resolve('.env.production') });

import { db } from './src/db/index';
import { sessions } from './src/db/schema';
import { eq } from 'drizzle-orm';

async function testSession() {
  const sessionList = await db.select().from(sessions).limit(1);
  console.log(sessionList[0]);
  process.exit(0);
}

testSession();
