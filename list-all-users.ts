import { db } from './src/db/index';
import { customers, humans } from './src/db/schema';

async function listUsers() {
  try {
    console.log('Checking customers table...\n');
    const allCustomers = await db.select().from(customers);

    if (allCustomers.length === 0) {
      console.log('No customers found');
    } else {
      console.log(`Found ${allCustomers.length} customers:`);
      allCustomers.slice(0, 10).forEach((c) => {
        console.log(`  - ${c.username} (${c.email})`);
      });
      if (allCustomers.length > 10) {
        console.log(`  ... and ${allCustomers.length - 10} more`);
      }
    }

    console.log('\n---\n');
    console.log('Checking humans table...\n');
    const allHumans = await db.select().from(humans);

    if (allHumans.length === 0) {
      console.log('No humans found');
    } else {
      console.log(`Found ${allHumans.length} humans:`);
      allHumans.slice(0, 10).forEach((h) => {
        console.log(`  - ${h.firstName} ${h.lastName} (${h.email})`);
      });
      if (allHumans.length > 10) {
        console.log(`  ... and ${allHumans.length - 10} more`);
      }
    }
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

listUsers();
