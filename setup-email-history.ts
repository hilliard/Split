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

    // Step 1: Add emails for existing customers
    console.log('🔄 Step 1: Creating email entries for existing customers...\n');

    const customerEmails = [
      { human_id: '75169a5c-569c-4606-b643-12590ae16c6e', email: 'cathyd@example.com' },
      { human_id: '61994963-eb56-4d04-89af-8e1593a507ca', email: 'sonny@example.com' },
      { human_id: '10000004-0000-0000-0000-000000000004', email: 'power.user@example.com' },
      { human_id: '10000003-0000-0000-0000-000000000003', email: 'viewer.user@example.com' },
      { human_id: '10000002-0000-0000-0000-000000000002', email: 'regular.user@example.com' },
      { human_id: '10000001-0000-0000-0000-000000000001', email: 'admin.user@example.com' },
      { human_id: '6d916ed5-f539-4a51-9e17-044d81c956d2', email: 'johndoe@example.com' },
      { human_id: 'c9a566f3-0415-43ec-8beb-ace776b39c6a', email: 'testuser@example.com' },
    ];

    let createdCount = 0;
    for (const { human_id, email } of customerEmails) {
      try {
        await client.query(
          `INSERT INTO email_history (human_id, email, effective_from, created_at)
           VALUES ($1, $2, NOW(), NOW())
           ON CONFLICT DO NOTHING`,
          [human_id, email]
        );
        console.log(`✅ ${email}`);
        createdCount++;
      } catch (error) {
        console.error(
          `❌ Error for ${email}:`,
          error instanceof Error ? error.message : String(error)
        );
      }
    }

    console.log(`\nCreated/verified: ${createdCount} email entries\n`);

    // Step 2: Create grammyhaynes user
    console.log('🔄 Step 2: Creating grammyhaynes user...\n');

    try {
      // Create human record for grammyhaynes
      const humanResult = await client.query(
        `INSERT INTO humans (id, first_name, last_name, created_at, updated_at)
         VALUES (gen_random_uuid(), $1, $2, NOW(), NOW())
         RETURNING id`,
        ['Grammy', 'Haynes']
      );

      const grammy_human_id = humanResult.rows[0].id;
      console.log(`✅ Created human record: ${grammy_human_id}`);

      // Add email to email_history
      await client.query(
        `INSERT INTO email_history (human_id, email, effective_from, created_at)
         VALUES ($1, $2, NOW(), NOW())`,
        [grammy_human_id, 'grammyhaynes0720@gmail.com']
      );
      console.log(`✅ Added email: grammyhaynes0720@gmail.com`);

      // Create customer record (needs password hash)
      // For testing, using a simple hash (you'd normally generate this)
      const customerResult = await client.query(
        `INSERT INTO customers (human_id, username, password_hash, created_at, updated_at)
         VALUES ($1, $2, $3, NOW(), NOW())
         RETURNING id`,
        [grammy_human_id, 'grammyhaynes', '$2b$10$placeholder']
      );

      console.log(`✅ Created customer record: ${customerResult.rows[0].id}`);
      console.log(`\n✅ grammyhaynes user created successfully!`);
      console.log(`   Email: grammyhaynes0720@gmail.com`);
      console.log(`   Username: grammyhaynes\n`);
    } catch (error) {
      console.error(
        `❌ Error creating grammyhaynes:`,
        error instanceof Error ? error.message : String(error)
      );
    }

    // Step 3: Verify email_history
    console.log('📊 Step 3: Verification\n');

    const totalEmails = await client.query(
      `SELECT COUNT(*) as count FROM email_history WHERE effective_to IS NULL`
    );
    console.log(`Total current emails: ${totalEmails.rows[0].count}`);

    const grammy = await client.query(`
      SELECT eh.email, h.id, h.first_name, h.last_name, c.username
      FROM email_history eh
      JOIN humans h ON eh.human_id = h.id
      LEFT JOIN customers c ON h.id = c.human_id
      WHERE LOWER(eh.email) LIKE '%grammy%' OR LOWER(h.first_name) LIKE '%grammy%'
    `);

    if (grammy.rows.length > 0) {
      console.log('\n✅ grammyhaynes record:');
      grammy.rows.forEach((row) => {
        console.log(`  Email: ${row.email}`);
        console.log(`  Name: ${row.first_name} ${row.last_name}`);
        console.log(`  Username: ${row.username}`);
      });
    }

    client.release();
    process.exit(0);
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
