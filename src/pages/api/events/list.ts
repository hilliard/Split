import type { APIRoute } from "astro";
import { db } from "../../../db";
import { events, sessions, groupMembers, expenseGroups } from "../../../db/schema";
import { eq, and, desc, or, inArray } from "drizzle-orm";

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
    let allEvents = await db
      .select()
      .from(events)
      .where(
        or(
          eq(events.creatorId, userId),
          groupIds.length > 0 ? inArray(events.groupId, groupIds) : undefined
        )
      )
      .orderBy(desc(events.createdAt));

    // Convert budgetCents to display format
    const eventsWithBudget = allEvents.map((event) => ({
      ...event,
      budget: event.budgetCents ? (event.budgetCents / 100).toFixed(2) : "0.00",
    }));

    return new Response(JSON.stringify({ events: eventsWithBudget }), {
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
