import { db } from './src/db';
import { customers } from './src/db/schema';

async function listUsers() {
  console.log('Fetching users from DB...');
  const users = await db.select({ username: customers.username }).from(customers);
  console.log('Users in DB:');
  users.forEach(u => console.log(` - "${u.username}"`));
  process.exit(0);
}

listUsers();
