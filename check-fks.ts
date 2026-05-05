import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve('.env.local') });

import postgres from 'postgres';

async function checkFks() {
  try {
    const sql = postgres(process.env.DATABASE_URL!);
    
    const constraints = await sql`
      SELECT
          tc.table_name, 
          tc.constraint_name, 
          tc.constraint_type,
          rc.delete_rule
      FROM 
          information_schema.table_constraints tc
      LEFT JOIN 
          information_schema.referential_constraints rc
          ON tc.constraint_name = rc.constraint_name
      WHERE 
          tc.table_name = 'expenses' AND tc.constraint_type = 'FOREIGN KEY';
    `;
    
    console.log(constraints);
    
    await sql.end();
  } catch (e) {
    console.error('Fatal error:', e);
  }
  process.exit(0);
}

checkFks();
