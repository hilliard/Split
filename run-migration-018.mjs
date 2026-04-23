import postgres from 'postgres';
import fs from 'fs';
import path from 'path';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('❌ DATABASE_URL environment variable not set');
  process.exit(1);
}

const sql = postgres(connectionString, { ssl: 'require' });

const migrationFile = path.join(process.cwd(), 'migrations', '018-fix-all-user-fks-to-humans.sql');
const migrationSQL = fs.readFileSync(migrationFile, 'utf-8');

console.log('🔄 Running migration 018...');
console.log('─'.repeat(60));

sql
  .unsafe(migrationSQL)
  .then(async () => {
    console.log('─'.repeat(60));
    console.log('✅ Migration 018 completed successfully');
    console.log('✓ Fixed all user_id FKs to point to humans table');

    // Verify the fixes
    console.log('\n🔍 Verifying FK constraints...');
    const fks = await sql`
      SELECT
        tc.table_name,
        tc.constraint_name,
        ccu.table_name AS referenced_table
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND kcu.column_name = 'user_id'
      ORDER BY tc.table_name
    `;

    console.log('\nForeign keys for user_id columns:');
    fks.forEach((fk) => {
      const status = fk.referenced_table === 'humans' ? '✅' : '❌';
      console.log(`  ${status} ${fk.table_name}.user_id -> ${fk.referenced_table}.id`);
    });
  })
  .catch((error) => {
    console.error('❌ Migration failed:', error.message);
    if (error.detail) console.error('   Detail:', error.detail);
    process.exit(1);
  })
  .finally(() => sql.end());
