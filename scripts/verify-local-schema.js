// Verifies local public schema core tables exist in the local DB
import dotenv from 'dotenv';
import path from 'path';
import { Client } from 'pg';

// Load local env to get DATABASE_URL
dotenv.config({ path: path.resolve('.', '.env.local'), override: true });
const url = process.env.DATABASE_URL;
if (!url) {
  console.error('DATABASE_URL not set');
  process.exit(1);
}

(async () => {
  try {
    const client = new Client({ connectionString: url });
    await client.connect();
    const res = await client.query(
      `SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE' ORDER BY table_name;`
    );
    const present = res.rows.map((r) => r.table_name);
  const coreTables = [
      'events',
      'activities',
      'expenses',
      'expense_groups',
      'group_members',
      'expense_splits',
      'settlements',
      'humans',
      'customers',
      'users',
      'group_roles',
      'group_role_permissions',
      'permissions',
      'system_roles',
      'human_system_roles',
      'email_history',
      'pending_group_invitations',
      'sessions',
      'email_verification_tokens',
    ];
  // Additionally verify a core subset of tables that are critical for app operation
  const criticalTables = [
    'events','activities','expenses','expense_groups','group_members','expense_splits','settlements','humans','customers','users','group_roles','permissions','system_roles','human_system_roles','email_history','pending_group_invitations','sessions','email_verification_tokens'
  ];
  const missingCritical = criticalTables.filter((t) => !present.includes(t));
  const missing = coreTables.filter((t) => !present.includes(t));
    console.log('Public schema core tables present:', present.join(', '));
    console.log('Missing core tables:', missing.length ? missing.join(', ') : '(none)');
    if (missingCritical.length === 0) {
      console.log('Critical tables: OK');
    } else {
      console.log('Missing critical tables:', missingCritical.join(', '));
    }
    await client.end();
    process.exit(0);
  } catch (err) {
    console.error('Error verifying local schema:', err);
    process.exit(1);
  }
})();
