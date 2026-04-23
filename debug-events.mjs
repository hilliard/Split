import postgres from 'postgres';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const sql = postgres(process.env.DATABASE_URL);

async function debug() {
  try {
    console.log('\n=== DEBUGGING EVENTS ===\n');

    // Get johndoe's ID
    const users = await sql`SELECT id, email, first_name FROM humans WHERE email LIKE '%johndoe%'`;
    console.log('👤 johndoe user:', users);

    if (users.length === 0) {
      console.log('❌ johndoe not found!');
      process.exit(1);
    }

    const johndoeId = users[0].id;
    console.log(`\n✅ johndoe ID: ${johndoeId}\n`);

    // Get Dallas Kids group
    const groups =
      await sql`SELECT id, name, created_by FROM expense_groups WHERE name = 'Dallas Kids'`;
    console.log('🏘️ Dallas Kids group:', groups);

    if (groups.length === 0) {
      console.log('❌ Dallas Kids group not found!');
      process.exit(1);
    }

    const groupId = groups[0].id;
    console.log(`\n✅ Group ID: ${groupId}\n`);

    // Get group members
    const members =
      await sql`SELECT gm.user_id, h.email FROM group_members gm JOIN humans h ON gm.user_id = h.id WHERE gm.group_id = ${groupId}`;
    console.log('👥 Group members:', members);
    console.log(`Is johndoe in group? ${members.some((m) => m.user_id === johndoeId)}\n`);

    // Get Dallas Trip event
    const events =
      await sql`SELECT id, title, creator_id, group_id FROM events WHERE title = 'Dallas Trip'`;
    console.log('🎉 Dallas Trip event:', events);

    if (events.length === 0) {
      console.log('❌ Dallas Trip event not found!');
      process.exit(1);
    }

    const eventId = events[0].id;
    console.log(`Event created by: ${events[0].creator_id}`);
    console.log(`Event linked to group: ${events[0].group_id}\n`);

    // Check if event should be visible to johndoe
    console.log('=== VISIBILITY CHECK ===');
    console.log(`1. johndoe created event? ${events[0].creator_id === johndoeId}`);
    console.log(`2. Event linked to Dallas Kids group? ${events[0].group_id === groupId}`);
    console.log(
      `3. johndoe is member of Dallas Kids? ${members.some((m) => m.user_id === johndoeId)}`
    );

    if (
      events[0].creator_id === johndoeId ||
      (events[0].group_id === groupId && members.some((m) => m.user_id === johndoeId))
    ) {
      console.log('\n✅ Event SHOULD be visible to johndoe!\n');
    } else {
      console.log('\n❌ Event should NOT be visible to johndoe!\n');
    }

    await sql.end();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

debug();
