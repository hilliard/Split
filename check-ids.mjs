import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function checkIds() {
  try {
    // Get grace from users
    const usersResult = await pool.query(`SELECT id, username FROM users WHERE username = 'grace'`);
    const graceUserId = usersResult.rows[0]?.id;
    console.log(`Grace user ID: ${graceUserId}`);
    
    // Get grace from humans
    const humansResult = await pool.query(`SELECT id, first_name FROM humans WHERE first_name = 'grace'`);
    const graceHumanId = humansResult.rows[0]?.id;
    console.log(`Grace human ID: ${graceHumanId}`);
    
    // Get grace customer record
    const customerResult = await pool.query(`SELECT human_id FROM customers WHERE username = 'grace'`);
    const graceCustomerHumanId = customerResult.rows[0]?.human_id;
    console.log(`Grace customer's human_id: ${graceCustomerHumanId}`);
    
    // Check what owner_id is in events
    const eventsResult = await pool.query(`SELECT DISTINCT owner_id FROM events`);
    console.log(`\nEvent owner_ids:`, eventsResult.rows.map(r => r.owner_id));
    
    console.log('\n');
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkIds();
