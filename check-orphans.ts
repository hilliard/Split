import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load .env.production
dotenv.config({ path: resolve('.env.production') });

import { db } from './src/db/index';
import { expenses, events, expenseGroups } from './src/db/schema';
import { eq, ilike } from 'drizzle-orm';

async function checkOrphans() {
  try {
    const group = await db.query.expenseGroups.findFirst({
      where: ilike(expenseGroups.name, '%Houston%Party%People%')
    });
    
    if (!group) {
      console.log('Group not found');
      process.exit(1);
    }
    
    console.log(`Found group: ${group.name} (${group.id})`);
    
    const exps = await db.select().from(expenses).where(eq(expenses.groupId, group.id));
    console.log(`Found ${exps.length} expenses in this group:`);
    for (const exp of exps) {
      console.log(`- ID: ${exp.id}, amount: ${exp.amount}, eventId: ${exp.eventId}, desc: ${exp.description}`);
    }
    
  } catch (e) {
    console.error(e);
  }
  process.exit(0);
}

checkOrphans();
