import postgres from 'postgres';

const sql = postgres({
  host: '127.0.0.1',
  port: 5432,
  username: 'postgres',
  password: 'postgres',
  database: 'split_db',
});

try {
  const result = await sql`SELECT version()`;
  console.log('✅ postgres.js WORKS!');
  console.log('Version:', result[0].version.split(',')[0]);
  await sql.end();
} catch (err) {
  console.error('❌ FAILED:', err.message);
  await sql.end();
}
