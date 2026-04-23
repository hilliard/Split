import { db } from './src/db/index.ts';
import { users } from './src/db/schema.ts'; // OLD schema
import { like } from 'drizzle-orm';

console.log('🔍 Checking OLD schema for @resend.dev emails...\n');

try {
  // Check old users table
  const oldUsers = await db.select().from(users).where(like(users.email, '%@resend.dev'));

  console.log(`Users table records with @resend.dev: ${oldUsers.length}`);
  if (oldUsers.length > 0) {
    console.log('❌ Still found in OLD schema:', oldUsers);
  } else {
    console.log('✅ No @resend.dev in old users table');
  }
} catch (error) {
  console.error('❌ Error:', error instanceof Error ? error.message : String(error));
} finally {
  process.exit(0);
}
