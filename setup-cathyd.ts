import pg from 'pg';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import bcrypt from 'bcryptjs';
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

    // Check if cathyd already exists
    console.log('🔍 Checking if cathyd customer exists...\n');
    const existing = await client.query(`SELECT id FROM customers WHERE username = $1`, ['cathyd']);

    if (existing.rows.length > 0) {
      console.log('✅ cathyd customer already exists');
      console.log('   Just updating password...\n');

      const testPassword = 'password123';
      const saltRounds = 10;
      const passwordHash = await bcrypt.hash(testPassword, saltRounds);

      await client.query(
        `UPDATE customers 
         SET password_hash = $1, updated_at = NOW()
         WHERE username = $2`,
        [passwordHash, 'cathyd']
      );

      console.log('✅ Password updated successfully!');
      console.log('   Username: cathyd');
      console.log(`   Password: ${testPassword}\n`);
    } else {
      console.log('📝 Creating new cathyd user...\n');

      const testPassword = 'password123';
      const saltRounds = 10;
      const passwordHash = await bcrypt.hash(testPassword, saltRounds);

      // Create human record
      const humanResult = await client.query(
        `INSERT INTO humans (first_name, last_name, created_at)
         VALUES ($1, $2, NOW())
         RETURNING id`,
        ['Cathy', 'D']
      );

      const humanId = humanResult.rows[0].id;
      console.log(`✅ Created human record with ID: ${humanId}`);

      // Create customer record
      await client.query(
        `INSERT INTO customers (human_id, username, password_hash, created_at)
         VALUES ($1, $2, $3, NOW())`,
        [humanId, 'cathyd', passwordHash]
      );

      console.log(`✅ Created customer record for cathyd`);

      // Create email history
      await client.query(
        `INSERT INTO email_history (human_id, email, effective_from, created_at)
         VALUES ($1, $2, NOW(), NOW())`,
        [humanId, 'grammyhaynes0727@gmail.com']
      );

      console.log(`✅ Created email history\n`);

      console.log('📝 Login Details:');
      console.log('   Username: cathyd');
      console.log(`   Email: grammyhaynes0727@gmail.com`);
      console.log(`   Password: ${testPassword}\n`);
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
