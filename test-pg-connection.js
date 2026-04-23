// Debug PostgreSQL connection with pg client
import { Client } from 'pg';

async function testConnection() {
  // Test: Connect with password
  const client = new Client({
    connectionString: 'postgresql://postgres:postgres@127.0.0.1:5432/split_db',
    ssl: false,
  });

  console.log('Testing connection to PostgreSQL...');
  try {
    await client.connect();
    console.log('✅ Connection successful!');
    const result = await client.query('SELECT version()');
    console.log('PostgreSQL version:', result.rows[0].version.split(',')[0]);
    await client.end();
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    await client.end().catch(() => {});
  }
}

testConnection().catch((err) => {
  console.error('Test script error:', err);
  process.exit(1);
});
