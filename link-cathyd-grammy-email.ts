import pg from 'pg';
import { readFileSync } from 'fs';
import { resolve } from 'path';
const { Pool } = pg;

// Load .env.local
const envPath = resolve('.env.local');
const envContent = readFileSync(envPath, 'utf-8');
const envVars: Record<string, string> = {};
envContent.split('\n').forEach(line => {
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
    
    // Step 1: Find cathyd customer
    console.log('🔍 Step 1: Finding cathyd customer...\n');
    const cathyd = await client.query(
      `SELECT c.id, c.human_id, c.username, h.first_name, h.last_name
       FROM customers c
       JOIN humans h ON c.human_id = h.id
       WHERE c.username = $1`,
      ['cathyd']
    );
    
    if (cathyd.rows.length === 0) {
      console.log('❌ cathyd customer not found');
      process.exit(1);
    }
    
    const cathyd_human_id = cathyd.rows[0].human_id;
    console.log(`✅ Found cathyd:`);
    console.log(`   Human ID: ${cathyd_human_id}`);
    console.log(`   Name: ${cathyd.rows[0].first_name} ${cathyd.rows[0].last_name}\n`);
    
    // Step 2: Get current email for cathyd
    console.log('🔍 Step 2: Checking current email for cathyd...\n');
    const currentEmail = await client.query(
      `SELECT email FROM email_history 
       WHERE human_id = $1 AND effective_to IS NULL`,
      [cathyd_human_id]
    );
    
    if (currentEmail.rows.length > 0) {
      console.log(`   Current email: ${currentEmail.rows[0].email}`);
      
      // Mark old email as inactive
      console.log('   Marking old email as inactive...\n');
      await client.query(
        `UPDATE email_history 
         SET effective_to = NOW()
         WHERE human_id = $1 AND effective_to IS NULL`,
        [cathyd_human_id]
      );
    }
    
    // Step 3: Add grammyhaynes0727@gmail.com to cathyd
    console.log('🔄 Step 3: Adding grammyhaynes0727@gmail.com to cathyd...\n');
    await client.query(
      `INSERT INTO email_history (human_id, email, effective_from, created_at)
       VALUES ($1, $2, NOW(), NOW())`,
      [cathyd_human_id, 'grammyhaynes0727@gmail.com']
    );
    
    console.log('✅ Email added successfully!\n');
    
    // Step 4: Remove the standalone grammyhaynes user
    console.log('🔄 Step 4: Cleaning up standalone grammyhaynes record...\n');
    
    const grammy = await client.query(
      `SELECT h.id FROM humans h
       JOIN customers c ON h.id = c.human_id
       WHERE c.username = $1`,
      ['grammyhaynes']
    );
    
    if (grammy.rows.length > 0) {
      const grammy_human_id = grammy.rows[0].id;
      
      // Delete email_history for grammyhaynes
      await client.query(
        `DELETE FROM email_history WHERE human_id = $1`,
        [grammy_human_id]
      );
      
      // Delete customer record for grammyhaynes
      await client.query(
        `DELETE FROM customers WHERE human_id = $1`,
        [grammy_human_id]
      );
      
      // Delete human record for grammyhaynes
      await client.query(
        `DELETE FROM humans WHERE id = $1`,
        [grammy_human_id]
      );
      
      console.log('✅ Standalone grammyhaynes record removed\n');
    }
    
    // Step 5: Verify the setup
    console.log('✅ Step 5: Verification\n');
    
    const verify = await client.query(
      `SELECT h.id, h.first_name, h.last_name, c.username, eh.email
       FROM email_history eh
       JOIN humans h ON eh.human_id = h.id
       LEFT JOIN customers c ON h.id = c.human_id
       WHERE LOWER(c.username) = $1 AND eh.effective_to IS NULL`,
      ['cathyd']
    );
    
    if (verify.rows.length > 0) {
      const row = verify.rows[0];
      console.log('📝 Final Setup:');
      console.log(`   Username: ${row.username}`);
      console.log(`   Email: ${row.email}`);
      console.log(`   Name: ${row.first_name} ${row.last_name}\n`);
      
      console.log('✅ cathyd and grammyhaynes0727@gmail.com are now linked!\n');
      console.log('📝 Login Details:');
      console.log(`   Email: ${row.email}`);
      console.log(`   Username: ${row.username}`);
      console.log(`   Password: password123\n`);
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
