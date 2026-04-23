import { readFileSync } from 'fs';
import { resolve } from 'path';
import pkg from 'pg';

const { Client } = pkg;

// Load .env.local
const envPath = resolve('.env.local');
const envContent = readFileSync(envPath, 'utf-8');
const envVars = {};

envContent.split('\n').forEach((line) => {
  if (line.trim() && !line.startsWith('#')) {
    const [key, ...valueParts] = line.split('=');
    const value = valueParts.join('=').trim();
    if (key && value) {
      envVars[key.trim()] = value.replace(/^["']|["']$/g, '');
    }
  }
});

const databaseUrl = envVars['DATABASE_URL'];

if (!databaseUrl) {
  console.error('DATABASE_URL not found in .env.local');
  process.exit(1);
}

const client = new Client({
  connectionString: databaseUrl,
});

async function diagnoseSchema() {
  try {
    await client.connect();
    console.log('✓ Connected to database\n');

    // Check if expenses table exists
    const tableExists = await client.query(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'expenses'
      );
    `);

    if (!tableExists.rows[0].exists) {
      console.log('❌ Expenses table does not exist!');
      process.exit(1);
    }

    console.log('✓ Expenses table exists\n');

    // Get all columns in expenses table
    const columns = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'expenses'
      ORDER BY ordinal_position;
    `);

    console.log('📊 Expenses table columns:');
    console.log('─'.repeat(60));
    columns.rows.forEach((col) => {
      const nullable = col.is_nullable === 'YES' ? '(nullable)' : '(NOT NULL)';
      console.log(`  ${col.column_name.padEnd(20)} ${col.data_type.padEnd(20)} ${nullable}`);
    });

    // Count rows
    const rowCount = await client.query('SELECT COUNT(*) FROM "expenses"');
    console.log(`\n📈 Total rows in expenses: ${rowCount.rows[0].count}`);

    // Show sample row if any exist
    if (rowCount.rows[0].count > 0) {
      const sample = await client.query('SELECT * FROM "expenses" LIMIT 1');
      console.log('\n📋 Sample row keys:', Object.keys(sample.rows[0]));
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

diagnoseSchema();
