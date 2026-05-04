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
    
    // Hardcode the group ID from check-db or get it dynamically
    const group = await db.query.expenseGroups.findFirst();
    console.log('Group ID:', group?.id);
    
    if (group) {
      const balances = await calculateGroupBalances(group.id);
      console.log('Balances:', balances);
    }
  } catch (error) {
    console.error('Error:', error);
  }
  process.exit(0);
}

testBalances();
