import pg from 'pg';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL not found in .env.local');
  process.exit(1);
}

const client = new pg.Client({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function applyMigration() {
  try {
    await client.connect();
    console.log('✓ Connected to database');

    // Read migration file
    const migrationPath = path.join('.', 'migrations', '021-fix-expenses-paid-by-fk.sql');
    const sql = fs.readFileSync(migrationPath, 'utf-8');

    console.log('📝 Executing migration...');
    console.log(sql);

    await client.query(sql);

    console.log('✅ Migration applied successfully!');
  } catch (error) {
    console.error('❌ Error applying migration:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

applyMigration();
