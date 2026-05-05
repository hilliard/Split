import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load .env.production
dotenv.config({ path: resolve('.env.production') });

import { db } from './src/db/index';
import { sessions, expenseGroups, groupMembers } from './src/db/schema';
import { eq } from 'drizzle-orm';

async function testQuery() {
  const sonnyId = '61994963-eb56-4d04-89af-8e1593a507ca';
  
  const userGroups = await db
    .select({
      id: expenseGroups.id,
      name: expenseGroups.name,
    })
    .from(groupMembers)
    .innerJoin(expenseGroups, eq(groupMembers.groupId, expenseGroups.id))
    .where(eq(groupMembers.userId, sonnyId));
    
  console.log('Result using drizzle query:', userGroups);
  process.exit(0);
}

testQuery();
