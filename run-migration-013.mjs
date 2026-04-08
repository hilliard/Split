#!/usr/bin/env node
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import postgres from 'postgres';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env.local for Windows 11 compatibility
if (!process.env.DATABASE_URL) {
  try {
    const envPath = path.resolve(__dirname, '.env.local');
    const envContent = fs.readFileSync(envPath, 'utf-8');
    envContent.split('\n').forEach(line => {
      if (line.trim() && !line.startsWith('#')) {
        const [key, ...valueParts] = line.split('=');
        const value = valueParts.join('=').trim();
        if (key && value && !process.env[key.trim()]) {
          process.env[key.trim()] = value.replace(/^["']|["']$/g, '');
        }
      }
    });
  } catch (error) {
    console.warn('Warning: Could not load .env.local', error);
  }
}

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('DATABASE_URL environment variable is not set');
  process.exit(1);
}

const sql = postgres(databaseUrl);

async function runMigration() {
  try {
    const migrationFile = path.join(__dirname, 'migrations/013-add-title-to-activities.sql');
    const migrationSql = fs.readFileSync(migrationFile, 'utf-8');
    
    console.log('Running migration: 013-add-title-to-activities.sql');
    
    // Split by semicolon and filter out empty statements
    const statements = migrationSql.split(';').filter(stmt => stmt.trim());
    
    for (const statement of statements) {
      if (statement.trim()) {
        console.log(`Executing: ${statement.trim().substring(0, 80)}...`);
        await sql.unsafe(statement);
      }
    }
    
    console.log('Migration completed successfully!');
    await sql.end();
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
