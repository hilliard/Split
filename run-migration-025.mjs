#!/usr/bin/env node

import pkg from 'pg';
const { Client } = pkg;
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local', override: true });

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('❌ DATABASE_URL not found in .env.local');
  process.exit(1);
}

console.log('📋 Running migration 025: Standardize tip_amount to cents\n');

const client = new Client({
  connectionString,
});

try {
  await client.connect();
  console.log('✅ Connected to database\n');

  // Read the migration file
  const migrationFile = path.join(
    process.cwd(),
    'migrations/025-standardize-tip-amount-to-cents.sql'
  );
  const sql = fs.readFileSync(migrationFile, 'utf-8');

  console.log('🔄 Executing migration...\n');
  await client.query(sql);

  console.log('\n✅ Migration completed successfully!\n');

  // Verify the change
  console.log('📊 Verifying column type change...\n');
  const checkQuery = `
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'expenses' AND column_name = 'tip_amount';
    `;

  const result = await client.query(checkQuery);
  if (result.rows.length > 0) {
    const row = result.rows[0];
    console.log(`Column: ${row.column_name}`);
    console.log(`Type: ${row.data_type}`);
    console.log(`Nullable: ${row.is_nullable}\n`);

    if (row.data_type === 'integer') {
      console.log('✅ VERIFIED: tip_amount is now INTEGER type (cents)\n');
    } else {
      console.log(`⚠️  WARNING: tip_amount is still ${row.data_type}, expected integer\n`);
    }
  }

  await client.end();
  process.exit(0);
} catch (error) {
  console.error('❌ Migration failed:', error.message);
  if (error.detail) console.error('Details:', error.detail);
  process.exit(1);
}
