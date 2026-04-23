import postgres from 'postgres';
import { readFileSync } from 'fs';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const sql = postgres(process.env.DATABASE_URL);

try {
  console.log('Running migration 010: Comprehensive SQL migration...\n');

  const migrationSQL = readFileSync('migrations/010-comprehensive-schema-redesign.sql', 'utf8');

  // Split on ;--> statement-breakpoint markers or plain ;
  const statements = migrationSQL
    .split('--> statement-breakpoint')
    .map((stmt) => stmt.trim())
    .filter((stmt) => stmt && stmt.length > 5);

  console.log(`Found ${statements.length} SQL statements\n`);

  let count = 0;
  for (const statement of statements) {
    try {
      // Remove any trailing SQL comments
      const cleanStatement = statement.replace(/^\s*--.*$/gm, '').trim();
      if (!cleanStatement) continue;

      await sql.unsafe(cleanStatement);
      count++;
      console.log(`✅ Statement ${count} executed`);
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log(`⚠️  Statement ${count} skipped (already exists)`);
      } else {
        throw error;
      }
    }
  }

  console.log(`\n✅ Migration 010 complete! (${count} statements executed)`);
} catch (error) {
  console.error('❌ Migration failed:', error.message);
  if (error.detail) console.error('Detail:', error.detail);
  process.exit(1);
} finally {
  await sql.end();
}
