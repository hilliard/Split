import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load .env.production
dotenv.config({ path: resolve('.env.production') });

import { db } from './src/db/index';
import { events, expenses } from './src/db/schema';
import { eq, and, ilike } from 'drizzle-orm';

async function deleteFlights() {
  try {
    // 1. Find the event
    const targetEvent = await db.query.events.findFirst({
      where: ilike(events.title, '%Teresa%Bir%day Bash%')
    });
    
    if (!targetEvent) {
      console.log("Could not find Teresa's Birthday Bash event!");
      process.exit(1);
    }
    
    console.log(`Found event: ${targetEvent.title} (ID: ${targetEvent.id})`);

    // 2. Find expenses to delete
    // The user said: "$148 'flight to Houston' and teh $148 'flight from houston'"
    const targetExpenses = await db.query.expenses.findMany({
      where: eq(expenses.eventId, targetEvent.id)
    });

    console.log(`Found ${targetExpenses.length} expenses matching $148.00:`);
    for (const exp of targetExpenses) {
      console.log(`- ID: ${exp.id}, Desc: ${exp.description}`);
    }

    if (targetExpenses.length === 0) {
      console.log("No matching expenses found!");
      process.exit(1);
    }

    // 3. Delete them
    for (const exp of targetExpenses) {
      if (exp.description?.toLowerCase().includes('flight') || exp.description?.toLowerCase().includes('houston')) {
        console.log(`Deleting expense: ${exp.description}`);
        await db.delete(expenses).where(eq(expenses.id, exp.id));
      }
    }

    console.log('Done!');
  } catch (error) {
    console.error('Error:', error);
  }
  process.exit(0);
}

deleteFlights();
