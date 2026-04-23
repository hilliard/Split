import postgres from 'postgres';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('❌ DATABASE_URL environment variable not set');
  process.exit(1);
}

const sql = postgres(connectionString, { ssl: 'require' });

async function checkFK() {
  try {
    console.log('🔍 Checking foreign key constraint');
    console.log('─'.repeat(60));

    // Get FK details
    const fks = await sql`
      SELECT
        tc.constraint_name,
        tc.table_name,
        kcu.column_name,
        ccu.table_name AS referenced_table,
        ccu.column_name AS referenced_column
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
      WHERE tc.table_name = 'expense_groups' AND tc.constraint_type = 'FOREIGN KEY'
    `;

    console.log('\n🔗 Foreign Keys:');
    fks.forEach((fk) => {
      console.log(`  ${fk.constraint_name}:`);
      console.log(
        `    ${fk.table_name}.${fk.column_name} -> ${fk.referenced_table}.${fk.referenced_column}`
      );
    });

    // Check if the user ID exists
    const userId = '6d916ed5-f539-4a51-9e17-044d81c956d2';
    console.log(`\n👤 Checking if human ${userId} exists...`);

    const human = await sql`SELECT id FROM humans WHERE id = ${userId}`;
    console.log(`  ${human.length > 0 ? '✅ EXISTS' : '❌ NOT FOUND'}`);

    // Try the insert
    console.log('\n📝 Attempting INSERT...');
    try {
      const result = await sql`
        INSERT INTO expense_groups (name, created_by)
        VALUES ('Test Group', ${userId})
        RETURNING id, name, created_by
      `;
      console.log('✅ INSERT succeeded!');
      console.log('   Created:', result[0]);

      // Clean up
      await sql`DELETE FROM expense_groups WHERE name = 'Test Group'`;
      console.log('   (cleaned up test record)');
    } catch (err) {
      console.error('❌ INSERT failed');
      console.error('   Code:', err.code);
      console.error('   Message:', err.message);
      if (err.detail) console.error('   Detail:', err.detail);
    }

    console.log('\n' + '─'.repeat(60));
  } catch (error) {
    console.error('❌ Error:', error instanceof Error ? error.message : error);
  } finally {
    await sql.end();
  }
}

checkFK();
