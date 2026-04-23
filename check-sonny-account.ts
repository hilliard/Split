import { db } from './src/db/index';
import { humans, customers } from './src/db/schema';

async function findSonnyAccount() {
  try {
    console.log('=== Checking all customers and their human links ===\n');

    const allCustomers = await db.select().from(customers);

    for (const customer of allCustomers) {
      const human = await db
        .select()
        .from(humans)
        .where((h: any) => h.id === customer.humanId);

      console.log(`Customer: ${customer.username} (${customer.email})`);
      console.log(`  Human: ${human[0]?.firstName} ${human[0]?.lastName || ''}`);
      console.log(`---`);
    }
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

findSonnyAccount();
