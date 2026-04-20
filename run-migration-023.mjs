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

console.log('📋 Running migration 023: Ensure expenses foreign keys\n');

const client = new Client({
    connectionString
});

try {
    await client.connect();
    console.log('✅ Connected to database\n');

    // Read the migration file
    const migrationPath = path.join(import.meta.url.replace('file:///', ''), '../migrations/023-ensure-expenses-foreign-keys.sql');
    const migrationFile = path.join(process.cwd(), 'migrations/023-ensure-expenses-foreign-keys.sql');
    const sql = fs.readFileSync(migrationFile, 'utf-8');

    console.log('🔄 Executing migration...\n');
    const result = await client.query(sql);
    
    console.log('✅ Migration completed successfully!\n');

    // Check the result
    console.log('📊 Verifying foreign keys were added...\n');

    const checkQuery = `
        SELECT tc.table_name, tc.constraint_name, tc.constraint_type
        FROM information_schema.table_constraints tc
        WHERE tc.table_name = 'expenses'
        ORDER BY tc.constraint_name;
    `;

    const checkResult = await client.query(checkQuery);
    console.log('Foreign key constraints on expenses table:');
    checkResult.rows.forEach(row => {
        console.log(`  ✓ ${row.constraint_name} (${row.constraint_type})`);
    });

    await client.end();
    console.log('\n✅ Migration verification complete!');
    
} catch (error) {
    console.error('❌ Migration failed:', error.message);
    if (error.detail) console.error('Details:', error.detail);
    process.exit(1);
}
