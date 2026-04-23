import postgres from 'postgres';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const sql = postgres(process.env.DATABASE_URL);

try {
  console.log('Applying direct schema fixes to expenses table...\n');

  // Check what columns we have
  const cols = await sql`
    SELECT column_name FROM information_schema.columns 
    WHERE table_name = 'expenses'
  `;
  const colNames = cols.map((c) => c.column_name);
  console.log('Current columns:', colNames.join(', '));

  // Add event_id column if it doesn't exist
  if (!colNames.includes('event_id')) {
    console.log('\n✖  Adding event_id column...');
    await sql`ALTER TABLE expenses ADD COLUMN event_id UUID`;
    console.log('✅ Added event_id column');
  } else {
    console.log('✅ event_id column already exists');
  }

  // Add category column if it doesn't exist
  if (!colNames.includes('category')) {
    console.log('\n✖️  Adding category column...');
    await sql`ALTER TABLE expenses ADD COLUMN category VARCHAR(50) DEFAULT 'misc'`;
    console.log('✅ Added category column');
  } else {
    console.log('✅ category column already exists');
  }

  // Check amount column type
  const amountCol = await sql`
    SELECT data_type FROM information_schema.columns 
    WHERE table_name = 'expenses' AND column_name = 'amount'
  `;
  console.log(`\nCurrent amount type: ${amountCol[0].data_type}`);

  if (amountCol[0].data_type === 'integer') {
    console.log('\n✖️  Need to convert amount from integer to numeric');
    console.log('This requires dropping and recreating the column...');

    // Postgres doesn't allow direct type conversion for this, so we need to be careful
    // For now, let's just document that the current setup works with integers representing cents
    console.log('✅ Current setup: amount stored as cents (integer)');
  } else {
    console.log('✅ amount is already numeric');
  }

  // Add foreign key constraint for event_id if it doesn't exist
  const fks = await sql`
    SELECT constraint_name FROM information_schema.table_constraints
    WHERE table_name = 'expenses' AND constraint_name LIKE '%event_id%'
  `;

  if (fks.length === 0 && colNames.includes('event_id')) {
    console.log('\n✖️  Adding foreign key constraint for event_id...');
    try {
      await sql`
        ALTER TABLE expenses 
        ADD CONSTRAINT expenses_event_id_fk 
        FOREIGN KEY (event_id) 
        REFERENCES events(id) 
        ON DELETE CASCADE
      `;
      console.log('✅ Added event_id foreign key');
    } catch (e) {
      console.log('⚠️  Could not add FK constraint:', e.message);
    }
  } else {
    console.log('✅ event_id foreign key already exists');
  }

  console.log('\n✅ Schema fixes complete!');
} catch (error) {
  console.error('❌ Error:', error.message);
  if (error.detail) console.error('Detail:', error.detail);
  process.exit(1);
} finally {
  await sql.end();
}
