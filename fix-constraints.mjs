import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function fixConstraints() {
  try {
    console.log('🔧 Fixing constraints on events table...\n');

    // Drop the incorrectly named foreign key constraint
    console.log('Step 1: Dropping incorrectly named constraint groups_owner_id_fkey');
    await pool.query(`ALTER TABLE "events" DROP CONSTRAINT IF EXISTS "groups_owner_id_fkey"`);
    console.log('✓ Dropped\n');

    // Rename the primary key constraint
    console.log('Step 2: Renaming primary key from groups_pkey to events_pkey');
    await pool.query(`ALTER TABLE "events" RENAME CONSTRAINT "groups_pkey" TO "events_pkey"`);
    console.log('✓ Renamed\n');

    // Add the correct foreign key constraint for owner_id
    console.log('Step 3: Adding correct foreign key constraint');
    await pool.query(`
      ALTER TABLE "events" ADD CONSTRAINT "events_owner_id_fkey" 
      FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE CASCADE
    `);
    console.log('✓ Added\n');

    console.log('✅ All constraints fixed!');
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.detail) console.error('Detail:', error.detail);
  } finally {
    await pool.end();
  }
}

fixConstraints();
