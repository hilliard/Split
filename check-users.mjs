import pkg from 'pg';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const { Client } = pkg;
const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

async function checkUsers() {
  try {
    await client.connect();
    const result = await client.query(
      `SELECT id, email, username, created_at FROM users ORDER BY created_at DESC`
    );

    console.log('\n📋 Users in database:\n');
    if (result.rows.length === 0) {
      console.log('(no users found)\n');
    } else {
      result.rows.forEach((u, i) => {
        console.log(`${i + 1}. Username: ${u.username}`);
        console.log(`   Email: ${u.email}`);
        console.log(`   ID: ${u.id}`);
        console.log(`   Created: ${new Date(u.created_at).toLocaleString()}`);
        console.log('');
      });
    }
    console.log(`Total users: ${result.rows.length}`);
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.end();
  }
}

checkUsers();
