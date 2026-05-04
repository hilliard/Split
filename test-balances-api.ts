import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load .env.production
dotenv.config({ path: resolve('.env.production') });

import { db } from './src/db/index';
import { events } from './src/db/schema';
import { eq } from 'drizzle-orm';

async function testBalancesEndpoint() {
  try {
    const event = await db.query.events.findFirst({
      where: eq(events.name, 'Disney World Vacation')
    });
    console.log('Event ID:', event?.id);
    
    // Now simulate what balances.ts does
    const eventId = event?.id;
    
    // Make an HTTP request to the live server
    const response = await fetch(`http://177.7.34.123:4321/api/expenses/balances?eventId=${eventId}`);
    const data = await response.json();
    console.log(JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error:', error);
  }
  process.exit(0);
}

testBalancesEndpoint();
