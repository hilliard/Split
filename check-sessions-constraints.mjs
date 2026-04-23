import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function checkSessionConstraints() {
  try {
    const result = await pool.query(`
      SELECT conname, confrelid::regclass as referenced_table
      FROM pg_constraint
      WHERE conrelid = 'sessions'::regclass
      ORDER BY conname
    `);

    console.log('\n📋 Constraints on "sessions" table:\n');
    result.rows.forEach((c) => {
      console.log(`Constraint: ${c.conname}`);
      if (c.referenced_table) console.log(`  References: ${c.referenced_table}`);
      console.log('');
    });
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkSessionConstraints();
