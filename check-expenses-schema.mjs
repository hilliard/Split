#!/usr/bin/env node

import pkg from 'pg';
const { Client } = pkg;
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local', override: true });

const connectionString = process.env.DATABASE_URL;
const client = new Client({ connectionString });

try {
  await client.connect();

  const result = await client.query(`
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns
    WHERE table_name = 'expenses'
    ORDER BY ordinal_position;
  `);

  console.log('Expenses table columns in database:');
  result.rows.forEach(row => {
    console.log(`  • ${row.column_name}: ${row.data_type} (${row.is_nullable === 'YES' ? 'nullable' : 'NOT NULL'})`);
  });

  await client.end();
} catch (error) {
  console.error('Error:', error.message);
}
