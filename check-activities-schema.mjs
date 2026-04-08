#!/usr/bin/env node
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import postgres from 'postgres';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env.local
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

async function checkSchema() {
  try {
    console.log('Checking activities table schema...\n');
    
    // Get column information
    const columns = await sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'activities'
      ORDER BY ordinal_position
    `;
    
    console.log('Activities table columns:');
    console.log('========================');
    columns.forEach(col => {
      console.log(`  ${col.column_name.padEnd(20)} | ${col.data_type.padEnd(20)} | ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULLABLE'}`);
    });
    
    console.log('\n\nChecking constraints and indexes...\n');
    
    // Get constraints
    const constraints = await sql`
      SELECT constraint_name, constraint_type
      FROM information_schema.table_constraints
      WHERE table_name = 'activities'
    `;
    
    console.log('Constraints:');
    constraints.forEach(c => {
      console.log(`  ${c.constraint_name.padEnd(30)} | ${c.constraint_type}`);
    });
    
    console.log('\n\nSample data:');
    const samples = await sql`SELECT COUNT(*) as count FROM activities`;
    console.log(`  Total activities: ${samples[0].count}`);
    
    if (samples[0].count > 0) {
      const data = await sql`SELECT id, event_id, title, created_at FROM activities LIMIT 3`;
      console.log('\n  First 3 activities:');
      data.forEach(row => {
        console.log(`    ${row.id} | ${row.event_id} | ${row.title}`);
      });
    }
    
    await sql.end();
    process.exit(0);
  } catch (error) {
    console.error('Error checking schema:', error);
    process.exit(1);
  }
}

checkSchema();
