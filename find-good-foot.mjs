import pkg from "pg";
const { Client } = pkg;

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

try {
  await client.connect();

  // Find the event
  const eventResult = await client.query(
    `SELECT id, name, "groupId", "creatorId", "startTime", "createdAt" 
     FROM events 
     WHERE name ILIKE '%good foot%' 
     ORDER BY "createdAt" DESC 
     LIMIT 1`,
  );

  console.log("📋 Event found:", eventResult.rows[0]);

  if (eventResult.rows[0]) {
    const eventId = eventResult.rows[0].id;
    const groupId = eventResult.rows[0].groupId;

    // Check expenses in that group
    const expenseResult = await client.query(
      `SELECT id, amount, description, "paidBy", "createdAt" 
       FROM expenses 
       WHERE "groupId" = $1 
       ORDER BY "createdAt" DESC`,
      [groupId],
    );

    console.log(
      `💰 Expenses in group ${groupId}:`,
      expenseResult.rows.length,
      expenseResult.rows,
    );

    // Check group details
    const groupResult = await client.query(
      `SELECT id, name, "creatorId" FROM expense_groups WHERE id = $1`,
      [groupId],
    );
    console.log("👥 Group:", groupResult.rows[0]);

    // Check group members
    const membersResult = await client.query(
      `SELECT "userId", "joinedAt" FROM "groupMembers" WHERE "groupId" = $1`,
      [groupId],
    );
    console.log("👤 Group members:", membersResult.rows);
  }
} finally {
  await client.end();
}
