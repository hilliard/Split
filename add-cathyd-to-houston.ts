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

    // Get cathyd
    console.log('🔍 Getting cathyd info...');
    const cathyd = await client.query(`SELECT id FROM humans WHERE first_name = 'cathyd'`);

    if (cathyd.rows.length === 0) {
      console.log('❌ cathyd not found');
      process.exit(1);
    }

    const cathyd_id = cathyd.rows[0].id;
    console.log(`✅ Found cathyd: ${cathyd_id}\n`);

    // Get Houston Party People group
    console.log('🔍 Getting Houston Party People group...');
    const group = await client.query(
      `SELECT id FROM expense_groups WHERE name = 'Houston Party People'`
    );

    if (group.rows.length === 0) {
      console.log('❌ Houston Party People group not found');
      process.exit(1);
    }

    const group_id = group.rows[0].id;
    console.log(`✅ Found group: ${group_id}\n`);

    // Get member role
    console.log('🔍 Getting member role...');
    const memberRole = await client.query(`SELECT id FROM group_roles WHERE name = 'member'`);

    if (memberRole.rows.length === 0) {
      console.log('❌ member role not found');
      process.exit(1);
    }

    const role_id = memberRole.rows[0].id;
    console.log(`✅ Found member role: ${role_id}\n`);

    // Add cathyd to Houston Party People
    console.log('🔄 Adding cathyd to Houston Party People...\n');
    await client.query(
      `INSERT INTO group_members (id, group_id, user_id, group_role_id, invited_at, joined_at)
       VALUES (gen_random_uuid(), $1, $2, $3, NOW(), NOW())
       ON CONFLICT DO NOTHING`,
      [group_id, cathyd_id, role_id]
    );

    console.log('✅ cathyd added to Houston Party People!\n');

    // Verify
    console.log('📊 Verifying membership:\n');
    const verify = await client.query(
      `SELECT h.first_name, h.last_name, gr.name as role
       FROM group_members gm
       JOIN humans h ON gm.user_id = h.id
       JOIN group_roles gr ON gm.group_role_id = gr.id
       WHERE gm.group_id = $1`,
      [group_id]
    );

    verify.rows.forEach((row: any) => {
      console.log(`  - ${row.first_name} ${row.last_name} (${row.role})`);
    });

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
