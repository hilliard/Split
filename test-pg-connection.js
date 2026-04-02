// Debug PostgreSQL connection with pg client
import { Client } from 'pg';

async function testConnection() {
  // Test 1: Connect to 127.0.0.1 with explicit password
  const client1 = new Client({
    host: '127.0.0.1',
    port: 5432,
    user: 'postgres',
    password: 'postgres', 
    database: 'split_db',
  });

  console.log('Test 1: Testing connection to 127.0.0.1 with password...');
  try {
    await client1.connect();
    console.log('✅ TEST 1 PASSED: Connected successfully!');
    const result = await client1.query('SELECT version()');
    console.log('  PostgreSQL version:', result.rows[0].version.split(',')[0]);
    await client1.end();
  } catch (error) {
    console.error('❌ TEST 1 FAILED:', error.message);
    console.error('  Code:', error.code);
    await client1.end().catch(() => {});
  }

  // Test 2: Try with connection string
  const client2 = new Client({
    connectionString: 'postgresql://postgres:postgres@127.0.0.1:5432/split_db',
  });

  console.log('\nTest 2: Testing connection string format...');
  try {
    await client2.connect();
    console.log('✅ TEST 2 PASSED: Connected successfully!');
    const result = await client2.query('SELECT COUNT(*) as cnt FROM users');
    console.log('  Users table count:', result.rows[0].cnt);
    await client2.end();
  } catch (error) {
    console.error('❌ TEST 2 FAILED:', error.message);
    console.error('  Code:', error.code);
    await client2.end().catch(() => {});
  }

  // Test 3: Try trust (no password)
  const client3 = new Client({
    host: '127.0.0.1',
    port: 5432,
    user: 'postgres',
    database: 'split_db',
    password: undefined,
  });

  console.log('\nTest 3: Testing with no password (trust auth)...');
  try {
    await client3.connect();
    console.log('✅ TEST 3 PASSED: Connected successfully!');
    await client3.end();
  } catch (error) {
    console.error('❌ TEST 3 FAILED:', error.message);
    console.error('  Code:', error.code);
    await client3.end().catch(() => {});
  }
}

testConnection().catch(err => {
  console.error('Test script error:', err);
  process.exit(1);
});
