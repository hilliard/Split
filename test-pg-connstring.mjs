import pg from 'pg';

// Test with connection string
const pool = new pg.Pool({
  connectionString: 'postgresql://postgres@localhost:5432/split_db',
});

try {
  const result = await pool.query('SELECT version()');
  console.log('✓ Connection successful with connectionString!');
  console.log(result.rows[0].version);
  process.exit(0);
} catch (error) {
  console.error('❌ Connection failed:', error.message);
  process.exit(1);
}
