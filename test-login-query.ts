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
    
    // Run the exact login query from the error message
    console.log('🧪 Testing login query...\n');
    console.log('Query: SELECT ... FROM email_history');
    console.log('  WHERE email = grammyhaynes0720@gmail.com AND effective_to IS NULL\n');
    
    const result = await client.query(
      `SELECT 
        "humans"."id", "humans"."first_name", "humans"."last_name", "humans"."dob", 
        "humans"."gender", "humans"."phone", "humans"."created_at", "humans"."updated_at", 
        "customers"."id", "customers"."human_id", "customers"."username", 
        "customers"."password_hash", "customers"."loyalty_points", 
        "customers"."created_at" as customer_created_at, 
        "customers"."updated_at" as customer_updated_at, 
        "email_history"."email"
      FROM "email_history" 
      INNER JOIN "humans" ON "email_history"."human_id" = "humans"."id" 
      LEFT JOIN "customers" ON "humans"."id" = "customers"."human_id" 
      WHERE ("email_history"."email" = $1 AND "email_history"."effective_to" IS NULL) 
      LIMIT 1`,
      ['grammyhaynes0720@gmail.com']
    );
    
    if (result.rows.length === 0) {
      console.log('❌ Query returned no results\n');
    } else {
      const row = result.rows[0];
      console.log('✅ Query succeeded!\n');
      console.log('📊 Result:');
      console.log(`  Email: ${row.email}`);
      console.log(`  Human ID: ${row.id}`);
      console.log(`  Name: ${row.first_name} ${row.last_name}`);
      console.log(`  Customer ID: ${row.customers_id}`);
      console.log(`  Username: ${row.username}`);
      console.log(`  Has password hash: ${row.password_hash ? '✅ Yes' : '❌ No'}\n`);
      
      console.log('✅ Login query is ready to use!');
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
