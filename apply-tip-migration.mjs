import { readFileSync } from 'fs';
import { resolve } from 'path';
import pkg from 'pg';

const { Client } = pkg;

// Load .env.local
const envPath = resolve('.env.local');
const envContent = readFileSync(envPath, 'utf-8');
const envVars = {};

envContent.split('\n').forEach(line => {
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

async function applyTipTrackingMigration() {
  try {
    await client.connect();
    console.log('✓ Connected to database');

    // Read the tip tracking migration
    const migrationPath = resolve('migrations/020-add-tip-tracking.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf-8');

    console.log('Executing tip tracking migration...');
    await client.query(migrationSQL);
    console.log('✓ Tip tracking migration applied successfully!');
  } catch (error) {
    if (error.message.includes('already exists')) {
      console.log('✓ Migration already applied (column already exists)');
    } else {
      console.error('Error applying migration:', error.message);
      console.error(error);
      process.exit(1);
    }
  } finally {
    await client.end();
  }
}

applyTipTrackingMigration();
