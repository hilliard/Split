import { db } from './src/db/index';
import { emailHistory, humans, customers } from './src/db/human-centric-schema';
import { eq, and, isNull } from 'drizzle-orm';

async function testConnection() {
  try {
    console.log('\n🧪 Testing database connection...\n');

    // Test 1: Simple count query
    console.log('Test 1: Counting email_history records...');
    const emailCount = await db.select().from(emailHistory);
    console.log(`✓ Found ${emailCount.length} email records`);

    // Test 2: The exact login query
    console.log('\nTest 2: Running login query for john@example.com...');
    const result = await db
      .select({
        human: humans,
        customer: customers,
        currentEmail: emailHistory.email,
      })
      .from(emailHistory)
      .innerJoin(humans, eq(emailHistory.humanId, humans.id))
      .leftJoin(customers, eq(humans.id, customers.humanId))
      .where(and(eq(emailHistory.email, 'john@example.com'), isNull(emailHistory.effectiveTo)))
      .limit(1);

    console.log('✓ Query succeeded!');
    console.log('Result:', JSON.stringify(result[0], null, 2));

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  }
}

testConnection();
