import postgres from 'postgres';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('❌ DATABASE_URL environment variable not set');
  process.exit(1);
}

const sql = postgres(connectionString, { ssl: 'require' });

async function fixExpenseSplitsFK() {
  try {
    console.log('🔍 Finding all expense_splits FKs on user_id');
    console.log('─'.repeat(60));

    // Get all constraints on expense_splits.user_id
    const constraints = await sql`
      SELECT DISTINCT tc.constraint_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
      WHERE tc.table_name = 'expense_splits' 
        AND kcu.column_name = 'user_id'
        AND tc.constraint_type = 'FOREIGN KEY'
    `;

    console.log(`Found ${constraints.length} FK constraint(s):`);
    constraints.forEach((c) => {
      console.log(`  - ${c.constraint_name}`);
    });

    // Drop all of them
    for (const constraint of constraints) {
      console.log(`\n🔨 Dropping ${constraint.constraint_name}...`);
      try {
        await sql.unsafe(
          `ALTER TABLE expense_splits DROP CONSTRAINT "${constraint.constraint_name}"`
        );
        console.log('   ✓ Dropped');
      } catch (err) {
        console.log(`   ⚠️  Already dropped or error: ${err.message}`);
      }
    }

    // Add the correct one
    console.log('\n➕ Adding correct FK constraint...');
    await sql.unsafe(`
      ALTER TABLE expense_splits
      ADD CONSTRAINT expense_splits_user_id_fk 
      FOREIGN KEY (user_id) 
      REFERENCES humans(id) 
      ON DELETE CASCADE
    `);
    console.log('   ✅ Created expense_splits.user_id -> humans.id');

    // Verify
    const final = await sql`
      SELECT tc.constraint_name, ccu.table_name AS referenced_table
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
      WHERE tc.table_name = 'expense_splits' 
        AND tc.constraint_type = 'FOREIGN KEY'
    `;

    console.log('\n✅ Final state:');
    final.forEach((f) => {
      console.log(`  ${f.constraint_name} -> ${f.referenced_table}`);
    });

    console.log('\n' + '─'.repeat(60));
  } catch (error) {
    console.error('❌ Error:', error instanceof Error ? error.message : error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

fixExpenseSplitsFK();
