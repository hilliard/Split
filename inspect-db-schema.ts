#!/usr/bin/env node
import { db } from './src/db/index.ts';
import { sql } from 'drizzle-orm';

try {
  const result = await db.execute(sql`
    SELECT column_name, data_type, is_nullable 
    FROM information_schema.columns 
    WHERE table_name = 'expenses'
    ORDER BY ordinal_position
  `);

  console.log('\n📋 ACTUAL DATABASE SCHEMA FOR EXPENSES TABLE:');
  console.log('='.repeat(80));
  if (result && result.length > 0) {
    result.forEach((col: any) => {
      const nullable = col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
      console.log(
        `  ${String(col.column_name).padEnd(20)} | ${String(col.data_type).padEnd(20)} | ${nullable}`
      );
    });
  } else {
    console.log('  (no results)');
  }

  console.log('\n');
} catch (error) {
  console.error('❌ Error querying database:', error);
  process.exit(1);
} finally {
  process.exit(0);
}
