import type { APIRoute } from 'astro';
import { db } from '../../../db';
import { sessions } from '../../../db/schema';
import { humans } from '../../../db/human-centric-schema';
import { eq, ilike, or } from 'drizzle-orm';

export const GET: APIRoute = async ({ cookies, url }) => {
  try {
    // Get session
    const sessionId = cookies.get('sessionId')?.value;
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

    // Get search query
    const query = url.searchParams.get('q') || '';

    if (!query || query.length < 2) {
      return new Response(JSON.stringify({ users: [] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Search for users
    const users = await db
      .select({
        id: humans.id,
        firstName: humans.firstName,
        lastName: humans.lastName,
        phone: humans.phone,
      })
      .from(humans)
      .where(
        or(
          ilike(humans.firstName, `%${query}%`),
          ilike(humans.lastName, `%${query}%`),
          ilike(humans.phone, `%${query}%`),
        )
      )
      .limit(10);

    return new Response(JSON.stringify({ users }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error searching users:', error);
    return new Response(JSON.stringify({ error: 'Failed to search users' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
