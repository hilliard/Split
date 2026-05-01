import { db } from './src/db/index';
import { sql } from 'drizzle-orm';

async function check() {
  try {
    const res = await db.execute(sql`SELECT * FROM settlements ORDER BY created_at DESC LIMIT 5;`);
    console.log('Recent Settlements:', res.rows);
    const humans = await db.execute(sql`SELECT id, first_name FROM humans;`);
    console.log('Humans:', humans.rows);
  } catch (error) {
    console.error('Error:', error);
  }
  process.exit(0);
}

check();
