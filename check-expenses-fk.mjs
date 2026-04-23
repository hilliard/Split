import postgres from 'postgres';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const connStr = process.env.DATABASE_URL;
if (!connStr) {
  console.error('❌ DATABASE_URL not set');
  process.exit(1);
}

const sql = postgres(connStr);

try {
  console.log('🔍 Checking expenses table structure...');

  // Check columns
  const columns = await sql`
    SELECT column_name, data_type, is_nullable, column_default 
    FROM information_schema.columns 
    WHERE table_name = 'expenses'
    ORDER BY ordinal_position
  `;

  console.log('\n📋 Expenses Columns:');
  columns.forEach((col) => {
    console.log(
      `  ${String(col.column_name).padEnd(20)} | ${String(col.data_type).padEnd(15)} | NULL: ${String(col.is_nullable).padEnd(3)}`
    );
  });

  // Check foreign keys
  const fks = await sql`
    SELECT constraint_name, column_name, foreign_table_name, foreign_column_name
    FROM information_schema.key_column_usage 
    WHERE table_name = 'expenses' AND foreign_table_name IS NOT NULL
  `;

  console.log('\n🔗 Foreign Keys:');
  if (fks.length === 0) {
    console.log('  (none found)');
  } else {
    fks.forEach((fk) => {
      console.log(`  ${fk.column_name} → ${fk.foreign_table_name}(${fk.foreign_column_name})`);
    });
  }

  // Check some sample data
  const samples = await sql`SELECT COUNT(*) as count FROM expenses`;
  console.log(`\n📊 Expenses rows: ${samples[0].count}`);

  if (samples[0].count > 0) {
    const first = await sql`SELECT * FROM expenses LIMIT 1`;
    console.log('\n📄 Sample expense:');
    console.log(JSON.stringify(first[0], null, 2));
  }
} catch (error) {
  console.error('❌ Error:', error.message);
  if (error.detail) console.error('Detail:', error.detail);
} finally {
  await sql.end();
}
