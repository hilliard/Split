import pg from 'pg';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import bcrypt from 'bcryptjs';
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
    
    // Generate a proper password hash for 'password123'
    console.log('🔐 Generating password hash...');
    const testPassword = 'password123';
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(testPassword, saltRounds);
    
    console.log('✅ Password hash generated\n');
    
    // Update grammyhaynes customer record with proper hash
    console.log('🔄 Updating grammyhaynes password...\n');
    
    const result = await client.query(
      `UPDATE customers 
       SET password_hash = $1, updated_at = NOW()
       WHERE username = $2
       RETURNING id, username`,
      [passwordHash, 'grammyhaynes']
    );
    
    if (result.rows.length > 0) {
      console.log('✅ Password updated successfully!');
      console.log(`   Username: grammyhaynes`);
      console.log(`   Password: ${testPassword}\n`);
      
      console.log('📝 Login Details:');
      console.log('   Email: grammyhaynes0720@gmail.com');
      console.log(`   Password: ${testPassword}\n`);
    } else {
      console.log('⚠️  grammyhaynes customer not found');
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
