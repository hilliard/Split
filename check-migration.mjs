import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function checkData() {
  try {
    // Check users
    const usersResult = await pool.query(`SELECT id, email, username FROM users ORDER BY created_at DESC LIMIT 3`);
    console.log('\n📋 Users table:');
    console.log(`Count: ${usersResult.rowCount}`);
    usersResult.rows.forEach(u => console.log(`  ${u.username} (${u.email})`));
    
    // Check humans
    const humansResult = await pool.query(`SELECT id, first_name, last_name FROM humans ORDER BY created_at DESC LIMIT 3`);
    console.log('\n📋 Humans table:');
    console.log(`Count: ${humansResult.rowCount}`);
    humansResult.rows.forEach(h => console.log(`  ${h.first_name} ${h.last_name}`));
    
    // Check customers
    const customersResult = await pool.query(`SELECT id, human_id, username FROM customers ORDER BY created_at DESC LIMIT 3`);
    console.log('\n📋 Customers table:');
    console.log(`Count: ${customersResult.rowCount}`);
    customersResult.rows.forEach(c => console.log(`  ${c.username} (human_id: ${c.human_id.substring(0, 8)}...)`));
    
    console.log('\n');
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkData();
