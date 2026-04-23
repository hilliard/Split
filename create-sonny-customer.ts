import { db } from './src/db/index';
import { humans, customers } from './src/db/schema';
import { eq } from 'drizzle-orm';
import { hashPassword } from './src/utils/password';

async function createSonnyCustomer() {
  try {
    // Find sonny human
    const sonnyHumans = await db.select().from(humans).where(eq(humans.firstName, 'sonny'));

    if (!sonnyHumans || sonnyHumans.length === 0) {
      console.error('❌ Human "sonny" not found');
      process.exit(1);
    }

    const sonnyHuman = sonnyHumans[0];
    console.log('✓ Found human sonny:', sonnyHuman.id);

    // Create password
    const password = 'Sonny@123';
    const hashedPassword = await hashPassword(password);

    // Create customer account
    const newCustomer = await db
      .insert(customers)
      .values({
        humanId: sonnyHuman.id,
        username: 'sonny',
        email: `sonny+${Date.now()}@split.local`,
        passwordHash: hashedPassword,
        emailVerified: true,
      })
      .returning();

    const customer = newCustomer[0];
    console.log('\n✅ Customer account created!\n');
    console.log('Login credentials:');
    console.log('───────────────────────');
    console.log(`Username: ${customer.username}`);
    console.log(`Email:    ${customer.email}`);
    console.log(`Password: ${password}`);
    console.log('───────────────────────\n');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

createSonnyCustomer();
