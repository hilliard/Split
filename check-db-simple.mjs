import pkg from 'pg';
const { Pool } = pkg;

const url = new URL(process.env.DATABASE_URL);
const pool = new Pool({
  host: url.hostname,
  port: url.port,
  database: url.pathname.slice(1),
  user: url.username,
  password: url.password,
  ssl: 'require',
});

try {
  // Check tables
  const tables = await pool.query(`
    SELECT tablename FROM pg_tables 
    WHERE schemaname = 'public'
    ORDER BY tablename;
  `);

  console.log('Tables in database:');
  tables.rows.forEach((row) => console.log(`  - ${row.tablename}`));

  // Check customers columns
  const columns = await pool.query(`
    SELECT column_name, data_type
    FROM information_schema.columns
    WHERE table_name = 'customers'
    ORDER BY ordinal_position;
  `);

  console.log('\nCustomers table columns:');
  columns.rows.forEach((row) => console.log(`  - ${row.column_name}: ${row.data_type}`));

  pool.end();
} catch (error) {
  console.error('Error:', error.message);
  process.exit(1);
}
