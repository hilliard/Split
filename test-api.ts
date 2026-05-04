import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load .env.production
dotenv.config({ path: resolve('.env.production') });

import { db } from './src/db/index';
import { sessions, customers } from './src/db/schema';
import { eq } from 'drizzle-orm';
import { calculateGroupBalances } from './src/utils/balance-calculator';

async function testApi() {
  try {
    const groupId = 'b7fa62b9-9813-4d7f-b12d-0bbaecd77c02';
    const johnId = '91c78b88-7359-40ed-81ee-e7a5912e68e1';
    const janetId = '8f54ce7f-2da6-4b1a-90bf-baa9707f8826';
    
    const groupBalances = await calculateGroupBalances(groupId);
    
    const johnRelevant = groupBalances.filter(b => b.fromUserId === johnId || b.toUserId === johnId);
    const janetRelevant = groupBalances.filter(b => b.fromUserId === janetId || b.toUserId === janetId);
    
    console.log('John sees:', JSON.stringify(johnRelevant, null, 2));
    console.log('Janet sees:', JSON.stringify(janetRelevant, null, 2));

  } catch (error) {
    console.error('Error:', error);
  }
  process.exit(0);
}

testApi();
