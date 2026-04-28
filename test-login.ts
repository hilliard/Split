import { db } from './src/db';
import { customers } from './src/db/schema';
import { eq } from 'drizzle-orm';
import { verifyPassword } from './src/utils/password';

async function checkLogin() {
  const username = 'johnelway';
  const password = 'password123';
  
  console.log(`Checking DB for ${username}...`);
  const [customer] = await db.select().from(customers).where(eq(customers.username, username));
  
  if (!customer) {
    console.log('❌ User not found in DB!');
    process.exit(1);
  }
  
  console.log(`Found user: ${customer.username}`);
  console.log(`Hash: ${customer.passwordHash}`);
  
  const isValid = await verifyPassword(password, customer.passwordHash);
  console.log(`Password is valid? ${isValid}`);
  process.exit(0);
}

checkLogin();
