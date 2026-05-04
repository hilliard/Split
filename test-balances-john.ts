import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load .env.production
dotenv.config({ path: resolve('.env.production') });

import { db } from './src/db/index';
import { customers } from './src/db/schema';
import { eq } from 'drizzle-orm';
import { calculateGroupBalances } from './src/utils/balance-calculator';

async function testBalances() {
  try {
    const user = await db.query.customers.findFirst({
      where: eq(customers.username, 'johnelway')
    });
    console.log('John ID:', user?.humanId);
    
    // Hardcode the group ID from check-db
    const groupId = 'b7fa62b9-9813-4d7f-b12d-0bbaecd77c02';
    console.log('Group ID:', groupId);
    
    const balances = await calculateGroupBalances(groupId);
    console.log('Balances:', balances);
  } catch (error) {
    console.error('Error:', error);
  }
  process.exit(0);
}

testBalances();
