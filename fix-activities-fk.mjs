#!/usr/bin/env node
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import postgres from 'postgres';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env.local
if (!process.env.DATABASE_URL) {
  try {
    const envPath = path.resolve(__dirname, '.env.local');
    const envContent = fs.readFileSync(envPath, 'utf-8');
    envContent.split('\n').forEach((line) => {
      if (line.trim() && !line.startsWith('#')) {
        const [key, ...valueParts] = line.split('=');
        const value = valueParts.join('=').trim();
        if (key && value && !process.env[key.trim()]) {
          process.env[key.trim()] = value.replace(/^["']|["']$/g, '');
        }
      }
    });
  } catch (error) {
    console.warn('Warning: Could not load .env.local');
  }
}

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('DATABASE_URL environment variable is not set');
  process.exit(1);
}

const sql = postgres(databaseUrl);

async function fixForeignKey() {
  try {
    console.log('Fixing activities foreign key constraint...\n');

    // Step 1: Drop the incorrect foreign key
    console.log('Step 1: Dropping incorrect activities_event_id_fk constraint...');
    try {
      await sql`ALTER TABLE activities DROP CONSTRAINT activities_event_id_fk`;
      console.log('✅ Dropped\n');
    } catch (e) {
      console.log('⚠️  Constraint may not exist, continuing...\n');
    }

    // Step 2: Add the correct foreign key
    console.log('Step 2: Adding correct foreign key to events table...');
    await sql`
      ALTER TABLE activities 
      ADD CONSTRAINT activities_event_id_fk 
      FOREIGN KEY (event_id) 
      REFERENCES events(id) 
      ON DELETE CASCADE
    `;
    console.log('✅ Added\n');

    // Step 3: Verify the constraint
    console.log('Step 3: Verifying constraint...');
    const constraints = await sql`
      SELECT constraint_name, table_name, column_name, referenced_table_name
      FROM information_schema.key_column_usage
      WHERE table_name = 'activities' AND column_name = 'event_id'
    `;

    if (constraints.length > 0) {
      constraints.forEach((c) => {
        console.log(`✅ Constraint: ${c.constraint_name}`);
        console.log(`   Table: ${c.table_name}`);
        console.log(`   Column: ${c.column_name}`);
        console.log(`   References: ${c.referenced_table_name}`);
      });
    }

    console.log('\n✅ Foreign key constraint fixed!');
    await sql.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

fixForeignKey();
