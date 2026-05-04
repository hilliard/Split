import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load .env.production
dotenv.config({ path: resolve('.env.production') });

import { getUserGroupBalance } from './src/utils/balance-calculator';

async function testBalance() {
  try {
    const groupId = 'b7fa62b9-9813-4d7f-b12d-0bbaecd77c02';
    const janetId = '8f54ce7f-2da6-4b1a-90bf-baa9707f8826';
    const johnId = '91c78b88-7359-40ed-81ee-e7a5912e68e1';
    
    console.log('Janet:', await getUserGroupBalance(groupId, janetId));
    console.log('John:', await getUserGroupBalance(groupId, johnId));

  } catch (error) {
    console.error('Error:', error);
  }
  process.exit(0);
}

testBalance();
