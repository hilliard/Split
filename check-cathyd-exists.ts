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

    // Check all humans to see if cathyd exists
    console.log('🔍 Checking humans table for cathyd:\n');
    const humans = await client.query(
      `SELECT h.id, h.first_name, h.last_name, c.username, c.password_hash, eh.email
       FROM humans h
       LEFT JOIN customers c ON h.id = c.human_id
       LEFT JOIN email_history eh ON h.id = eh.human_id AND eh.effective_to IS NULL
       WHERE LOWER(h.first_name) LIKE '%cath%' OR LOWER(h.last_name) LIKE '%d%' OR LOWER(c.username) LIKE '%cath%'
       ORDER BY h.first_name, h.last_name`
    );

    if (humans.rows.length > 0) {
      console.log('Found matches:');
      humans.rows.forEach((row: any) => {
        console.log(`  Name: ${row.first_name} ${row.last_name}`);
        console.log(`  Username: ${row.username || 'N/A'}`);
        console.log(`  Email: ${row.email || 'N/A'}`);
        console.log(`  Password hash exists: ${!!row.password_hash}`);
        console.log();
      });
    } else {
      console.log('❌ No cathyd found in humans table');

      console.log('\n🔍 All humans in database:\n');
      const allHumans = await client.query(
        `SELECT h.id, h.first_name, h.last_name, c.username, eh.email
         FROM humans h
         LEFT JOIN customers c ON h.id = c.human_id
         LEFT JOIN email_history eh ON h.id = eh.human_id AND eh.effective_to IS NULL
         ORDER BY h.first_name`
      );

      allHumans.rows.forEach((row: any) => {
        console.log(
          `  ${row.first_name} ${row.last_name} (${row.username || 'no login'}) - ${row.email || 'no email'}`
        );
      });
    }

    // Check groups
    console.log('\n📋 All groups:\n');
    const groups = await client.query(`SELECT id, name FROM expense_groups ORDER BY name`);

    if (groups.rows.length > 0) {
      groups.rows.forEach((row: any) => {
        console.log(`  ${row.name}`);
      });
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
