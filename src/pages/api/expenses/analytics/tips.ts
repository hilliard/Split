/**
 * API Route: GET /api/expenses/analytics/tips
 * 
 * Tip analytics for sponsor/business intelligence
 * Shows tipping trends, demographics, and category breakdowns
 * 
 * Query params:
 * - eventId: Event ID to analyze
 */

import type { APIRoute } from 'astro';
import { db } from '../../../../db';
import { sessions, events } from '../../../../db/schema';
import { eq } from 'drizzle-orm';
import { getTipStats, getTipDemographics, getTipsByCategory } from '../../../../utils/expenses.ts';

export const GET: APIRoute = async (context) => {
  try {
    // Get session (optional - could be made public with a token)
    const sessionId = context.cookies.get('sessionId')?.value;
    if (!sessionId) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const [session] = await db
      .select()
      .from(sessions)
      .where(eq(sessions.id, sessionId))
      .limit(1);

    if (!session || new Date(session.expiresAt) < new Date()) {
      return new Response(JSON.stringify({ error: 'Session expired' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get eventId from query params
    const eventId = context.url.searchParams.get('eventId');
    if (!eventId) {
      return new Response(JSON.stringify({ error: 'eventId is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Verify event exists
    const [event] = await db
      .select()
      .from(events)
      .where(eq(events.id, eventId))
      .limit(1);

    if (!event) {
      return new Response(JSON.stringify({ error: 'Event not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Only event creator can view analytics
    if (event.creatorId !== session.userId) {
      return new Response(JSON.stringify({ error: 'You do not have permission to view this analytics' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Calculate all tip analytics
    const tipStats = await getTipStats(eventId);
    const demographics = await getTipDemographics(eventId);
    const byCategory = await getTipsByCategory(eventId);

    return new Response(
      JSON.stringify({
        success: true,
        eventId,
        eventTitle: event.title,
        analytics: {
          overall: tipStats,
          byPerson: demographics,
          byCategory,
        },
        metadata: {
          analyzedAt: new Date().toISOString(),
          purpose: 'Sponsor business intelligence - tipping trends and demographics',
        },
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error fetching tip analytics:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch analytics' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
