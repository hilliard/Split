import pg from 'pg';
import { readFileSync } from 'fs';
import { resolve } from 'path';

if (!process.env.DATABASE_URL) {
  try {
    const envPath = resolve('.env.local');
    const envContent = readFileSync(envPath, 'utf-8');
    envContent.split('\n').forEach((line) => {
      if (line.trim() && !line.startsWith('#')) {
        const [key, ...valueParts] = line.split('=');
        const value = valueParts.join('=').trim();
        if (key && value && !process.env[key.trim()]) {
          process.env[key.trim()] = value.replace(/^["']|["']$/g, '');
        }
      }
    });
  } catch (e) {
    console.error('Failed to load .env.local');
  }
}

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function checkSchema() {
  try {
    console.log('🔍 Checking events table schema...\n');

    const result = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'events'
      ORDER BY ordinal_position;
    `);

    if (result.rows.length === 0) {
      console.log('❌ No columns found in events table');
      process.exit(1);
    }

    console.log('📋 Events table columns:');
    console.log('─'.repeat(60));
    result.rows.forEach((row) => {
      const nullable = row.is_nullable === 'YES' ? 'nullable' : 'NOT NULL';
      console.log(`  ${row.column_name.padEnd(20)} | ${row.data_type.padEnd(20)} | ${nullable}`);
    });
    console.log('─'.repeat(60));

    // Check for critical columns
    const columns = result.rows.map((r) => r.column_name);
    const required = [
      'id',
      'creator_id',
      'title',
      'description',
      'type',
      'status',
      'start_time',
      'end_time',
      'timezone',
      'is_virtual',
      'is_public',
      'currency',
      'budget_cents',
      'metadata',
      'created_at',
    ];

    const missing = required.filter((col) => !columns.includes(col));
    const extra = columns.filter(
      (col) =>
        !required.includes(col) &&
        col !== 'group_id' &&
        col !== 'location' &&
        col !== 'venue_id' &&
        col !== 'updated_at'
    );

    if (missing.length > 0) {
      console.log(`\n⚠️  Missing columns: ${missing.join(', ')}`);
    }
    if (extra.length > 0) {
      console.log(`\n✅ Extra columns: ${extra.join(', ')}`);
    }

    const hasTitle = columns.includes('title');
    if (hasTitle) {
      console.log('\n✅ Title column exists!');
    } else {
      console.log('\n❌ Title column does not exist');
    }

    console.log('\n✨ Schema check complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkSchema();
