import postgres from 'postgres';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('❌ DATABASE_URL environment variable not set');
  process.exit(1);
}

const sql = postgres(connectionString, { ssl: 'require' });

async function diagnose() {
  try {
    console.log('🔍 Database Diagnostics');
    console.log('─'.repeat(60));

    // Check customers table
    const customers = await sql`SELECT id, human_id, username FROM customers LIMIT 5`;
    console.log(`\n📊 Customers (${customers.length} total):`);
    customers.forEach((c) => {
      console.log(`  - ${c.username}: customer_id=${c.id}, human_id=${c.human_id}`);
    });

    // Check humans table
    const humans = await sql`SELECT id FROM humans LIMIT 5`;
    console.log(`\n👥 Humans (${humans.length} total):`);
    humans.forEach((h) => {
      console.log(`  - ${h.id}`);
    });

    // Check for missing humans
    const missingHumans = await sql`
      SELECT c.id, c.human_id, c.username 
      FROM customers c 
      WHERE c.human_id NOT IN (SELECT id FROM humans)
    `;
    console.log(`\n⚠️  Customers missing humans (${missingHumans.length}):`);
    missingHumans.forEach((m) => {
      console.log(`  - ${m.username}: missing human_id=${m.human_id}`);
    });

    console.log('\n' + '─'.repeat(60));
  } catch (error) {
    console.error('❌ Error:', error instanceof Error ? error.message : error);
  } finally {
    await sql.end();
  }
}

diagnose();
