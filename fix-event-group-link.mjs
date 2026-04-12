import pkg from 'pg';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const { Client } = pkg;
const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

async function fixEvent() {
  try {
    await client.connect();

    console.log('🔧 Linking "Dallas Trip" event to "Dallas Kids" group...\n');

    // Update the event to link to Dallas Kids group
    const result = await client.query(
      `UPDATE events 
       SET group_id = '930c1ff4-34fb-4d3c-8c1c-033360491dc4'
       WHERE title = 'Dallas Trip'
       RETURNING id, title, creator_id, group_id`
    );

    if (result.rows.length === 0) {
      console.log('❌ Event not found');
    } else {
      console.log('✅ Event updated:');
      console.log(JSON.stringify(result.rows[0], null, 2));
      console.log('\n📌 Now johndoe can see "Dallas Trip" because:');
      console.log('   - johndoe is a member of "Dallas Kids" group');
      console.log('   - The event is now linked to that group');
    }

    await client.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    await client.end();
    process.exit(1);
  }
}

fixEvent();
