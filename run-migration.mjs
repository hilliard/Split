import { Pool } from 'pg';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function runMigration() {
  try {
    const migrationFile = process.argv[2] || '003-update-budget-to-cents.sql';
    const migrationPath = resolve(`migrations/${migrationFile}`);

    console.log(`📊 Running migration: ${migrationFile}`);

    // Read the migration file
    const sql = readFileSync(migrationPath, 'utf-8');

    // Split by semicolon to run statements separately
    const statements = sql.split(';').filter((s) => s.trim());

    for (const statement of statements) {
      if (statement.trim()) {
        console.log('Executing:', statement.substring(0, 60) + '...');
        await pool.query(statement);
      }
    }

    console.log('✓ Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigration();
