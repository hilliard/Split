#!/usr/bin/env node
import postgres from 'postgres';

const sql = postgres({
  host: 'ep-twilight-flower-anebzpau-pooler.c-6.us-east-1.aws.neon.tech',
  port: 5432,
  database: 'neondb',
  username: 'neondb_owner',
  password: 'npg_0lxTYBLMgh2r',
  ssl: 'require'
});

console.log('\n=== VERIFICATION: Trip To OZ Event & Expense ===\n');

// Check the event
const events = await sql`SELECT id, title, group_id, created_at FROM events WHERE title ILIKE '%Oz%' ORDER BY created_at DESC LIMIT 1`;
if (events.length > 0) {
  const event = events[0];
  console.log('✅ EVENT FOUND:');
  console.log(`   Title: ${event.title}`);
  console.log(`   Event ID: ${event.id}`);
  console.log(`   Group ID: ${event.group_id || '❌ NOT SET'}`);
  console.log(`   Created: ${event.created_at}`);

  // If group_id is set, check for expenses
  if (event.group_id) {
    const expenses = await sql`SELECT id, amount, description FROM expenses WHERE group_id = ${event.group_id}`;
    console.log(`\n   Expenses in group: ${expenses.length}`);
    expenses.forEach((exp, i) => {
      console.log(`   ${i+1}. $${(exp.amount/100).toFixed(2)} - ${exp.description}`);
    });
  } else {
    console.log('\n   ❌ No group linked to event - expenses cannot exist');
  }
} else {
  console.log('❌ Event not found');
}

// Check for orphan expense
const orphanExpense = await sql`SELECT id, amount, description, group_id FROM expenses WHERE amount = 56393`;
if (orphanExpense.length > 0) {
  console.log('\n⚠️  ORPHAN EXPENSE FOUND:');
  orphanExpense.forEach(exp => {
    console.log(`   $${(exp.amount/100).toFixed(2)} - ${exp.description}`);
    console.log(`   Group: ${exp.group_id || 'null'}`);
  });
}

await sql.end();
