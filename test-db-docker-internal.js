import pg from 'pg';
const { Pool } = pg;

// Test from inside container using localhost
const pool = new Pool({
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  database: 'split_db',
});

pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('❌ localhost error:', err.message);
  } else {
    console.log('✅ localhost works!', res.rows[0].now);
  }
  
  // Now try with 127.0.0.1 from inside container
  const pool2 = new Pool({
    host: '127.0.0.1' ,
    port: 5432,
    user: 'postgres',
    database: 'split_db',
  });
  
  pool2.query('SELECT NOW()', (err, res) => {
    if (err) {
      console.error('❌ 127.0.0.1 error:', err.message);
    } else {
      console.log('✅ 127.0.0.1 works!', res.rows[0].now);
    }
    pool.end();
    pool2.end();
  });
});