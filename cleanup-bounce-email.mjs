import { db } from './src/db/index.ts';
import { emailHistory, humans, customers } from './src/db/human-centric-schema.ts';
import { eq } from 'drizzle-orm';

console.log('🗑️  Removing bounce@resend.dev from database...\n');

try {
  // Find the human associated with this email
  const emailRecs = await db
    .select()
    .from(emailHistory)
    .where(eq(emailHistory.email, 'bounce@resend.dev'));

  if (emailRecs.length === 0) {
    console.log('✅ No email history found');
    process.exit(0);
  }

  const humanId = emailRecs[0].humanId;
  console.log(`Found human: ${humanId}`);

  // Delete email history
  await db.delete(emailHistory).where(eq(emailHistory.email, 'bounce@resend.dev'));
  console.log('✅ Deleted email history');

  // Delete customers
  const customersDeleted = await db.delete(customers).where(eq(customers.humanId, humanId));
  console.log(`✅ Deleted ${customersDeleted.rowCount || 0} customer(s)`);

  // Delete human
  const humansDeleted = await db.delete(humans).where(eq(humans.id, humanId));
  console.log(`✅ Deleted ${humansDeleted.rowCount || 0} human(s)`);

  console.log('\n✨ Cleanup complete!');
} catch (error) {
  console.error('❌ Error:', error instanceof Error ? error.message : String(error));
} finally {
  process.exit(0);
}
