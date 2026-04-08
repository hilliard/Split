import postgres from 'postgres';
import fs from 'fs';
import path from 'path';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('❌ DATABASE_URL environment variable not set');
  process.exit(1);
}

const sql = postgres(connectionString, { ssl: 'require' });

const migrationFile = path.join(process.cwd(), 'migrations', '019-add-pending-group-invitations.sql');
const migrationSQL = fs.readFileSync(migrationFile, 'utf-8');

console.log('🔄 Running migration 019...');
console.log('─'.repeat(60));

sql.unsafe(migrationSQL)
  .then(() => {
    console.log('─'.repeat(60));
    console.log('✅ Migration 019 completed successfully');
    console.log('✓ Created pending_group_invitations table');
  })
  .catch((error) => {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  })
  .finally(() => sql.end());
