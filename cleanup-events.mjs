import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function cleanupAndFix() {
  try {
    console.log('🧹 Cleaning up and fixing events table...\n');
    
    // First, delete all events (they have invalid owner IDs)
    console.log('Step 1: Deleting all events with invalid owner IDs');
    const deleteResult = await pool.query(`DELETE FROM "events"`);
    console.log(`✓ Deleted ${deleteResult.rowCount} events\n`);
    
    // Now add the foreign key constraint
    console.log('Step 2: Adding foreign key constraint');
    await pool.query(`
      ALTER TABLE "events" ADD CONSTRAINT "events_owner_id_fkey" 
      FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE CASCADE
    `);
    console.log('✓ Constraint added\n');
    
    console.log('✅ Events table is now clean and properly constrained!');
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.detail) console.error('Detail:', error.detail);
  } finally {
    await pool.end();
  }
}

cleanupAndFix();
