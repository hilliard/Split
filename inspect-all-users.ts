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
    console.log('✓ Connected to database\n');
    
    // Check all users
    const users = await client.query(`
      SELECT id, username, email, created_at FROM users 
      ORDER BY created_at DESC 
      LIMIT 10
    `);
    
    console.log(`📊 All users (${users.rows.length} total):\n`);
    if (users.rows.length === 0) {
      console.log('❌ No users in database\n');
    } else {
      users.rows.forEach(row => {
        console.log(`  ID: ${row.id}`);
        console.log(`  Username: ${row.username}`);
        console.log(`  Email: ${row.email || '(null)'}`);
        console.log('');
      });
    }
    
    // Check all customers
    const customers = await client.query(`
      SELECT id, human_id, username, created_at FROM customers 
      ORDER BY created_at DESC 
      LIMIT 10
    `);
    
    console.log(`📊 All customers (${customers.rows.length} total):\n`);
    if (customers.rows.length === 0) {
      console.log('❌ No customers in database\n');
    } else {
      customers.rows.forEach(row => {
        console.log(`  ID: ${row.id}`);
        console.log(`  Human ID: ${row.human_id}`);
        console.log(`  Username: ${row.username}`);
        console.log('');
      });
    }
    
    // Check humans
    const humans = await client.query(`
      SELECT id, first_name, last_name, created_at FROM humans 
      ORDER BY created_at DESC 
      LIMIT 10
    `);
    
    console.log(`📊 All humans (${humans.rows.length} total):\n`);
    if (humans.rows.length === 0) {
      console.log('❌ No humans in database\n');
    } else {
      humans.rows.forEach(row => {
        console.log(`  ID: ${row.id}`);
        console.log(`  Name: ${row.first_name} ${row.last_name}`);
        console.log('');
      });
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
