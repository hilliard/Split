import { readFileSync } from 'fs';
import { resolve } from 'path';
import postgres from 'postgres';

// Load env
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

// Read migration
const migrationSql = readFileSync('src/db/migrations/0003_add_settlements_table.sql', 'utf-8');

// Connect and run
const sql = postgres(databaseUrl);

async function applyMigration() {
  try {
    console.log('Applying settlements migration...');

    // Split by statement-breakpoint
    const statements = migrationSql
      .split('--> statement-breakpoint')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    for (const statement of statements) {
      console.log('Executing:', statement.substring(0, 50) + '...');
      await sql.unsafe(statement);
    }

    console.log('✓ Migration applied successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error.message);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

applyMigration();
