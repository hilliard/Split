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
    
    const migrations = [
      // 1. Create email_history table
      `CREATE TABLE IF NOT EXISTS "email_history" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "human_id" uuid NOT NULL REFERENCES "humans"("id") ON DELETE CASCADE,
        "email" varchar(255) NOT NULL,
        "effective_from" timestamp DEFAULT now() NOT NULL,
        "effective_to" timestamp,
        "created_at" timestamp DEFAULT now() NOT NULL,
        CONSTRAINT "email_history_unique" UNIQUE("human_id", "effective_from")
      );`,
      
      // 2. Create indexes for email_history
      `CREATE INDEX IF NOT EXISTS "email_history_human_idx" ON "email_history" USING btree ("human_id");`,
      `CREATE INDEX IF NOT EXISTS "email_history_email_idx" ON "email_history" USING btree ("email");`,
      `CREATE INDEX IF NOT EXISTS "email_history_effective_idx" ON "email_history" USING btree ("effective_from", "effective_to");`,
    ];
    
    console.log('🔄 Running migrations...\n');
    
    for (let i = 0; i < migrations.length; i++) {
      try {
        console.log(`[${i + 1}/${migrations.length}] Executing...`);
        await client.query(migrations[i]);
        console.log('✅ Success\n');
      } catch (error) {
        if (error instanceof Error && (error.message.includes('already exists') || error.message.includes('duplicate'))) {
          console.log('ℹ️  Already exists, skipping\n');
        } else {
          console.error('❌ Error:', error);
          throw error;
        }
      }
    }
    
    console.log('✅ All migrations completed successfully!\n');
    
    // Verify email_history exists now
    const checkResult = await client.query(`
      SELECT EXISTS(
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'email_history'
      ) as exists
    `);
    
    if (checkResult.rows[0].exists) {
      console.log('✅ Verification: email_history table now EXISTS\n');
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
