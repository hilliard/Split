import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

try {
  const result = await pool.query(`
    SELECT c.id, c.username, c.email, c.email_verified, h.id as human_id
    FROM customers c
    LEFT JOIN humans h ON c.human_id = h.id
    WHERE c.username = 'testuser_2026'
  `);

  console.log('✅ User Status for testuser_2026:');
  if (result.rows.length > 0) {
    const user = result.rows[0];
    console.log(`  Email: ${user.email || 'NOT SET'}`);
    console.log(`  Email Verified: ${user.email_verified ? 'YES ✓' : 'NO ✗'}`);
    console.log(`  Human ID: ${user.human_id}`);
    console.log(`  Customer ID: ${user.id}`);
  } else {
    console.log('❌ User NOT found in database');
  }
} catch (error) {
  console.error('❌ Error:', error.message);
} finally {
  await pool.end();
  process.exit(0);
}
