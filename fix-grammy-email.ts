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

    console.log('🔄 Updating email address...\n');

    // Update email_history to change 0720 to 0727
    const result = await client.query(
      `UPDATE email_history 
       SET email = $1
       WHERE email = $2 AND effective_to IS NULL
       RETURNING human_id, email`,
      ['grammyhaynes0727@gmail.com', 'grammyhaynes0720@gmail.com']
    );

    if (result.rows.length > 0) {
      console.log('✅ Email updated successfully!');
      console.log(`   Old: grammyhaynes0720@gmail.com`);
      console.log(`   New: ${result.rows[0].email}\n`);

      console.log('📝 Updated Login Details:');
      console.log('   Email: grammyhaynes0727@gmail.com');
      console.log('   Password: password123\n');
    } else {
      console.log('⚠️  Email not found or not updated');
    }

    // Verify the change
    const verify = await client.query(
      `SELECT email FROM email_history 
       WHERE email LIKE '%grammyhaynes%' AND effective_to IS NULL`
    );

    console.log('✅ Verification:');
    verify.rows.forEach((row) => {
      console.log(`   ${row.email}`);
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
