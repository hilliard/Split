import { db } from './src/db/index.ts';
import {
  emailHistory,
  humans,
  customers,
  emailVerificationTokens,
} from './src/db/human-centric-schema.ts';
import { like, eq, inArray } from 'drizzle-orm';

console.log('🗑️  Removing all @resend.dev emails from database...\n');

try {
  // Find all email history records with @resend.dev
  const resendEmails = await db
    .select()
    .from(emailHistory)
    .where(like(emailHistory.email, '%@resend.dev'));

  console.log(`Found ${resendEmails.length} @resend.dev email(s)`);

  if (resendEmails.length === 0) {
    console.log('✅ No @resend.dev emails found');
    process.exit(0);
  }

  // Get all unique human IDs
  const humanIds = [...new Set(resendEmails.map((e) => e.humanId))];
  console.log(`Associated humans: ${humanIds.length}`);

  // Delete email verification tokens for these humans
  const tokensDeleted = await db
    .delete(emailVerificationTokens)
    .where(inArray(emailVerificationTokens.customerId, humanIds));
  console.log(`✅ Deleted ${tokensDeleted.rowCount || 0} verification token(s)`);

  // Delete customers
  const customersDeleted = await db.delete(customers).where(inArray(customers.humanId, humanIds));
  console.log(`✅ Deleted ${customersDeleted.rowCount || 0} customer(s)`);

  // Delete email history
  const historyDeleted = await db
    .delete(emailHistory)
    .where(like(emailHistory.email, '%@resend.dev'));
  console.log(`✅ Deleted ${historyDeleted.rowCount || 0} email history record(s)`);

  // Delete humans
  const humansDeleted = await db.delete(humans).where(inArray(humans.id, humanIds));
  console.log(`✅ Deleted ${humansDeleted.rowCount || 0} human(s)`);

  console.log('\n✨ Cleanup complete! All @resend.dev emails removed.');
} catch (error) {
  console.error('❌ Error:', error instanceof Error ? error.message : String(error));
} finally {
  process.exit(0);
}
