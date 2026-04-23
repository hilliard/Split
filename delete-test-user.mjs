import pkg from 'pg';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const { Client } = pkg;
const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

async function deleteTestUser() {
  try {
    await client.connect();

    // Find users with suspicious first/last names
    const result = await client.query(
      `DELETE FROM humans WHERE first_name LIKE '%@%' RETURNING id, first_name, last_name`
    );

    console.log('\n🗑️  Deleted users:');
    if (result.rows.length === 0) {
      console.log('(none found)\n');
    } else {
      result.rows.forEach((u) => {
        console.log(`  - ${u.first_name} ${u.last_name} (ID: ${u.id})`);
      });
      console.log(`\n✅ Deleted ${result.rows.length} malformed user(s)\n`);
    }
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.end();
  }
}

deleteTestUser();
