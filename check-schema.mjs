import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function checkSchema() {
  try {
    const result = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'events'
      ORDER BY ordinal_position
    `);

    console.log('\n📋 Events Table Schema:\n');
    result.rows.forEach((row) => {
      const nullable = row.is_nullable === 'YES' ? '(nullable)' : '(required)';
      console.log(`  ${row.column_name.padEnd(20)} ${row.data_type.padEnd(15)} ${nullable}`);
    });

    console.log('\n');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

checkSchema();
