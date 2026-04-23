import { db } from './src/db/index.ts';
import { customers, emailVerificationTokens } from './src/db/human-centric-schema.ts';
import { isNull } from 'drizzle-orm';

console.log('🧹 Cleaning up bad records...\n');

try {
  // Delete verification tokens (they should cascade anyway)
  console.log('🗑️  Deleting orphaned tokens...');
  const tokensResult = await db
    .delete(emailVerificationTokens)
    .where(isNull(emailVerificationTokens.email));
  console.log(`✅ Deleted ${tokensResult.rowCount || 0} tokens\n`);

  // Delete customers with NULL emails
  console.log('🗑️  Deleting customers with NULL emails...');
  const customersResult = await db.delete(customers).where(isNull(customers.email));
  console.log(`✅ Deleted ${customersResult.rowCount || 0} customers\n`);

  // Show what's left
  console.log('📧 Remaining emails:');
  const remaining = await db.select().from(customers);
  remaining.forEach((c) => {
    console.log(`  - ${c.email} (username: ${c.username})`);
  });

  console.log('\n✅ CLEANUP COMPLETE');
} catch (error) {
  console.error('❌ Error:', error instanceof Error ? error.message : String(error));
} finally {
  process.exit(0);
}
