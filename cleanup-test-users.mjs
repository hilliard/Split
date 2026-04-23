import { db } from './src/db/index.ts';
import { customers, humans, emailVerificationTokens } from './src/db/human-centric-schema.ts';
import { eq, inArray } from 'drizzle-orm';

const testUsernames = ['testuser_2026', 'testuser', 'charlie', 'frank', 'grace', 'alice', 'test'];

try {
  console.log('🧹 CLEANUP: Removing test users and associated data\n');

  // Find all test users
  console.log('🔍 Finding test users...');
  const testUsers = await db
    .select({ id: customers.id, humanId: customers.humanId, username: customers.username })
    .from(customers)
    .where(inArray(customers.username, testUsernames));

  if (testUsers.length === 0) {
    console.log('✅ No test users found\n');
    process.exit(0);
  }

  console.log(`Found ${testUsers.length} test users:\n`);
  testUsers.forEach((u) =>
    console.log(`  - ${u.username} (customer: ${u.id}, human: ${u.humanId})`)
  );
  console.log('');

  const customerIds = testUsers.map((u) => u.id);
  const humanIds = testUsers.map((u) => u.humanId);

  // Delete verification tokens
  console.log('🗑️  Deleting email verification tokens...');
  const tokensDeleted = await db
    .delete(emailVerificationTokens)
    .where(inArray(emailVerificationTokens.customerId, customerIds));
  console.log(`✅ Deleted ${tokensDeleted.rowCount || 0} tokens\n`);

  // Delete customers (cascades will handle related records)
  console.log('🗑️  Deleting customers...');
  const customersDeleted = await db.delete(customers).where(inArray(customers.id, customerIds));
  console.log(`✅ Deleted ${customersDeleted.rowCount || 0} customers\n`);

  // Delete humans
  console.log('🗑️  Deleting humans...');
  const humansDeleted = await db.delete(humans).where(inArray(humans.id, humanIds));
  console.log(`✅ Deleted ${humansDeleted.rowCount || 0} humans\n`);

  console.log('✅ CLEANUP COMPLETE - Database is clean!\n');
} catch (error) {
  console.error('❌ Error:', error instanceof Error ? error.message : String(error));
} finally {
  process.exit(0);
}
