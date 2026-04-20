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

console.log('\n=== Searching for "get on happy path" ===\n');
const events = await sql`SELECT id, title, group_id, created_at FROM events WHERE title ILIKE '%happy%' ORDER BY created_at DESC LIMIT 5`;
console.log(`Found ${events.length} event(s):`);
events.forEach(e => {
  console.log(`  - "${e.title}"`);
  console.log(`    ID: ${e.id}`);
  console.log(`    Group: ${e.group_id || '❌ NULL'}`);
  console.log(`    Created: ${e.created_at}`);
});

if (events.length > 0) {
  const latest = events[0];
  if (latest.group_id) {
    const expenses = await sql`SELECT id, amount, description, created_at FROM expenses WHERE group_id = ${latest.group_id}`;
    console.log(`\n  💰 Expenses in group: ${expenses.length}`);
    expenses.forEach(e => console.log(`    - $${(e.amount/100).toFixed(2)}: ${e.description}`));
  } else {
    console.log('\n  ⚠️  No group linked to this event!');
  }
}

await sql.end();
