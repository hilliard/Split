import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

(async () => {
  try {
    console.log('\n🔍 Checking customers table...\n');
    
    // Check all customers
    const result = await pool.query(
      `SELECT id, human_id, username, password_hash, created_at FROM customers ORDER BY created_at DESC LIMIT 10`
    );
    
    if (result.rows.length === 0) {
      console.log('❌ NO CUSTOMERS FOUND IN DATABASE!\n');
    } else {
      console.log('✅ Found customers:\n');
      result.rows.forEach(row => {
        console.log(`  ID: ${row.id}`);
        console.log(`  Human ID: ${row.human_id}`);
        console.log(`  Username: "${row.username}"`);
        console.log(`  Password Hash: ${row.password_hash ? '✓ exists' : '✗ NULL'}`);
        console.log(`  Created: ${row.created_at}\n`);
      });
    }
    
    // Specifically check for 'alice'
    console.log('🔎 Searching specifically for "alice"...\n');
    const aliceResult = await pool.query(
      `SELECT id, human_id, username FROM customers WHERE username = $1`,
      ['alice']
    );
    
    if (aliceResult.rows.length === 0) {
      console.log('❌ alice NOT FOUND');
      console.log('\nTrying case-insensitive search...');
      const caseInsensitive = await pool.query(
        `SELECT id, human_id, username FROM customers WHERE LOWER(username) = LOWER($1)`,
        ['alice']
      );
      if (caseInsensitive.rows.length > 0) {
        console.log('✓ Found with case-insensitive search:');
        caseInsensitive.rows.forEach(row => {
          console.log(`  Actual username in DB: "${row.username}"`);
        });
      } else {
        console.log('❌ alice NOT found even with case-insensitive search');
      }
    } else {
      console.log('✅ alice FOUND');
      aliceResult.rows.forEach(row => {
        console.log(`  ID: ${row.id}`);
        console.log(`  Human ID: ${row.human_id}`);
        console.log(`  Username: "${row.username}"`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
})();
