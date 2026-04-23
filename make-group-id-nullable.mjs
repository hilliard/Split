import postgres from 'postgres';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const sql = postgres(process.env.DATABASE_URL);

try {
  console.log('Making group_id nullable...');

  await sql`ALTER TABLE expenses ALTER COLUMN group_id DROP NOT NULL`;

  console.log('✅ group_id is now nullable');
} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
} finally {
  await sql.end();
}
