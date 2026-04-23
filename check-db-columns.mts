import { db } from './src/db/index.ts';
import { sql } from 'drizzle-orm';

console.log('Checking customers table columns...');
const result = await db.execute(
  sql.raw(`
  SELECT column_name, data_type, is_nullable
  FROM information_schema.columns
  WHERE table_name = 'customers'
  ORDER BY ordinal_position;
`)
);

console.log('✓ Customers table columns:');
if (Array.isArray(result)) {
  result.forEach((col) => {
    console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
  });
} else if (result.rows) {
  result.rows.forEach((col) => {
    console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
  });
} else {
  console.log(JSON.stringify(result, null, 2));
}

console.log('\nChecking if email_verification_tokens table exists...');
const tableCheck = await db.execute(
  sql.raw(`
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_name = 'email_verification_tokens'
  ) as exists;
`)
);

console.log('Email verification tokens table exists:', tableCheck[0].exists);

console.log('\n✅ Database schema check complete!');
process.exit(0);
