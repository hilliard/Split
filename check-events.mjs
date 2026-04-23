import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function checkEvents() {
  try {
    const result = await pool.query(`SELECT id, owner_id, name FROM events`);

    console.log('\n📋 Events in database:\n');
    if (result.rows.length === 0) {
      console.log('(no events found)\n');
    } else {
      result.rows.forEach((e) => {
        console.log(`Event: ${e.name}`);
        console.log(`  ID: ${e.id}`);
        console.log(`  Owner ID: ${e.owner_id}`);
        console.log('');
      });
    }
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkEvents();
