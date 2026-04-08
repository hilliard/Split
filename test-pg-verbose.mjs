import pg from 'pg';

const pool = new pg.Pool({
  host: 'localhost',
  port: 5432,
  database: 'split_db',
  user: 'postgres',
  password: 'postgres',
  // Disable pool features that might interfere
  allowExitOnIdle: false,
  idleTimeoutMillis: 0,
  connectionTimeoutMillis: 10000,
});

try {
  console.log('Attempting connection...');
  const client = await pool.connect();
  console.log('✓ Connection successful!');
  const result = await client.query('SELECT version()');
  console.log(result.rows[0].version);
  client.release();
  await pool.end();
  process.exit(0);
} catch (error) {
  console.error('❌ Connection failed:');
  console.error('Message:', error.message);
  console.error('Code:', error.code);
  console.error('Routine:', error.routine);
  process.exit(1);
}
