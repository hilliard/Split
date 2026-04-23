#!/usr/bin/env node
import postgres from 'postgres';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const sql = postgres(process.env.DATABASE_URL);

try {
  console.log('\n🚀 Creating event with initial expense...\n');

  // Get an existing user (sonny)
  const userId = '61994963-eb56-4d04-89af-8e1593a507ca'; // sonny
  const groupId = 'd06517e4-ac7a-4141-9d47-fc00647cda9c'; // existing group

  // Create event
  const eventId = uuidv4();
  const eventResult = await sql`
    INSERT INTO events (
      id, creator_id, group_id, title, description,
      type, status, start_time, end_time, timezone,
      is_virtual, is_public, currency, created_at
    ) VALUES (
      ${eventId},
      ${userId},
      ${groupId},
      ${'Quick Test Event'},
      ${'Testing expense creation'},
      ${'general'},
      ${'scheduled'},
      NOW(),
      NOW() + INTERVAL '2 hours',
      ${'UTC'},
      false,
      true,
      ${'USD'},
      NOW()
    )
    RETURNING id, title, created_at
  `;

  console.log('✅ Event created:');
  console.log(`   ID: ${eventResult[0].id}`);
  console.log(`   Title: ${eventResult[0].title}`);
  console.log(`   Created: ${eventResult[0].created_at}`);

  // Create expense
  const expenseId = uuidv4();
  const expenseResult = await sql`
    INSERT INTO expenses (
      id, event_id, amount, description, category, paid_by, created_at
    ) VALUES (
      ${expenseId},
      ${eventId},
      ${10000},
      ${'Quick test flight'},
      ${'misc'},
      ${userId},
      NOW()
    )
    RETURNING id, event_id, amount, description, paid_by, created_at
  `;

  console.log('\n✅ Expense created:');
  console.log(`   ID: ${expenseResult[0].id}`);
  console.log(`   Event ID: ${expenseResult[0].event_id}`);
  console.log(`   Amount: $${(expenseResult[0].amount / 100).toFixed(2)}`);
  console.log(`   Description: ${expenseResult[0].description}`);
  console.log(`   Paid by: ${expenseResult[0].paid_by}`);
  console.log(`   Created: ${expenseResult[0].created_at}`);

  console.log('\n✅ SUCCESS! Event and expense created.\n');
} catch (error) {
  console.error('\n❌ Error:', error.message);
  if (error.detail) console.error('Detail:', error.detail);
  process.exit(1);
} finally {
  await sql.end();
}
