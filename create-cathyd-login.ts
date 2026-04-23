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

    // Find cathyd human
    console.log('🔍 Finding cathyd human...\n');
    const cathydResult = await client.query(
      `SELECT id, first_name, last_name FROM humans WHERE first_name = 'cathyd'`
    );

    if (cathydResult.rows.length === 0) {
      console.log('❌ cathyd human not found');
      process.exit(1);
    }

    const humanId = cathydResult.rows[0].id;
    console.log(`✅ Found cathyd (ID: ${humanId})\n`);

    // Check if customer already exists
    const existingCustomer = await client.query(`SELECT id FROM customers WHERE human_id = $1`, [
      humanId,
    ]);

    if (existingCustomer.rows.length > 0) {
      console.log('⚠️  Customer record already exists, updating password...\n');

      const testPassword = 'password123';
      const saltRounds = 10;
      const passwordHash = await bcrypt.hash(testPassword, saltRounds);

      await client.query(`UPDATE customers SET password_hash = $1 WHERE human_id = $2`, [
        passwordHash,
        humanId,
      ]);

      console.log('✅ Password updated!');
    } else {
      console.log('📝 Creating customer record for cathyd...\n');

      const testPassword = 'password123';
      const saltRounds = 10;
      const passwordHash = await bcrypt.hash(testPassword, saltRounds);

      await client.query(
        `INSERT INTO customers (human_id, username, password_hash, created_at)
         VALUES ($1, $2, $3, NOW())`,
        [humanId, 'cathyd', passwordHash]
      );

      console.log('✅ Customer record created!');
    }

    console.log('\n📝 Login Details:');
    console.log('   Username: cathyd');
    console.log('   Email: grammyhaynes0727@gmail.com');
    console.log('   Password: password123\n');

    console.log('✅ cathyd is now ready to login!\n');

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
