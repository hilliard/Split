import { db } from './src/db/index.ts';
import { customers } from './src/db/human-centric-schema.ts';
import { eq } from 'drizzle-orm';

try {
  console.log('\n🔍 Checking testuser_2026...\n');

  const user = await db
    .select({
      id: customers.id,
      username: customers.username,
      email: customers.email,
      emailVerified: customers.emailVerified,
    })
    .from(customers)
    .where(eq(customers.username, 'testuser_2026'));

  if (user.length > 0) {
    const u = user[0];
    console.log('✅ User found in database:');
    console.log(`   Username: ${u.username}`);
    console.log(`   Email: ${u.email || '❌ NOT SET'}`);
    console.log(`   Email Verified: ${u.emailVerified ? '✅ YES' : '❌ NO'}`);
  } else {
    console.log('❌ User NOT found in database');
  }
} catch (error) {
  console.error('❌ Error:', error instanceof Error ? error.message : String(error));
} finally {
  process.exit(0);
}
