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

    // Find cathyd human
    console.log('🔍 Cathyd Complete Profile:\n');
    const cathyd = await client.query(
      `SELECT 
        h.id, 
        h.first_name, 
        h.last_name,
        h.created_at,
        c.id as customer_id,
        c.username,
        c.password_hash,
        eh.email,
        eh.effective_from,
        eh.effective_to
       FROM humans h
       LEFT JOIN customers c ON h.id = c.human_id
       LEFT JOIN email_history eh ON h.id = eh.human_id AND eh.effective_to IS NULL
       WHERE h.first_name = 'cathyd'`
    );

    if (cathyd.rows.length === 0) {
      console.log('❌ cathyd not found');
      process.exit(1);
    }

    const row = cathyd.rows[0];
    console.log('Human:');
    console.log(`  ID: ${row.id}`);
    console.log(`  Name: ${row.first_name} ${row.last_name}`);
    console.log(`  Created: ${row.created_at}`);
    console.log();

    console.log('Login:');
    console.log(`  Customer ID: ${row.customer_id || 'MISSING'}`);
    console.log(`  Username: ${row.username || 'MISSING'}`);
    console.log(`  Password hash: ${row.password_hash ? 'SET' : 'MISSING'}`);
    console.log();

    console.log('Email:');
    console.log(`  Current: ${row.email || 'MISSING'}`);
    console.log();

    // Check group membership
    console.log('Group Membership:\n');
    const groups = await client.query(
      `SELECT eg.id, eg.name, gr.name as role_name
       FROM group_members gm
       JOIN expense_groups eg ON gm.group_id = eg.id
       JOIN group_roles gr ON gm.group_role_id = gr.id
       WHERE gm.user_id = $1
       ORDER BY eg.name`,
      [row.id]
    );

    if (groups.rows.length > 0) {
      groups.rows.forEach((g: any) => {
        console.log(`  ${g.name} (${g.role_name})`);
      });
    } else {
      console.log('  ❌ NO GROUP MEMBERSHIPS FOUND');
    }
    console.log();

    // Check expenses
    console.log('Expenses:\n');
    const expenses = await client.query(
      `SELECT 
        e.id, 
        e.description, 
        eg.name as group_name,
        e.amount,
        e.currency,
        e.payer_human_id,
        (SELECT COUNT(*) FROM expense_participants ep WHERE ep.expense_id = e.id) as participant_count
       FROM expenses e
       JOIN expense_groups eg ON e.group_id = eg.id
       JOIN expense_participants ep ON e.id = ep.expense_id
       WHERE ep.human_id = $1
       ORDER BY e.created_at DESC
       LIMIT 10`,
      [row.id]
    );

    if (expenses.rows.length > 0) {
      expenses.rows.forEach((e: any) => {
        console.log(`  ${e.description}`);
        console.log(`    Group: ${e.group_name}`);
        console.log(`    Amount: ${e.amount} ${e.currency}`);
        console.log(`    Participants: ${e.participant_count}`);
      });
    } else {
      console.log('  No expenses found');
    }
    console.log();

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
