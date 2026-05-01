import { db } from './src/db/index';
import { sql } from 'drizzle-orm';

async function resetSettlements() {
  try {
    const res = await db.execute(sql`DELETE FROM settlements;`);
    console.log('✅ Successfully wiped out all test settlements!');
    console.log(`Deleted rows: ${res.rowCount}`);
  } catch (error) {
    console.error('❌ Error wiping settlements:', error);
  }
  process.exit(0);
}

resetSettlements();
