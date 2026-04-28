import { db } from './src/db';
import { 
  humans, 
  customers, 
  expenseGroups, 
  groupMembers, 
  events, 
  activities, 
  expenses, 
  expenseSplits 
} from './src/db/schema';
import { hashPassword } from './src/utils/password';
import { eq, inArray } from 'drizzle-orm';

async function seedDisneyTrip() {
  console.log('🌟 Seeding Disney Trip Scenario...');

  try {
    // 0. Clean up old 'Eway' mistake if it exists
    await db.delete(customers).where(inArray(customers.username, ['johneway', 'janeteway', 'johnelway', 'janetelway']));

    // 1. Create Humans
    const [john] = await db.insert(humans).values({
      firstName: 'John',
      lastName: 'Elway',
    }).returning();

    const [janet] = await db.insert(humans).values({
      firstName: 'Janet',
      lastName: 'Elway',
    }).returning();

    console.log(`✅ Created humans: John (${john.id}) and Janet (${janet.id})`);

    // 2. Create Customers
    const passwordHash = await hashPassword('password123');

    const [johnCustomer] = await db.insert(customers).values({
      humanId: john.id,
      username: 'johnelway',
      email: 'john@elway.test',
      passwordHash,
      emailVerified: true
    }).returning();

    const [janetCustomer] = await db.insert(customers).values({
      humanId: janet.id,
      username: 'janetelway',
      email: 'janet@elway.test',
      passwordHash,
      emailVerified: true
    }).returning();

    console.log('✅ Created customer accounts');

    // 3. Create Group
    const [disneyGroup] = await db.insert(expenseGroups).values({
      name: 'Elway Disney Trip 🏰',
      createdBy: john.id
    }).returning();

    console.log(`✅ Created group: ${disneyGroup.name} (${disneyGroup.id})`);

    // 4. Add Members to Group
    await db.insert(groupMembers).values([
      { groupId: disneyGroup.id, userId: john.id, joinedAt: new Date() },
      { groupId: disneyGroup.id, userId: janet.id, joinedAt: new Date() }
    ]);

    console.log('✅ Added John and Janet to group');

    // 5. Create Event
    const startDate = new Date();
    startDate.setDate(startDate.getDate() + 14); // Trip in 2 weeks
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + 7); // 1 week long

    const [disneyEvent] = await db.insert(events).values({
      creatorId: john.id,
      groupId: disneyGroup.id,
      title: 'Disney World Vacation',
      type: 'vacation',
      status: 'scheduled',
      startTime: startDate,
      endTime: endDate,
      timezone: 'America/New_York',
      currency: 'USD'
    }).returning();

    console.log(`✅ Created event: ${disneyEvent.title}`);

    // 6. Create Activities
    const [flightsAct, hotelAct, ticketsAct, dinnerAct] = await db.insert(activities).values([
      { eventId: disneyEvent.id, title: 'Flights to MCO ✈️', createdBy: john.id },
      { eventId: disneyEvent.id, title: 'Disney Resort Hotel 🏨', createdBy: janet.id },
      { eventId: disneyEvent.id, title: 'Park Hopper Tickets 🎢', createdBy: john.id },
      { eventId: disneyEvent.id, title: 'Dinner at Be Our Guest 🍽️', createdBy: janet.id },
    ]).returning();

    console.log('✅ Created activities');

    // 7. Create Expenses
    // John pays $800 for flights
    const [flightExp] = await db.insert(expenses).values({
      eventId: disneyEvent.id,
      groupId: disneyGroup.id,
      activityId: flightsAct.id,
      amount: 80000, // $800.00 in cents
      description: 'Delta round trip',
      category: 'transportation',
      paidBy: john.id
    }).returning();

    // Janet pays $1200 for hotel
    const [hotelExp] = await db.insert(expenses).values({
      eventId: disneyEvent.id,
      groupId: disneyGroup.id,
      activityId: hotelAct.id,
      amount: 120000, // $1200.00
      description: 'Polynesian Village Resort',
      category: 'lodging',
      paidBy: janet.id
    }).returning();

    // John pays $300 for tickets
    const [ticketExp] = await db.insert(expenses).values({
      eventId: disneyEvent.id,
      groupId: disneyGroup.id,
      activityId: ticketsAct.id,
      amount: 30000, // $300.00
      description: '3-day park hopper',
      category: 'entertainment',
      paidBy: john.id
    }).returning();

    // Janet pays $150 for dinner
    const [dinnerExp] = await db.insert(expenses).values({
      eventId: disneyEvent.id,
      groupId: disneyGroup.id,
      activityId: dinnerAct.id,
      amount: 15000, // $150.00
      tipAmount: 3000, // $30.00 tip
      description: 'Be Our Guest Restaurant',
      category: 'food',
      paidBy: janet.id
    }).returning();

    console.log('✅ Created expenses');

    // 8. Create Splits (50/50 for everything)
    const allSplits = [
      // Flights ($800 -> $400 each)
      { expenseId: flightExp.id, userId: john.id, amount: 40000 },
      { expenseId: flightExp.id, userId: janet.id, amount: 40000 },
      
      // Hotel ($1200 -> $600 each)
      { expenseId: hotelExp.id, userId: john.id, amount: 60000 },
      { expenseId: hotelExp.id, userId: janet.id, amount: 60000 },
      
      // Tickets ($300 -> $150 each)
      { expenseId: ticketExp.id, userId: john.id, amount: 15000 },
      { expenseId: ticketExp.id, userId: janet.id, amount: 15000 },
      
      // Dinner ($180 total -> $90 each)
      { expenseId: dinnerExp.id, userId: john.id, amount: 9000 },
      { expenseId: dinnerExp.id, userId: janet.id, amount: 9000 },
    ];

    await db.insert(expenseSplits).values(allSplits);
    console.log('✅ Created 50/50 expense splits');

    console.log(`
🎉 Disney Trip Scenario Successfully Seeded!
--------------------------------------------------
Users created:
- Username: johnelway / Password: password123
- Username: janetelway / Password: password123

Summary of spending:
- John paid: $1100.00
- Janet paid: $1380.00 (includes tip)
- Total trip cost: $2480.00
--------------------------------------------------
Log in as 'johnelway' to check the balances!
    `);

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

seedDisneyTrip();
