import { db } from './src/db/index.ts';
import { customers, emailVerificationTokens } from './src/db/human-centric-schema.ts';

console.log('📧 Checking remaining emails in database...\n');

try {
  // Check customers
  console.log('👥 Emails in customers table:');
  const allCustomers = await db.select().from(customers);

  if (allCustomers.length === 0) {
    console.log('  (empty)\n');
  } else {
    allCustomers.forEach((c) => {
      console.log(`  - ${c.email} (username: ${c.username})`);
    });
    console.log('');
  }

  // Check verification tokens
  console.log('🔐 Emails in emailVerificationTokens table:');
  const allTokens = await db.select().from(emailVerificationTokens);

  if (allTokens.length === 0) {
    console.log('  (empty)\n');
  } else {
    allTokens.forEach((t) => {
      console.log(`  - ${t.email}`);
    });
    console.log('');
  }

  // Count @resend.dev emails
  const resendTokens = allTokens.filter((t) => t.email.includes('@resend.dev'));
  const resendCustomers = allCustomers.filter((c) => c.email.includes('@resend.dev'));

  console.log(`📊 Summary:`);
  console.log(`   @resend.dev in customers: ${resendCustomers.length}`);
  console.log(`   @resend.dev in tokens: ${resendTokens.length}`);
  console.log(`   Total customers: ${allCustomers.length}`);
  console.log(`   Total tokens: ${allTokens.length}`);
} catch (error) {
  console.error('❌ Error:', error instanceof Error ? error.message : String(error));
} finally {
  process.exit(0);
}
