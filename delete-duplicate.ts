import { db } from './src/db';
import { groupMembers } from './src/db/schema';
import { eq } from 'drizzle-orm';

async function fix() {
  await db.delete(groupMembers).where(eq(groupMembers.id, '53ca025d-10a4-4ef8-a942-27a11c485207'));
  console.log('Deleted duplicate cathyd');
  process.exit(0);
}

fix();
