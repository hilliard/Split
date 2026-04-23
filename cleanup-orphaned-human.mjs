import { db } from './src/db/index.ts';
import { emailHistory, humans } from './src/db/human-centric-schema.ts';
import { eq } from 'drizzle-orm';

console.log('🗑️  Removing orphaned human and email history for delivered@resend.dev...\n');

try {
  // Delete email history first
  const emailHistoryDeleted = await db
    .delete(emailHistory)
    .where(eq(emailHistory.email, 'delivered@resend.dev'));

  console.log(`✅ Deleted ${emailHistoryDeleted.rowCount || 0} email history record(s)`);

  // Delete orphaned human
  const humansDeleted = await db
    .delete(humans)
    .where(eq(humans.id, 'c152092d-a5a5-45ec-8a0e-c23d68681110'));

  console.log(`✅ Deleted ${humansDeleted.rowCount || 0} human record(s)`);
  console.log('\n✨ Cleanup complete!');
} catch (error) {
  console.error('❌ Error:', error instanceof Error ? error.message : String(error));
} finally {
  process.exit(0);
}
