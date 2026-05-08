import dotenv from 'dotenv';
import path from 'path';
import { Client } from 'pg';
import bcrypt from 'bcryptjs';

const args = process.argv.slice(2);
const hasFlag = (flag) => args.includes(flag);
const getArgValue = (flag, fallback) => {
  const idx = args.indexOf(flag);
  if (idx === -1 || idx + 1 >= args.length) return fallback;
  return args[idx + 1];
};

const apply = hasFlag('--apply');
const envName = getArgValue('--env', 'local');
const envPath = envName === 'test' ? '.env.test' : '.env.local';

if (envName === 'production') {
  console.error('Refusing to run against production from this dev/test repair script.');
  process.exit(1);
}

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

const PASSWORD_RESET_VALUE = 'Sonny@123';
const GROUP_NAME = 'Dallas Kids';
const EVENT_TITLE = 'Trip To OZ';
const EVENT_DESCRIPTION = 'yello brick road';
const EVENT_START = '2026-04-20T15:41:00.000Z';
const EVENT_END = '2026-04-21T15:41:00.000Z';

const fetchSonny = async (client) => {
  const result = await client.query(
    `
      select c.id as customer_id, c.username, c.email, c.human_id
      from customers c
      where lower(c.username) = 'sonny'
      limit 1
    `
  );
  return result.rows[0] || null;
};

const fetchSonnyEvents = async (client, humanId) => {
  const result = await client.query(
    `
      select e.id, e.title, e.group_id, eg.name as group_name, e.created_at
      from events e
      left join expense_groups eg on eg.id = e.group_id
      where e.creator_id = $1
      order by e.created_at desc
    `,
    [humanId]
  );
  return result.rows;
};

const fetchDallasKidsGroup = async (client) => {
  const result = await client.query(
    `
      select id, name, created_by
      from expense_groups
      where lower(name) = lower($1)
      order by created_at desc
      limit 1
    `,
    [GROUP_NAME]
  );
  return result.rows[0] || null;
};

(async () => {
  const client = new Client({ connectionString: databaseUrl });

  try {
    await client.connect();

    console.log('Mode:', apply ? 'apply' : 'status-only');
    console.log('Env file:', envPath);
    console.log('Database:', sanitizeUrl(databaseUrl));

    const sonny = await fetchSonny(client);
    if (!sonny) {
      console.error('No customer account found for username sonny.');
      process.exit(1);
    }

    if (apply) {
      await client.query('begin');

      const passwordHash = await bcrypt.hash(PASSWORD_RESET_VALUE, 12);
      await client.query('update customers set password_hash = $1 where id = $2', [
        passwordHash,
        sonny.customer_id,
      ]);

      let dallasKids = await fetchDallasKidsGroup(client);
      if (!dallasKids) {
        const created = await client.query(
          'insert into expense_groups (name, created_by) values ($1, $2) returning id, name, created_by',
          [GROUP_NAME, sonny.human_id]
        );
        dallasKids = created.rows[0];
      }

      await client.query(
        `
          insert into group_members (group_id, user_id, joined_at)
          values ($1, $2, now())
          on conflict do nothing
        `,
        [dallasKids.id, sonny.human_id]
      );

      const existingTrip = await client.query(
        `
          select id
          from events
          where lower(title) = lower($1)
            and creator_id = $2
          order by created_at desc
          limit 1
        `,
        [EVENT_TITLE, sonny.human_id]
      );

      if (existingTrip.rowCount === 0) {
        await client.query(
          `
            insert into events (
              creator_id,
              group_id,
              title,
              description,
              type,
              status,
              timezone,
              is_virtual,
              is_public,
              metadata,
              start_time,
              end_time
            ) values (
              $1,
              $2,
              $3,
              $4,
              'general',
              'scheduled',
              'America/Denver',
              false,
              true,
              '{}'::json,
              $5::timestamptz,
              $6::timestamptz
            )
          `,
          [
            sonny.human_id,
            dallasKids.id,
            EVENT_TITLE,
            EVENT_DESCRIPTION,
            EVENT_START,
            EVENT_END,
          ]
        );
      }

      await client.query('commit');
      console.log('Applied repair: password reset + Dallas Kids + Trip To OZ ensured.');
      console.log(`Password set for sonny: ${PASSWORD_RESET_VALUE}`);
    }

    const dallasKids = await fetchDallasKidsGroup(client);
    const sonnyEvents = await fetchSonnyEvents(client, sonny.human_id);

    const memberCount = dallasKids
      ? (
          await client.query('select count(*)::int as count from group_members where group_id = $1', [
            dallasKids.id,
          ])
        ).rows[0].count
      : 0;

    console.log('Sonny account:', {
      customerId: sonny.customer_id,
      username: sonny.username,
      email: sonny.email,
      humanId: sonny.human_id,
    });

    console.log('Dallas Kids group:',
      dallasKids
        ? { id: dallasKids.id, name: dallasKids.name, memberCount }
        : '(not found)'
    );

    console.log('Sonny events:', sonnyEvents.map((e) => ({
      id: e.id,
      title: e.title,
      groupName: e.group_name,
      createdAt: e.created_at,
    })));
  } catch (error) {
    await client.query('rollback').catch(() => {});
    console.error('dev-repair-sonny failed:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
})();
