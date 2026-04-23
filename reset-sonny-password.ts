import { db } from './src/db/index';
import { humans, customers } from './src/db/schema';
import { eq } from 'drizzle-orm';
import { hashPassword } from './src/utils/password';

async function resetSonnyPassword() {
  try {
    // Find sonny in humans table
    const sonnyUsers = await db.select().from(humans).where(eq(humans.firstName, 'sonny'));

    if (!sonnyUsers || sonnyUsers.length === 0) {
      console.error('❌ User "sonny" not found in humans table');
      process.exit(1);
    }

    const human = sonnyUsers[0];
    console.log('✓ Found human:', {
      id: human.id,
      firstName: human.firstName,
      lastName: human.lastName,
    });

    // Find corresponding customer account
    const customerAccounts = await db
      .select()
      .from(customers)
      .where(eq(customers.humanId, human.id));

    if (!customerAccounts || customerAccounts.length === 0) {
      console.error('❌ No customer account found for sonny');
      process.exit(1);
    }

    const customer = customerAccounts[0];
    console.log('✓ Found customer:', {
      customerId: customer.id,
      username: customer.username,
      email: customer.email,
    });

    // Set new password
    const newPassword = 'Sonny@123';
    const hashedPassword = await hashPassword(newPassword);

    // Update password
    await db
      .update(customers)
      .set({ passwordHash: hashedPassword })
      .where(eq(customers.id, customer.id));

    console.log('\n✅ Password reset successfully!\n');
    console.log('Login credentials:');
    console.log('───────────────────────');
    console.log(`Username: ${customer.username}`);
    console.log(`Email:    ${customer.email}`);
    console.log(`Password: ${newPassword}`);
    console.log('───────────────────────\n');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

resetSonnyPassword();
