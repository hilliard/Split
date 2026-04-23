import postgres from 'postgres';
import fs from 'fs';
import path from 'path';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('❌ DATABASE_URL environment variable not set');
  process.exit(1);
}

const sql = postgres(connectionString, { ssl: 'require' });

const migrationFile = path.join(
  process.cwd(),
  'migrations',
  '022-make-activities-eventid-optional.sql'
);
const migrationSQL = fs.readFileSync(migrationFile, 'utf-8');

console.log('🔄 Running migration 022...');
console.log('─'.repeat(60));

sql
  .unsafe(migrationSQL)
  .then(() => {
    console.log('─'.repeat(60));
    console.log('✅ Migration 022 completed successfully');
    console.log('✓ Made activities.event_id optional (nullable)');
    console.log('✓ Activities can now exist without being tied to an event');
  })
  .catch((error) => {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  })
  .finally(() => sql.end());
