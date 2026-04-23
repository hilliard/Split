import { Pool } from 'pg';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Load .env.local
const envPath = resolve('.env.local');
const envContent = readFileSync(envPath, 'utf-8');
const env = {};

envContent.split('\n').forEach((line) => {
  if (line.trim() && !line.startsWith('#')) {
    const [key, ...valueParts] = line.split('=');
    const value = valueParts
      .join('=')
      .trim()
      .replace(/^["']|["']$/g, '');
    if (key && value) {
      env[key.trim()] = value;
    }
  }
});

const DATABASE_URL = env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('DATABASE_URL not found in .env.local');
  process.exit(1);
}

const pool = new Pool({ connectionString: DATABASE_URL });

async function runMigration() {
  const client = await pool.connect();

  try {
    console.log('Running migration: 008-add-group-to-events.sql');

    // Read migration file
    const migrationPath = resolve('migrations/008-add-group-to-events.sql');
    const migration = readFileSync(migrationPath, 'utf-8');

    // Execute migration
    await client.query(migration);
    console.log('✓ Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration();
