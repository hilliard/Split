import pg from 'pg';
import { readFileSync } from 'fs';
import { resolve } from 'path';
const { Pool } = pg;

// Load .env.local
const envPath = resolve('.env.local');
const envContent = readFileSync(envPath, 'utf-8');
const envVars: Record<string, string> = {};
envContent.split('\n').forEach((line) => {
  if (line.trim() && !line.startsWith('#')) {
    const [key, ...valueParts] = line.split('=');
    const value = valueParts.join('=').trim();
    if (key && value) {
      envVars[key.trim()] = value.replace(/^["']|["']$/g, '');
    }
  }
});

const DATABASE_URL = envVars['DATABASE_URL'];

async function main() {
  const pool = new Pool({ connectionString: DATABASE_URL });

  try {
    const client = await pool.connect();
    console.log('✓ Connected to database\n');

    // Find Teresa's Birthday event
    console.log(`🔍 Looking for "Teresa's Birthday 2026" event...\n`);
    const event = await client.query(
      `SELECT e.id, e.description, eg.id as group_id, eg.name as group_name, e.amount, e.created_at
       FROM expenses e
       JOIN expense_groups eg ON e.group_id = eg.id
       WHERE eg.name = 'Houston Party People' AND e.description LIKE '%Teresa%'
       ORDER BY e.created_at DESC
       LIMIT 1`
    );

    if (event.rows.length === 0) {
      console.log(`❌ No expenses found for "Teresa's Birthday 2026"`);
      console.log('\n📋 All expenses in Houston Party People:\n');

      const allExpenses = await client.query(
        `SELECT e.id, e.description, e.amount, e.created_at
         FROM expenses e
         JOIN expense_groups eg ON e.group_id = eg.id
         WHERE eg.name = 'Houston Party People'
         ORDER BY e.created_at DESC`
      );

      if (allExpenses.rows.length > 0) {
        allExpenses.rows.forEach((e: any) => {
          console.log(`  - ${e.description} ($${(e.amount / 100).toFixed(2)})`);
        });
      } else {
        console.log('  No expenses found');
      }
    } else {
      const row = event.rows[0];
      console.log(`✅ Found: ${row.description}`);
      console.log(`   ID: ${row.id}`);
      console.log(`   Amount: $${(row.amount / 100).toFixed(2)}`);
      console.log(`   Created: ${row.created_at}\n`);

      // Check who is involved in this expense
      console.log(`📊 Participants in "${row.description}":\n`);
      const splits = await client.query(
        `SELECT h.first_name, h.last_name, es.amount
         FROM expense_splits es
         JOIN humans h ON es.human_id = h.id
         WHERE es.expense_id = $1`,
        [row.id]
      );

      if (splits.rows.length > 0) {
        splits.rows.forEach((s: any) => {
          console.log(`  - ${s.first_name} ${s.last_name}: $${(s.amount / 100).toFixed(2)}`);
        });
      }
    }

    client.release();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
