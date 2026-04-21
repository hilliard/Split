import pg from 'pg';
import { readFileSync } from 'fs';
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

async function main() {
  const pool = new Pool({ connectionString: DATABASE_URL });
  
  try {
    const client = await pool.connect();
    
    // Check existing tables
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    console.log('\n📊 Existing tables in database:\n');
    result.rows.forEach(row => {
      console.log(`  ✓ ${row.table_name}`);
    });
    
    console.log(`\nTotal: ${result.rows.length} tables\n`);
    
    // Check if email_history exists
    const emailHistoryCheck = await client.query(`
      SELECT EXISTS(
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'email_history'
      ) as exists
    `);
    
    if (emailHistoryCheck.rows[0].exists) {
      console.log('✅ email_history table EXISTS');
    } else {
      console.log('❌ email_history table DOES NOT EXIST - needs migration');
    }
    
    client.release();
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

main();
