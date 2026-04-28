import { db } from './src/db';
import { groupMembers, humans, customers, expenseGroups } from './src/db/schema';
import { eq, and, sql } from 'drizzle-orm';

async function checkCathyd() {
  const members = await db.select({
    id: groupMembers.id,
    userId: groupMembers.userId,
    groupId: groupMembers.groupId,
    joinedAt: groupMembers.joinedAt,
    humanName: humans.firstName,
    username: customers.username,
    groupName: expenseGroups.name,
  })
  .from(groupMembers)
  .leftJoin(humans, eq(groupMembers.userId, humans.id))
  .leftJoin(customers, eq(humans.id, customers.humanId))
  .leftJoin(expenseGroups, eq(groupMembers.groupId, expenseGroups.id))
  .where(sql`${expenseGroups.name} ILIKE '%Teresa%'`);

  console.log('Members in Teresa group:');
  console.log(members);
  
  process.exit(0);
}

checkCathyd();
