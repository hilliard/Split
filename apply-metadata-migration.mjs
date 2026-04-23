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

async function applyMigration() {
  try {
    await client.connect();
    console.log('Connected to database...');

    // SQL migration to add metadata column to expenses
    const SQL = `ALTER TABLE "expenses" ADD COLUMN "metadata" json DEFAULT '{}'::json;`;

    console.log('Applying migration: ADD COLUMN metadata to expenses table');
    await client.query(SQL);
    console.log('✅ Migration applied successfully!');
  } catch (err) {
    if (err.message.includes('already exists')) {
      console.log('ℹ️  Column metadata already exists - skipping');
    } else {
      console.error('❌ Error applying migration:', err.message);
      console.error(err);
      process.exit(1);
    }
  } finally {
    await client.end();
  }
}

applyMigration();
