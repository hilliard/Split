import { db } from './src/db/index.ts';
import { customers } from './src/db/human-centric-schema.ts';
import { eq } from 'drizzle-orm';

console.log('🗑️  Removing delivered@resend.dev from database...\n');

try {
  const result = await db.delete(customers).where(eq(customers.email, 'delivered@resend.dev'));

  console.log(`✅ Deleted ${result.rowCount || 0} customer(s)\n`);
} catch (error) {
  console.error('❌ Error:', error instanceof Error ? error.message : String(error));
} finally {
  process.exit(0);
}
