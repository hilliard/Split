import { db } from './src/db/index.js';
import { emailHistory, humans, customers } from './src/db/human-centric-schema.js';
import { ilike, eq } from 'drizzle-orm';

try {
  console.log('🔍 Searching for emails containing "grammyhaynes"...\n');
  
  // Search for any emails containing 'grammyhaynes'
  const result = await db
    .select({
      emailId: emailHistory.id,
      email: emailHistory.email,
      humanId: emailHistory.humanId,
      effectiveFrom: emailHistory.effectiveFrom,
      effectiveTo: emailHistory.effectiveTo,
      firstName: humans.firstName,
      lastName: humans.lastName,
      username: customers.username,
    })
    .from(emailHistory)
    .innerJoin(humans, eq(emailHistory.humanId, humans.id))
    .leftJoin(customers, eq(humans.id, customers.humanId))
    .where(ilike(emailHistory.email, '%grammyhaynes%'));
  
  if (result.length === 0) {
    console.log('❌ No emails found containing "grammyhaynes"\n');
  } else {
    console.log(`✓ Found ${result.length} email record(s):\n`);
    result.forEach((record, idx) => {
      console.log(`[${idx + 1}]`);
      console.log(`  Email: ${record.email}`);
      console.log(`  Human ID: ${record.humanId}`);
      console.log(`  Name: ${record.firstName} ${record.lastName}`);
      console.log(`  Username: ${record.username}`);
      console.log(`  Effective From: ${record.effectiveFrom}`);
      console.log(`  Effective To: ${record.effectiveTo}`);
      console.log('');
    });
  }
  
  // Also check if 0720 and 0727 exist separately
  console.log('\n🔍 Checking specifically for 0720 and 0727 variants...\n');
  const email0720 = await db.select().from(emailHistory).where(eq(emailHistory.email, 'grammyhaynes0720@gmail.com'));
  const email0727 = await db.select().from(emailHistory).where(eq(emailHistory.email, 'grammyhaynes0727@gmail.com'));
  
  console.log(`grammyhaynes0720@gmail.com: ${email0720.length > 0 ? 'EXISTS' : 'NOT FOUND'}`);
  console.log(`grammyhaynes0727@gmail.com: ${email0727.length > 0 ? 'EXISTS' : 'NOT FOUND'}`);
  
  process.exit(0);
} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}
