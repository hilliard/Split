import postgres from 'postgres';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('❌ DATABASE_URL environment variable not set');
  process.exit(1);
}

const sql = postgres(connectionString, { ssl: 'require' });

async function checkSchema() {
  try {
    console.log('🔍 Checking expense_groups table schema');
    console.log('─'.repeat(60));

    // Check if table exists
    const tableExists = await sql`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'expense_groups'
      )
    `;
    console.log(`\n✓ Table exists: ${tableExists[0].exists}`);

    // Get columns
    const columns = await sql`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'expense_groups'
      ORDER BY ordinal_position
    `;
    console.log('\n📋 Columns:');
    columns.forEach((col) => {
      console.log(
        `  - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'} ${col.column_default ? `DEFAULT ${col.column_default}` : ''}`
      );
    });

    // Get constraints
    const constraints = await sql`
      SELECT constraint_name, constraint_type
      FROM information_schema.table_constraints
      WHERE table_name = 'expense_groups'
    `;
    console.log('\n🔐 Constraints:');
    constraints.forEach((c) => {
      console.log(`  - ${c.constraint_name} (${c.constraint_type})`);
    });

    // Get foreign keys
    const fks = await sql`
      SELECT 
        constraint_name,
        column_name,
        referenced_table_name,
        referenced_column_name
      FROM information_schema.referential_constraints rc
      JOIN information_schema.key_column_usage kcu ON rc.constraint_name = kcu.constraint_name
      WHERE kcu.table_name = 'expense_groups'
    `;
    console.log('\n🔗 Foreign Keys:');
    if (fks.length === 0) {
      console.log('  (none)');
    } else {
      fks.forEach((fk) => {
        console.log(
          `  - FK: ${fk.column_name} -> ${fk.referenced_table_name}.${fk.referenced_column_name}`
        );
      });
    }

    // Try inserting a test record
    console.log('\n─'.repeat(60));
    console.log('Testing INSERT...');

    const testId = '00000000-0000-0000-0000-000000000001';
    const testUserId = '6d916ed5-f539-4a51-9e17-044d81c956d2';

    try {
      const result = await sql`
        INSERT INTO expense_groups (id, name, created_by, created_at)
        VALUES (${testId}, 'TEST', ${testUserId}, NOW())
        RETURNING id, name, created_by
      `;
      console.log('✅ INSERT succeeded:', result[0]);

      // Clean up
      await sql`DELETE FROM expense_groups WHERE id = ${testId}`;
    } catch (insertError) {
      console.error('❌ INSERT failed:', insertError.message);
      if (insertError.detail) {
        console.error('   Detail:', insertError.detail);
      }
    }

    console.log('\n' + '─'.repeat(60));
  } catch (error) {
    console.error('❌ Error:', error instanceof Error ? error.message : error);
  } finally {
    await sql.end();
  }
}

checkSchema();
