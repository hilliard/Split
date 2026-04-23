import { db } from './src/db/index.ts';
import { customers, emailVerificationTokens } from './src/db/human-centric-schema.ts';
import { eq } from 'drizzle-orm';
import { createVerificationToken } from './src/utils/emailVerification.ts';

try {
  console.log('🔍 Finding testuser_2026...\n');

  const [user] = await db
    .select({
      id: customers.id,
      username: customers.username,
      email: customers.email,
    })
    .from(customers)
    .where(eq(customers.username, 'testuser_2026'));

  if (!user) {
    console.log('❌ User not found');
    process.exit(1);
  }

  console.log(`✅ Found user: ${user.username} (${user.email})\n`);

  // Delete old tokens
  await db.delete(emailVerificationTokens).where(eq(emailVerificationTokens.customerId, user.id));

  console.log('🗑️  Deleted old verification tokens\n');

  // Create new token
  console.log('🔐 Creating new verification token...');
  const token = await createVerificationToken(user.id, user.email, 24);

  console.log('✅ Token created!\n');

  // Generate verification URL
  const verificationUrl = `http://localhost:4324/auth/verify-email?token=${token}&email=${encodeURIComponent(user.email)}`;

  console.log('📧 Verification Link:\n');
  console.log(verificationUrl);
  console.log('\n');

  console.log('👇 Copy and paste the link above into your browser to verify!\n');
} catch (error) {
  console.error('❌ Error:', error instanceof Error ? error.message : String(error));
} finally {
  process.exit(0);
}
