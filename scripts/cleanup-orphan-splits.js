import dotenv from 'dotenv';
import path from 'path';
import { Client } from 'pg';

const args = process.argv.slice(2);
const hasFlag = (flag) => args.includes(flag);
const getArgValue = (flag, fallback) => {
  const idx = args.indexOf(flag);
  if (idx === -1 || idx + 1 >= args.length) return fallback;
  return args[idx + 1];
};

const mode = hasFlag('--apply') ? 'apply' : 'dry-run';
const envName = getArgValue('--env', 'local');
const sampleLimit = Number.parseInt(getArgValue('--sample-limit', '25'), 10);
const shouldConfirmDelete = hasFlag('--confirm-orphan-splits');

const envPath = envName === 'production' ? '.env.production' : '.env.local';
dotenv.config({ path: path.resolve('.', envPath), override: true });

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error(`DATABASE_URL not set after loading ${envPath}`);
  process.exit(1);
}

const sanitizeUrl = (conn) => {
  try {
    const u = new URL(conn);
    if (u.password) u.password = '****';
    return u.toString();
  } catch {
    return conn;
  }
};

const centsToDollars = (cents) => (Number(cents || 0) / 100).toFixed(2);

const selectOrphanSummarySql = `
  select
    count(*)::int as orphan_count,
    coalesce(sum(es.amount), 0)::bigint as orphan_total_cents
  from expense_splits es
  left join expenses e on e.id = es.expense_id
  where e.id is null
`;

const selectOrphanByUserSql = `
  select
    es.user_id,
    coalesce(h.first_name, '') as first_name,
    coalesce(h.last_name, '') as last_name,
    count(*)::int as orphan_count,
    coalesce(sum(es.amount), 0)::bigint as orphan_total_cents
  from expense_splits es
  left join expenses e on e.id = es.expense_id
  left join humans h on h.id = es.user_id
  where e.id is null
  group by es.user_id, h.first_name, h.last_name
  order by orphan_total_cents desc
`;

const selectOrphanSamplesSql = `
  select
    es.id,
    es.expense_id,
    es.user_id,
    es.amount
  from expense_splits es
  left join expenses e on e.id = es.expense_id
  where e.id is null
  order by es.id desc
  limit $1
`;

const deleteOrphansSql = `
  delete from expense_splits es
  where not exists (
    select 1
    from expenses e
    where e.id = es.expense_id
  )
  returning es.id, es.user_id, es.amount
`;

(async () => {
  const client = new Client({ connectionString: databaseUrl });

  try {
    await client.connect();

    const summary = await client.query(selectOrphanSummarySql);
    const byUser = await client.query(selectOrphanByUserSql);
    const samples = await client.query(selectOrphanSamplesSql, [sampleLimit]);

    const orphanCount = Number(summary.rows[0]?.orphan_count || 0);
    const orphanTotalCents = Number(summary.rows[0]?.orphan_total_cents || 0);

    console.log('--- Orphan Expense Split Report ---');
    console.log('Mode:', mode);
    console.log('Env file:', envPath);
    console.log('Database:', sanitizeUrl(databaseUrl));
    console.log('Orphan rows:', orphanCount);
    console.log('Orphan total (cents):', orphanTotalCents);
    console.log('Orphan total (dollars):', centsToDollars(orphanTotalCents));

    if (byUser.rows.length > 0) {
      console.log('\nBy user:');
      for (const row of byUser.rows) {
        const name = `${row.first_name} ${row.last_name}`.trim() || 'Unknown';
        console.log(
          `- ${name} (${row.user_id}): ${row.orphan_count} rows, $${centsToDollars(row.orphan_total_cents)}`
        );
      }
    }

    if (samples.rows.length > 0) {
      console.log(`\nSample rows (latest ${samples.rows.length}):`);
      for (const row of samples.rows) {
        console.log(
          `- id=${row.id} expense_id=${row.expense_id} user_id=${row.user_id} amount=${row.amount}`
        );
      }
    }

    if (mode === 'dry-run') {
      console.log('\nDry-run complete. No rows were deleted.');
      console.log('To delete orphans, rerun with: --apply --confirm-orphan-splits');
      return;
    }

    if (!shouldConfirmDelete) {
      console.error('\nRefusing to delete without explicit confirmation flag.');
      console.error('Add --confirm-orphan-splits together with --apply to proceed.');
      process.exit(1);
    }

    await client.query('begin');
    const deleted = await client.query(deleteOrphansSql);
    await client.query('commit');

    const deletedCount = deleted.rowCount || 0;
    const deletedTotalCents = deleted.rows.reduce((sum, row) => sum + Number(row.amount || 0), 0);

    console.log('\nDelete complete.');
    console.log('Deleted rows:', deletedCount);
    console.log('Deleted total (cents):', deletedTotalCents);
    console.log('Deleted total (dollars):', centsToDollars(deletedTotalCents));
  } catch (error) {
    await client.query('rollback').catch(() => {});
    console.error('Cleanup failed:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
})();
