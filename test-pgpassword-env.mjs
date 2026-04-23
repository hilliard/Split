import pg from 'pg';

const config = {
  host: 'localhost',
  port: 5432,
  database: 'split_db',
  user: 'postgres',
  // Try explicitly NOT providing password, see if PGPASSWORD env var is used
};

console.log('Testing with PGPASSWORD env var...');
const pool = new pg.Pool(config);

try {
  const result = await pool.query('SELECT version()');
  console.log('✓ Connection successful!');
  console.log(result.rows[0].version);
  process.exit(0);
} catch (error) {
  console.error('❌ Connection failed:', error.message);
  process.exit(1);
}
