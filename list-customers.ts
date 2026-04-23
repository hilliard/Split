import pg from 'pg';
import { readFileSync } from 'fs';
import { resolve } from 'path';
const { Pool } = pg;

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

const DATABASE_URL = envVars['DATABASE_URL'];

async function main() {
  const pool = new Pool({ connectionString: DATABASE_URL });

  try {
    const client = await pool.connect();
    console.log('✓ Connected to database\n');

    console.log('📋 All customers in database:\n');
    const result = await client.query(
      `SELECT c.id, c.username, h.first_name, h.last_name
       FROM customers c
       JOIN humans h ON c.human_id = h.id
       ORDER BY c.username`
    );

    if (result.rows.length > 0) {
      result.rows.forEach((row: any) => {
        console.log(`  ${row.username.padEnd(20)} - ${row.first_name} ${row.last_name}`);
      });
    } else {
      console.log('  No customers found');
    }

    console.log('\n');
    client.release();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
