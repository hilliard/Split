import { db } from './src/db';
import { groupMembers, humans, users, expenseGroups, events } from './src/db/schema';
import { eq, sql } from 'drizzle-orm';

async function checkDuplicates() {
  const [event] = await db.select().from(events).where(sql`${events.title} ILIKE '%Teresa%'`).limit(1);
  if (!event || !event.groupId) {
    console.log('Event or groupId not found');
    process.exit(1);
  }

  const members = await db.select({
    id: groupMembers.id,
    humanId: humans.id,
    firstName: humans.firstName,
    lastName: humans.lastName,
    joinedAt: groupMembers.joinedAt,
    groupName: expenseGroups.name,
  })
  .from(groupMembers)
  .leftJoin(humans, eq(groupMembers.userId, humans.id))
  .leftJoin(expenseGroups, eq(groupMembers.groupId, expenseGroups.id))
  .where(eq(groupMembers.groupId, event.groupId))
  .orderBy(groupMembers.joinedAt);

  console.log('Group name:', members[0]?.groupName);
  console.log(members);
  process.exit(0);
}

checkDuplicates();
