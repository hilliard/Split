import { db } from './src/db/index.ts';
import { emailHistory, customers } from './src/db/human-centric-schema.ts';
import { like } from 'drizzle-orm';

console.log('🔍 Verifying @resend.dev emails are gone...\n');

try {
  // Check email history
  const emailHistoryRecs = await db
    .select()
    .from(emailHistory)
    .where(like(emailHistory.email, '%@resend.dev'));

  console.log(`Email history records with @resend.dev: ${emailHistoryRecs.length}`);
  if (emailHistoryRecs.length > 0) {
    console.log('❌ Still found:', emailHistoryRecs);
  }

  // Check customers
  const customerRecs = await db
    .select()
    .from(customers)
    .where(like(customers.email, '%@resend.dev'));

  console.log(`Customer records with @resend.dev: ${customerRecs.length}`);
  if (customerRecs.length > 0) {
    console.log('❌ Still found:', customerRecs);
  }

  if (emailHistoryRecs.length === 0 && customerRecs.length === 0) {
    console.log('\n✅ All @resend.dev emails successfully removed!');
  }
} catch (error) {
  console.error('❌ Error:', error instanceof Error ? error.message : String(error));
} finally {
  process.exit(0);
}
