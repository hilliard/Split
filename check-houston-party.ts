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

    console.log('🔍 Checking database schema:\n');

    // List all tables
    const tables = await client.query(
      `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name`
    );

    console.log('Tables related to expenses:');
    tables.rows.forEach((row: any) => {
      if (row.table_name.includes('expense')) {
        console.log(`  - ${row.table_name}`);
      }
    });

    console.log('\n📊 Houston Party People Group Details:\n');
    const group = await client.query(
      `SELECT id, name, created_by FROM expense_groups WHERE name = 'Houston Party People'`
    );

    if (group.rows.length > 0) {
      console.log(`  Group ID: ${group.rows[0].id}`);
      console.log(`  Members:`);

      const members = await client.query(
        `SELECT h.first_name, h.last_name, gr.name as role
         FROM group_members gm
         JOIN humans h ON gm.user_id = h.id
         JOIN group_roles gr ON gm.group_role_id = gr.id
         WHERE gm.group_id = $1`,
        [group.rows[0].id]
      );

      if (members.rows.length > 0) {
        members.rows.forEach((m: any) => {
          console.log(`    - ${m.first_name} ${m.last_name} (${m.role})`);
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
