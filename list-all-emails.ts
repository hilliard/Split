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

    // Get all users with emails
    const result = await client.query(`
      SELECT id, username, email, created_at FROM users 
      WHERE email IS NOT NULL 
      ORDER BY email
    `);

    console.log(`📧 Users with emails (${result.rows.length} total):\n`);
    if (result.rows.length === 0) {
      console.log('No emails found in users table');
    } else {
      result.rows.forEach((row) => {
        console.log(`  ${row.email}`);
        console.log(`    username: ${row.username}, id: ${row.id}`);
      });
    }

    // Count users total
    const totalUsers = await client.query(`SELECT COUNT(*) as count FROM users`);
    console.log(`\n📊 Total users in table: ${totalUsers.rows[0].count}`);

    // Count customers total
    const totalCustomers = await client.query(`SELECT COUNT(*) as count FROM customers`);
    console.log(`📊 Total customers in table: ${totalCustomers.rows[0].count}`);

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
