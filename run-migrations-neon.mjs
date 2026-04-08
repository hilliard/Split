import pg from 'pg';
import { readFileSync, readdirSync } from 'fs';
import { resolve } from 'path';

// Load env var
if (!process.env.DATABASE_URL) {
  try {
    const envPath = resolve('.env.local');
    const envContent = readFileSync(envPath, 'utf-8');
    envContent.split('\n').forEach(line => {
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

async function runMigrations() {
  try {
    console.log('🚀 Starting migrations...');
    
    // First, run init.sql to create base schema
    console.log('\n▶️  Running: init.sql (base schema)');
    const initPath = resolve('./init.sql');
    const initSql = readFileSync(initPath, 'utf-8');
    
    try {
      await pool.query(initSql);
      console.log('✅ init.sql completed');
    } catch (err) {
      console.error(`❌ init.sql failed:`, err.message);
      // Continue with migrations anyway in case some tables were created
    }
    
    // Get all migration files in order
    const migrationsDir = resolve('./migrations');
    const files = readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort();
    
    console.log(`📁 Found ${files.length} migration files`);
    
    for (const file of files) {
      console.log(`\n▶️  Running: ${file}`);
      const filePath = resolve(migrationsDir, file);
      const sql = readFileSync(filePath, 'utf-8');
      
      try {
        await pool.query(sql);
        console.log(`✅ ${file} completed`);
      } catch (err) {
        console.error(`❌ ${file} failed:`, err.message);
        // Continue with next migration
      }
    }
    
    console.log('\n✨ Migrations complete!');
    process.exit(0);
  } catch (err) {
    console.error('Migration error:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigrations();
