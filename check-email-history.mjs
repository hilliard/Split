import { db } from './src/db/index.ts';
import { emailHistory, humans, customers } from './src/db/human-centric-schema.ts';
import { eq, isNull, and } from 'drizzle-orm';

console.log('🔍 Checking emailHistory for delivered@resend.dev...\n');

try {
  // Check email history
  const emailHistoryResult = await db
    .select({
      email: emailHistory.email,
      effectiveTo: emailHistory.effectiveTo,
      humanId: emailHistory.humanId,
    })
    .from(emailHistory)
    .where(eq(emailHistory.email, 'delivered@resend.dev'));

  if (emailHistoryResult.length > 0) {
    console.log('❌ Email history records found:');
    console.log(JSON.stringify(emailHistoryResult, null, 2));

    // Get the human and customer details
    for (const record of emailHistoryResult) {
      const humanRec = await db.select().from(humans).where(eq(humans.id, record.humanId));
      const customerRec = await db
        .select()
        .from(customers)
        .where(eq(customers.humanId, record.humanId));
      console.log(`\nHuman: ${JSON.stringify(humanRec)}`);
      console.log(`Customer: ${JSON.stringify(customerRec)}`);
    }
  } else {
    console.log('✅ No email history records found');
  }
} catch (error) {
  console.error('❌ Error:', error instanceof Error ? error.message : String(error));
} finally {
  process.exit(0);
}
