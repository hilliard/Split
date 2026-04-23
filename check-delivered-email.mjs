import { db } from './src/db/index.ts';
import { customers } from './src/db/human-centric-schema.ts';
import { eq } from 'drizzle-orm';

console.log('🔍 Checking for delivered@resend.dev in database...\n');

try {
  const result = await db
    .select()
    .from(customers)
    .where(eq(customers.email, 'delivered@resend.dev'));

  if (result.length > 0) {
    console.log('❌ Email still exists:');
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.log('✅ Email NOT found in database (good!)');
  }
} catch (error) {
  console.error('❌ Error:', error instanceof Error ? error.message : String(error));
} finally {
  process.exit(0);
}
