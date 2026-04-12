import pkg from 'pg';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const { Client } = pkg;
const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

async function debug() {
  try {
    await client.connect();

    console.log('\n🔍 === DATABASE DEBUG ===\n');

    // Get all humans
    console.log('📋 All Humans:');
    const humansResult = await client.query(
      `SELECT id, first_name, last_name, created_at FROM humans ORDER BY created_at DESC`
    );
    if (humansResult.rows.length === 0) {
      console.log('(no humans found)');
    } else {
      console.log(JSON.stringify(humansResult.rows, null, 2));
    }
    console.log(`Count: ${humansResult.rows.length}\n`);

    // Get all users (legacy)
    console.log('📋 All Users (legacy):');
    const usersResult = await client.query(
      `SELECT id, email, username, created_at FROM users ORDER BY created_at DESC`
    );
    if (usersResult.rows.length === 0) {
      console.log('(no users found)');
    } else {
      console.log(JSON.stringify(usersResult.rows, null, 2));
    }
    console.log(`Count: ${usersResult.rows.length}\n`);

    // Get all groups
    console.log('📋 All Expense Groups:');
    const groupsResult = await client.query(
      `SELECT id, name, created_by, created_at FROM expense_groups ORDER BY created_at DESC`
    );
    if (groupsResult.rows.length === 0) {
      console.log('(no groups found)');
    } else {
      console.log(JSON.stringify(groupsResult.rows, null, 2));
    }
    console.log(`Count: ${groupsResult.rows.length}\n`);

    // Get all group memberships
    console.log('📋 All Group Memberships:');
    const membershipsResult = await client.query(
      `SELECT user_id, group_id FROM group_members ORDER BY invited_at DESC`
    );
    if (membershipsResult.rows.length === 0) {
      console.log('(no memberships found)');
    } else {
      console.log(JSON.stringify(membershipsResult.rows, null, 2));
    }
    console.log(`Count: ${membershipsResult.rows.length}\n`);

    // Get all events
    console.log('📋 All Events:');
    const eventsResult = await client.query(
      `SELECT id, creator_id, group_id, title, start_time, created_at FROM events ORDER BY created_at DESC`
    );
    if (eventsResult.rows.length === 0) {
      console.log('(no events found)');
    } else {
      console.log(JSON.stringify(eventsResult.rows, null, 2));
    }
    console.log(`Count: ${eventsResult.rows.length}\n`);

    console.log('✅ Debug complete');
    await client.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    await client.end();
    process.exit(1);
  }
}

debug();
