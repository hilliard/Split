import postgres from 'postgres';

const sql = postgres(process.env.DATABASE_URL);

try {
  const result = await sql`
    SELECT column_name, data_type, is_nullable, column_default 
    FROM information_schema.columns 
    WHERE table_name = 'expenses'
    ORDER BY ordinal_position
  `;
  
  console.log('📋 Expenses Table Schema:');
  console.log('='.repeat(80));
  result.forEach(col => {
    console.log(`  ${col.column_name.padEnd(20)} | ${col.data_type.padEnd(15)} | Nullable: ${col.is_nullable.padEnd(3)} | Default: ${col.column_default || '(none)'}`);
  });
  
  console.log('\n📊 Row count:', (await sql`SELECT COUNT(*) as count FROM expenses`)[0].count);
  
} catch (error) {
  console.error('❌ Error:', error.message);
} finally {
  await sql.end();
}
