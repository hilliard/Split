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

    // Check users table columns
    const usersColumns = await client.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'users'
      ORDER BY column_name
    `);

    console.log('📋 Users table columns:');
    usersColumns.rows.forEach((row) => console.log(`  - ${row.column_name}`));

    // Get sample from users table
    const usersSample = await client.query(`SELECT * FROM users LIMIT 1`);
    if (usersSample.rows.length > 0) {
      console.log('\n📦 Sample user record:');
      console.log(JSON.stringify(usersSample.rows[0], null, 2));
    }

    // Check if there's an email field
    const hasEmailInUsers = usersColumns.rows.some((row) => row.column_name === 'email');

    if (hasEmailInUsers) {
      console.log('\n✅ Users table has email column!');

      // Check for grammy
      const grammy = await client.query(`
        SELECT * FROM users WHERE email LIKE '%grammy%' LIMIT 5
      `);

      console.log(`\n🔍 Found ${grammy.rows.length} user(s) with "grammy" in email`);
      grammy.rows.forEach((row) => console.log('  -', row.email, '|', row.id));
    }

    // Also check customers joined with users
    console.log('\n\n📊 Checking relationship between customers and users...\n');

    const relationship = await client.query(`
      SELECT c.id, c.username, c.human_id, u.email, u.id as user_id
      FROM customers c
      LEFT JOIN users u ON c.human_id = u.id OR c.id = u.id OR c.username = u.username
      LIMIT 3
    `);

    if (relationship.rows.length > 0) {
      console.log('Sample joined records:');
      relationship.rows.forEach((row) => console.log(JSON.stringify(row, null, 2)));
    }

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
