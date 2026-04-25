// scripts/replace-flight.ts
// ---------------------------------------------------------------
// This script deletes the old individual flight expenses and
// creates a single “Round‑trip Flight” expense split 50/50.
// ---------------------------------------------------------------

import { db } from '../src/db/index.js';
import { expenses, expenseSplits } from '../src/db/schema.js';
import { eq, and, inArray } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

async function run() {
  // -----------------------------------------------------------
  // 1️⃣ CONFIG – replace these values with the IDs from your DB
  // -----------------------------------------------------------
  const EVENT_ID = '8b62cddc-b825-4137-90d2-9339881f461b'; // your event
  const SONNY_ID = '2f6b17aa-7bf0-4e28-8925-2d8d824fb193'; // Sonny (payer)
  const CATHYD_ID = 'afc527e4-bd37-4b0a-8f15-a9bb4d046f51'; // Cathyd (owes)
  const GROUP_ID = 'da27743c-1a87-47d3-a784-0ef08481a445'; // Houston Party People (group)

  // -----------------------------------------------------------
  // 2️⃣ Delete any existing flight expenses for this event
  // -----------------------------------------------------------
  const oldFlights = await db
    .select()
    .from(expenses)
    .where(
      and(
        eq(expenses.eventId, EVENT_ID),
        inArray(expenses.description, ['Flight To Houston', 'Flight To Denver'])
      )
    );

  for (const exp of oldFlights) {
    // Remove associated splits first (foreign‑key constraint)
    await db.delete(expenseSplits).where(eq(expenseSplits.expenseId, exp.id));
    // Then delete the expense itself
    await db.delete(expenses).where(eq(expenses.id, exp.id));
  }

  // -----------------------------------------------------------
  // 3️⃣ Insert the combined round‑trip flight expense
  // -----------------------------------------------------------
  const TOTAL_CENTS = 59362; // $593.62 total cost
  const newExpenseId = uuidv4();

  await db.insert(expenses).values({
    id: newExpenseId,
    eventId: EVENT_ID,
    description: 'Round‑trip Flight',
    amount: TOTAL_CENTS,
    paidBy: SONNY_ID,
    category: 'flight',
    // Optional: keep flight metadata for reference
    metadata: {
      airline: 'Delta Airlines',
      flightNumber: 'DL 1234',
      confirmationNumber: 'ABC-7890',
      takeOffTime: '2026-04-15T08:30:00Z',
      arrivalTime: '2026-04-15T12:45:00Z',
      seatNumber: '12A',
    },
  });

  // -----------------------------------------------------------
  // 4️⃣ Create the 50/50 splits (any odd cent stays with Sonny)
  // -----------------------------------------------------------
  const half = Math.floor(TOTAL_CENTS / 2);           // 29681 cents
  const remainder = TOTAL_CENTS - half;              // gives Sonny the extra cent if any

  await db.insert(expenseSplits).values([
    {
      id: uuidv4(),
      expenseId: newExpenseId,
      userId: CATHYD_ID,
      amount: half,          // Cathyd’s share
    },
    {
      id: uuidv4(),
      expenseId: newExpenseId,
      userId: SONNY_ID,
      amount: remainder,     // Sonny’s share (includes any remainder)
    },
  ]);

  console.log('✅ Round‑trip flight expense created and split 50/50.');
}

// Run and catch errors
run().catch((err) => {
  console.error('❌ Something went wrong:', err);
});
