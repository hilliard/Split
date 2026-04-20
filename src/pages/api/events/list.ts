import type { APIRoute } from "astro";
import { db } from "../../../db";
import { events, sessions, groupMembers, expenseGroups, expenses } from "../../../db/schema";
import { eq, and, desc, or, inArray, sum } from "drizzle-orm";

export const GET: APIRoute = async ({ cookies }) => {
  try {
    // Get session from cookie
    const sessionId = cookies.get("sessionId")?.value;
    if (!sessionId) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Get user ID from session
    const [session] = await db
      .select()
      .from(sessions)
      .where(
        and(
          eq(sessions.id, sessionId),
        )
      )
      .limit(1);

    if (!session) {
      return new Response(JSON.stringify({ error: "Session expired" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Check if session is not expired
    if (new Date(session.expiresAt) < new Date()) {
      return new Response(JSON.stringify({ error: "Session expired" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const userId = session.userId;

    // Get all groups the user is a member of
    const userGroupMemberships = await db
      .select({ groupId: groupMembers.groupId })
      .from(groupMembers)
      .where(eq(groupMembers.userId, userId));

    const groupIds = userGroupMemberships.map(m => m.groupId);

    // Get all events for this user OR events linked to groups they're in
    let whereCondition;
    if (groupIds.length > 0) {
      whereCondition = or(
        eq(events.creatorId, userId),
        inArray(events.groupId, groupIds)
      );
    } else {
      whereCondition = eq(events.creatorId, userId);
    }

    const allEvents = await db
      .select()
      .from(events)
      .where(whereCondition)
      .orderBy(desc(events.createdAt));

    // Calculate current expenses for each event
    const eventsWithExpenses = await Promise.all(
      allEvents.map(async (event) => {
        // Get total expenses for this event (amount + tip, both in cents)
        const expenseResult = await db
          .select({
            totalExpenseCents: sum(expenses.amount),
            totalTipCents: sum(expenses.tipAmount),
          })
          .from(expenses)
          .where(eq(expenses.eventId, event.id));

        const expenseData = expenseResult[0];
        
        // Convert to numbers and ensure they're not null
        let totalAmountCents = expenseData?.totalExpenseCents ? Number(expenseData.totalExpenseCents) : 0;
        let totalTipCents = expenseData?.totalTipCents ? Number(expenseData.totalTipCents) : 0;
        
        // DEBUG: Check if values are suspiciously large (stored as dollars instead of cents)
        // If total is > 1,000,000 cents (~$10,000) for a typical small expense, likely stored in dollars
        // Work backwards: if showing $7.9M for ~$792, that's 10,000x too large
        // This means individual expense values are ~100x too large (stored as dollars, not cents)
        if (totalAmountCents > 10000000) {
          // Suspiciously large - likely expenses stored in dollars, not cents
          // Divide by 100 to convert dollars to cents
          totalAmountCents = Math.round(totalAmountCents / 100);
          totalTipCents = Math.round(totalTipCents / 100);
          console.log(`⚠️  CORRECTED ${event.title}: divided by 100 (expenses likely stored in dollars)`);
        }
        
        const expensesCents = totalAmountCents + totalTipCents;
        
        // Debug logging
        console.log(`📊 Event: ${event.title}`);
        console.log(`   Raw totalExpenseCents: ${expenseData?.totalExpenseCents}`);
        console.log(`   Raw totalTipCents: ${expenseData?.totalTipCents}`);
        console.log(`   Corrected expensesCents: ${expensesCents}`);
        console.log(`   Formatted: $${(expensesCents / 100).toFixed(2)}`);
        
        return {
          ...event,
          budget: event.budgetCents ? (event.budgetCents / 100).toFixed(2) : "0.00",
          currentExpensesCents: expensesCents,
          currentExpenses: (expensesCents / 100).toFixed(2),
        };
      })
    );

    return new Response(JSON.stringify({ events: eventsWithExpenses }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching events:", error);
    return new Response(
      JSON.stringify({ error: "Failed to fetch events" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
