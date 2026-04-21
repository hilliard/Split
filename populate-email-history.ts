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
    
    // Check if customers table has email column
    const columnsResult = await client.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'customers'
      ORDER BY column_name
    `);
    
    console.log('Customers table columns:');
    columnsResult.rows.forEach(row => console.log(`  - ${row.column_name}`));
    
    const hasEmailColumn = columnsResult.rows.some(row => row.column_name === 'email');
    
    if (!hasEmailColumn) {
      console.log('\n⚠️  customers table does not have an email column');
      console.log('Checking what email/username data is available...\n');
      
      // Get sample from customers table
      const sample = await client.query(`SELECT * FROM customers LIMIT 1`);
      if (sample.rows.length > 0) {
        console.log('Sample customer record:');
        console.log(JSON.stringify(sample.rows[0], null, 2));
      }
    } else {
      console.log('\n✓ customers table has email column\n');
      
      // Populate email_history from customers.email
      console.log('🔄 Populating email_history from customers...\n');
      
      const result = await client.query(`
        INSERT INTO email_history (human_id, email, effective_from, effective_to, created_at)
        SELECT 
          c.human_id,
          c.email,
          NOW(),
          NULL,
          NOW()
        FROM customers c
        WHERE c.human_id IS NOT NULL
          AND c.email IS NOT NULL
          AND NOT EXISTS (
            SELECT 1 FROM email_history eh 
            WHERE eh.human_id = c.human_id 
              AND eh.effective_to IS NULL
          )
        ON CONFLICT DO NOTHING;
      `);
      
      console.log(`✅ Added ${result.rowCount} email history records\n`);
    }
    
    // Show summary
    const totalEmails = await client.query(`SELECT COUNT(*) as count FROM email_history`);
    const currentEmails = await client.query(`SELECT COUNT(*) as count FROM email_history WHERE effective_to IS NULL`);
    
    console.log('📊 Email History Summary:');
    console.log(`  Total records: ${totalEmails.rows[0].count}`);
    console.log(`  Current emails: ${currentEmails.rows[0].count}\n`);
    
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
