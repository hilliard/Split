import { db } from './src/db/index.ts';
import { emailVerificationTokens, customers } from './src/db/human-centric-schema.ts';
import { eq } from 'drizzle-orm';

const email = 'onboarding@resend.dev';
const token = '8b9d2f1a60761c82df32e611cd8833107173c6beed0ec610488cdb0154f565f3';

console.log('🔍 Checking verification token in database...\n');

try {
  // Check if customer exists
  const [customer] = await db.select().from(customers).where(eq(customers.email, email));

  console.log('📧 Customer lookup:');
  if (customer) {
    console.log(`  ✅ Found: ${customer.username} (ID: ${customer.id})`);
    console.log(`  Email verified: ${customer.emailVerified}`);
  } else {
    console.log('  ❌ No customer found with this email');
  }
  console.log('');

  // Check tokens
  console.log('🔐 All tokens for this email:');
  const allTokens = await db
    .select()
    .from(emailVerificationTokens)
    .where(eq(emailVerificationTokens.email, email));

  if (allTokens.length === 0) {
    console.log('  ❌ NO TOKENS FOUND');
  } else {
    allTokens.forEach((t, i) => {
      console.log(`\n  Token ${i + 1}:`);
      console.log(`    Token: ${t.token.substring(0, 16)}...`);
      console.log(`    Customer ID: ${t.customerId}`);
      console.log(`    Expires: ${t.expiresAt}`);
      console.log(`    Verified At: ${t.verifiedAt}`);
      console.log(`    Created: ${t.createdAt}`);
    });
  }
  console.log('');

  // Check for the specific token
  console.log('🔎 Looking for specific token:');
  const specificToken = await db
    .select()
    .from(emailVerificationTokens)
    .where(eq(emailVerificationTokens.token, token));

  if (specificToken.length === 0) {
    console.log('  ❌ SPECIFIC TOKEN NOT FOUND IN DATABASE');
  } else {
    console.log(
      `  ✅ Found! Email: ${specificToken[0].email}, Verified: ${specificToken[0].verifiedAt}`
    );
  }
} catch (error) {
  console.error('❌ Error:', error instanceof Error ? error.message : String(error));
} finally {
  process.exit(0);
}
