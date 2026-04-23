import { db } from './src/db/index.js';

async function addMetadataColumn() {
  try {
    console.log('Adding metadata column to activities table...');

    // Execute raw SQL to add metadata column
    await db.execute(`
      ALTER TABLE activities
      ADD COLUMN IF NOT EXISTS metadata json DEFAULT '{}'::json
    `);

    console.log('✅ Metadata column added successfully to activities table!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error adding metadata column:', error);
    process.exit(1);
  }
}

addMetadataColumn();
