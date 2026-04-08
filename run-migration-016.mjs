import postgres from 'postgres';
import fs from 'fs';
import path from 'path';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('❌ DATABASE_URL environment variable not set');
  process.exit(1);
}

const sql = postgres(connectionString, { ssl: 'require' });

const migrationFile = path.join(process.cwd(), 'migrations', '016-backfill-humans-for-customers.sql');
const migrationSQL = fs.readFileSync(migrationFile, 'utf-8');

console.log('🔄 Running migration 016...');
console.log('─'.repeat(60));

sql.unsafe(migrationSQL)
  .then(() => {
    console.log('─'.repeat(60));
    console.log('✅ Migration 016 completed successfully');
    console.log('✓ Backfilled missing humans records for customers');
  })
  .catch((error) => {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  })
  .finally(() => sql.end());
