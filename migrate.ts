import { readFileSync } from 'fs';
import { resolve } from 'path';
import pkg from 'pg';

const { Client } = pkg;

// Load .env.local
const envPath = resolve('.env.local');
const envContent = readFileSync(envPath, 'utf-8');
const envVars: Record<string, string> = {};

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

async function applyMigrations() {
  try {
    await client.connect();
    console.log('Connected to database');

    // MODIFIED: Grab the file path from the command line, 
    // or default to the init file if nothing is provided.
    
    const targetFile = process.argv[2] || 'src/db/migrations/0000_init.sql';
    const migrationPath = resolve(targetFile);
    
    console.log(`Loading migration file: ${targetFile}`);
    const migrationSQL = readFileSync(migrationPath, 'utf-8');

    // Split by statement breakpoint and execute
    const statements = migrationSQL
      .split('--> statement-breakpoint')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    for (const statement of statements) {
      console.log(`Executing: ${statement.substring(0, 50)}...`);
      await client.query(statement);
    }

    console.log('✓ All migrations applied successfully!');
  } catch (error: any) {
    if (error.code === '42P7' || error.message.includes('already exists')) {
      console.log('✓ Tables already exist, skipping...');
    } else {
      console.error('Error applying migrations:', error.message);
      process.exit(1);
    }
  } finally {
    await client.end();
  }
}

applyMigrations();