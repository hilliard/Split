import postgres from 'postgres';
import fs from 'fs';
import path from 'path';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('❌ DATABASE_URL environment variable not set');
  process.exit(1);
}

const sql = postgres(connectionString, { ssl: 'require' });

const migrationFile = path.join(process.cwd(), 'migrations', '017-fix-expense-groups-fk.sql');
const migrationSQL = fs.readFileSync(migrationFile, 'utf-8');

console.log('🔄 Running migration 017...');
console.log('─'.repeat(60));

sql.unsafe(migrationSQL)
  .then(async () => {
    console.log('─'.repeat(60));
    console.log('✅ Migration 017 completed successfully');
    console.log('✓ Fixed expense_groups FK to point to humans table');
    
    // Test the fix
    console.log('\n🧪 Testing group creation...');
    const result = await sql`
      INSERT INTO expense_groups (name, created_by)
      VALUES ('Test Success', '6d916ed5-f539-4a51-9e17-044d81c956d2')
      RETURNING id, name, created_by
    `;
    console.log('✅ Group created successfully:', result[0].name);
    
    // Clean up
    await sql`DELETE FROM expense_groups WHERE name = 'Test Success'`;
  })
  .catch((error) => {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  })
  .finally(() => sql.end());
