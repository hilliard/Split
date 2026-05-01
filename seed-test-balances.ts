import { db } from './src/db';
import { events, expenseGroups, groupMembers, humans, expenses, expenseSplits } from './src/db/schema';
import { eq, like, or } from 'drizzle-orm';
import * as crypto from 'crypto';

async function seedTestData() {
  console.log('Seeding test data for settlements...');

  // Find the Disney World or Teresa group
  const groups = await db.select().from(expenseGroups).where(
    or(
      like(expenseGroups.name, '%Disney%'),
      like(expenseGroups.name, '%Disnet%'),
      like(expenseGroups.name, '%Teresa%')
    )
  );

  if (groups.length === 0) {
    console.log('❌ Could not find a group matching Disney or Teresa.');
    process.exit(1);
  }

  const group = groups[0];
  console.log(`✅ Found Group: ${group.name} (${group.id})`);

  // Get members of this group
  let members = await db.select().from(groupMembers).where(eq(groupMembers.groupId, group.id));
  
  if (members.length < 2) {
    console.log('Group has less than 2 members. Adding cathyd or another user to the group...');
    // Find cathyd
    const allUsers = await db.select().from(humans);
    const cathyd = allUsers.find(u => u.firstName?.toLowerCase() === 'cathy' || u.lastName?.toLowerCase() === 'd') || allUsers.find(u => u.id !== members[0]?.userId);
    
    if (cathyd && members.findIndex(m => m.userId === cathyd.id) === -1) {
      await db.insert(groupMembers).values({
        id: crypto.randomUUID(),
        groupId: group.id,
        userId: cathyd.id,
      });
      console.log(`✅ Added ${cathyd.firstName} to the group.`);
      members = await db.select().from(groupMembers).where(eq(groupMembers.groupId, group.id));
    }
  }

  if (members.length < 2) {
    console.log('❌ Could not find enough users to create a settlement test.');
    process.exit(1);
  }

  const user1 = members[0].userId;
  const user2 = members[1].userId;

  // Let's get their names for the log
  const users = await db.select().from(humans).where(or(eq(humans.id, user1), eq(humans.id, user2)));
  const u1Name = users.find(u => u.id === user1)?.firstName;
  const u2Name = users.find(u => u.id === user2)?.firstName;

  // Find the event linked to this group
  const eventList = await db.select().from(events).where(eq(events.groupId, group.id));
  const eventId = eventList.length > 0 ? eventList[0].id : null;

  console.log(`✅ Ready to create expense. User1: ${u1Name}, User2: ${u2Name}`);

  // 1. Create an expense paid by user1
  const expenseId = crypto.randomUUID();
  const totalAmountCents = 15000; // $150.00
  
  await db.insert(expenses).values({
    id: expenseId,
    eventId: eventId,
    groupId: group.id,
    paidBy: user1,
    amount: totalAmountCents,
    description: 'Dinner and Drinks',
    date: new Date(),
    currency: 'USD',
  });

  console.log(`✅ Created Expense: Dinner and Drinks ($150.00) paid by ${u1Name}`);

  // 2. Create splits (User2 owes User1 for half)
  const amountPerPerson = 7500; // $75.00
  
  await db.insert(expenseSplits).values([
    {
      id: crypto.randomUUID(),
      expenseId: expenseId,
      userId: user1,
      amount: amountPerPerson,
    },
    {
      id: crypto.randomUUID(),
      expenseId: expenseId,
      userId: user2,
      amount: amountPerPerson,
    }
  ]);

  console.log(`✅ Created Expense Splits: ${u2Name} now owes ${u1Name} $75.00.`);

  // 3. Create another expense paid by user2 to make it interesting
  const expenseId2 = crypto.randomUUID();
  const totalAmountCents2 = 4000; // $40.00

  await db.insert(expenses).values({
    id: expenseId2,
    eventId: eventId,
    groupId: group.id,
    paidBy: user2,
    amount: totalAmountCents2,
    description: 'Uber Ride',
    date: new Date(),
    currency: 'USD',
  });

  console.log(`✅ Created Expense: Uber Ride ($40.00) paid by ${u2Name}`);

  // Split equally
  await db.insert(expenseSplits).values([
    {
      id: crypto.randomUUID(),
      expenseId: expenseId2,
      userId: user1,
      amount: 2000,
    },
    {
      id: crypto.randomUUID(),
      expenseId: expenseId2,
      userId: user2,
      amount: 2000,
    }
  ]);

  console.log(`✅ Created Expense Splits: ${u1Name} now owes ${u2Name} $20.00.`);
  
  console.log(`\n🎉 Net Balance: ${u2Name} owes ${u1Name} $55.00 overall in this group.`);
  console.log('You can now log in and test the Settlement UI!');
  process.exit(0);
}

seedTestData().catch(console.error);
