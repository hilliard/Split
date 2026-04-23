import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function checkConstraints() {
  try {
    const result = await pool.query(`
      SELECT constraint_name, table_name, column_name
      FROM information_schema.key_column_usage
      WHERE table_name = 'events'
      ORDER BY constraint_name
    `);

    console.log('\n📋 Constraints on "events" table:\n');
    if (result.rows.length === 0) {
      console.log('(no constraints found)\n');
    } else {
      result.rows.forEach((c) => {
        console.log(`Constraint: ${c.constraint_name}`);
        console.log(`  Column: ${c.column_name}`);
        console.log('');
      });
    }

    // Also check all table constraints
    console.log('\n📋 All constraints on "events" table:\n');
    const allConstraints = await pool.query(`
      SELECT conname, contype
      FROM pg_constraint
      WHERE conrelid = 'events'::regclass
      ORDER BY conname
    `);

    allConstraints.rows.forEach((c) => {
      console.log(`${c.conname} (type: ${c.contype})`);
    });
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkConstraints();
