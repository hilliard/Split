import postgres from 'postgres';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const sql = postgres(process.env.DATABASE_URL);

try {
  const result = await sql`SELECT version()`;
  console.log('✅ postgres.js WORKS!');
  console.log('Version:', result[0].version.split(',')[0]);
  await sql.end();
} catch (err) {
  console.error('❌ FAILED:', err.message);
  await sql.end();
}
