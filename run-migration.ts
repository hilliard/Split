import pg from 'pg';
import { readFileSync, readdirSync } from 'fs';
import { resolve } from 'path';
const { Pool } = pg;

// Load .env.local
const envPath = resolve('.env.local');
const envContent = readFileSync(envPath, 'utf-8');
const envVars: Record<string, string> = {};
envContent.split('\n').forEach(line => {
  if (line.trim() && !line.startsWith('#')) {
    const [key, ...valueParts] = line.split('=');
    const value = valueParts.join('=').trim();
    if (key && value) {
      envVars[key.trim()] = value.replace(/^["']|["']$/g, '');
    }
  }
});

const DATABASE_URL = envVars['DATABASE_URL'];
if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL not found in .env.local');
  process.exit(1);
}

async function main() {
  const pool = new Pool({ connectionString: DATABASE_URL });
  
  try {
    const client = await pool.connect();
    console.log('✓ Connected to database');
    
    // Get list of migration files
    const migrationsDir = resolve('./migrations');
    const migrationFiles = readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort();
    
    console.log(`\n📁 Found ${migrationFiles.length} migration files:`);
    migrationFiles.forEach(f => console.log(`   - ${f}`));
    
    // Execute first migration
    const firstMigration = migrationFiles[0];
    if (!firstMigration) {
      console.log('No migration files found');
      client.release();
      process.exit(0);
    }
    
    console.log(`\n🔄 Running: ${firstMigration}`);
    const migrationSQL = readFileSync(resolve(migrationsDir, firstMigration), 'utf-8');
    
    // Execute the entire migration as a single transaction
    try {
      await client.query(migrationSQL);
      console.log('✅ Migration completed successfully!');
    } catch (error) {
      console.error('❌ Migration failed:', error);
    }
    
    client.release();
    process.exit(0);
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
