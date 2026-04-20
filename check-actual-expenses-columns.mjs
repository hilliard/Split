import postgres from 'postgres';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const sql = postgres(process.env.DATABASE_URL);

try {
  console.log('\n📋 Actual columns in expenses table:\n');
  
  const result = await sql`
    SELECT column_name, data_type, is_nullable 
    FROM information_schema.columns 
    WHERE table_name = 'expenses'
    ORDER BY ordinal_position
  `;
  
  result.forEach(col => {
    console.log(`  ${col.column_name.padEnd(20)} | ${col.data_type.padEnd(18)} | ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
  });
  
} catch (error) {
  console.error('Error:', error.message);
} finally {
  await sql.end();
}
