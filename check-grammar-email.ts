import { db } from './src/db/index';
import { emailHistory } from './src/db/human-centric-schema';
import { eq } from 'drizzle-orm';

async function main() {
  try {
    console.log('\n🔍 Searching for specific emails...\n');

    // Check if 0720 and 0727 exist separately
    const email0720 = await db
      .select()
      .from(emailHistory)
      .where(eq(emailHistory.email, 'grammyhaynes0720@gmail.com'));
    const email0727 = await db
      .select()
      .from(emailHistory)
      .where(eq(emailHistory.email, 'grammyhaynes0727@gmail.com'));

    console.log(
      `grammyhaynes0720@gmail.com: ${email0720.length > 0 ? '✓ EXISTS' : '❌ NOT FOUND'}`
    );
    if (email0720.length > 0) {
      console.log('  Details:', JSON.stringify(email0720[0], null, 2));
    }

    console.log(
      `\ngrammyhaynes0727@gmail.com: ${email0727.length > 0 ? '✓ EXISTS' : '❌ NOT FOUND'}`
    );
    if (email0727.length > 0) {
      console.log('  Details:', JSON.stringify(email0727[0], null, 2));
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

main();
