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
    
    // Step 1: Get all users with emails
    console.log('📋 Step 1: Reading users from old schema...\n');
    const usersResult = await client.query(`
      SELECT id, email, created_at FROM users 
      WHERE email IS NOT NULL
    `);
    
    console.log(`Found ${usersResult.rows.length} users with emails\n`);
    if (usersResult.rows.length > 0) {
      console.log('Sample emails:');
      usersResult.rows.slice(0, 3).forEach(row => {
        console.log(`  - ${row.email}`);
      });
      console.log('');
    }
    
    // Step 2: Map old users to new humans table
    console.log('📊 Step 2: Mapping users to humans...\n');
    const mappingResult = await client.query(`
      SELECT DISTINCT u.id as user_id, u.email, c.human_id
      FROM users u
      LEFT JOIN customers c ON u.username = c.username OR u.id = c.id
      WHERE u.email IS NOT NULL
    `);
    
    console.log(`Found ${mappingResult.rows.length} user-to-human mappings\n`);
    
    // Step 3: Migrate emails to email_history
    console.log('🔄 Step 3: Migrating emails to email_history...\n');
    
    let migratedCount = 0;
    let skipCount = 0;
    
    for (const row of mappingResult.rows) {
      const { user_id, email, human_id } = row;
      
      if (!human_id) {
        console.log(`⚠️  No human_id for user ${user_id} (${email}) - skipping`);
        skipCount++;
        continue;
      }
      
      try {
        // Check if already in email_history
        const existing = await client.query(
          `SELECT id FROM email_history WHERE human_id = $1 AND effective_to IS NULL`,
          [human_id]
        );
        
        if (existing.rows.length > 0) {
          console.log(`ℹ️  ${email} already in email_history`);
          skipCount++;
          continue;
        }
        
        // Insert into email_history
        await client.query(
          `INSERT INTO email_history (human_id, email, effective_from, created_at)
           VALUES ($1, $2, NOW(), NOW())`,
          [human_id, email]
        );
        
        migratedCount++;
        console.log(`✅ ${email}`);
      } catch (error) {
        console.error(`❌ Error migrating ${email}:`, error instanceof Error ? error.message : String(error));
      }
    }
    
    console.log(`\n✅ Migration complete!`);
    console.log(`  Migrated: ${migratedCount}`);
    console.log(`  Skipped: ${skipCount}\n`);
    
    // Step 4: Verify migration
    console.log('📊 Step 4: Verification...\n');
    const totalEmails = await client.query(`SELECT COUNT(*) as count FROM email_history WHERE effective_to IS NULL`);
    console.log(`Total current emails in email_history: ${totalEmails.rows[0].count}\n`);
    
    // Check for grammyhaynes
    const grammy = await client.query(`
      SELECT eh.email, h.id, h.first_name, h.last_name, c.username
      FROM email_history eh
      JOIN humans h ON eh.human_id = h.id
      LEFT JOIN customers c ON h.id = c.human_id
      WHERE LOWER(eh.email) LIKE '%grammy%' OR LOWER(h.first_name) LIKE '%grammy%'
    `);
    
    if (grammy.rows.length > 0) {
      console.log('✅ Found grammyhaynes user(s):');
      grammy.rows.forEach(row => {
        console.log(`  Email: ${row.email}`);
        console.log(`  Name: ${row.first_name} ${row.last_name}`);
        console.log(`  Human ID: ${row.id}`);
        console.log(`  Username: ${row.username}`);
        console.log('');
      });
    } else {
      console.log('⚠️  No grammyhaynes user found in database');
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
