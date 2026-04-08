import pg from 'pg';

const pool = new pg.Pool({
  host: 'localhost',
  port: 5432,
  database: 'split_db',
  user: 'postgres',
  password: 'postgres',
});

try {
  const result = await pool.query('SELECT version()');
  console.log('✓ Connection successful!');
  console.log(result.rows[0]);
  process.exit(0);
} catch (error) {
  console.error('❌ Connection failed:', error.message);
  process.exit(1);
}
