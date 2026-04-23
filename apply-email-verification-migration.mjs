import { sql } from 'drizzle-orm';
import { db } from './src/db/index.ts';
import fs from 'fs';

const migrationSql = fs.readFileSync(
  './src/db/migrations/0004_add_email_verification.sql',
  'utf-8'
);

// Split by statement-breakpoint and filter out comments
const statements = migrationSql
  .split('--> statement-breakpoint')
  .map((stmt) => stmt.trim())
  .filter((stmt) => stmt && !stmt.startsWith('--'));

console.log(`Found ${statements.length} SQL statements to execute`);

try {
  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i].trim();
    if (!statement) continue;

    console.log(`\n[${i + 1}/${statements.length}] Executing:`);
    console.log(statement.substring(0, 80) + (statement.length > 80 ? '...' : ''));

    // Execute raw SQL
    await db.execute(sql.raw(statement));
    console.log('✓ Success');
  }

  console.log('\n✅ Migration applied successfully!');
  process.exit(0);
} catch (error) {
  console.error('\n❌ Migration failed:', error.message);
  if (error.detail) console.error('Detail:', error.detail);
  process.exit(1);
}
