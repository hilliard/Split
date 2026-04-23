import type { APIRoute } from 'astro';
import { getSession } from '../../../utils/session';
import { db } from '../../../db';
import { humans, customers } from '../../../db/human-centric-schema';
import { eq } from 'drizzle-orm';

export const GET: APIRoute = async (context) => {
  try {
    const sessionId = context.cookies.get('sessionId')?.value;

    if (!sessionId) {
      return new Response(JSON.stringify({ error: 'Not authenticated' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const session = await getSession(sessionId);

    if (!session) {
      context.cookies.delete('sessionId', { path: '/' });
      return new Response(JSON.stringify({ error: 'Session expired' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get human data
    const [human] = await db
      .select({
        id: humans.id,
        firstName: humans.firstName,
        lastName: humans.lastName,
        phone: humans.phone,
      })
      .from(humans)
      .where(eq(humans.id, session.userId))
      .limit(1);

    if (!human) {
      return new Response(JSON.stringify({ error: 'User not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get customer username
    const [customer] = await db
      .select({ username: customers.username })
      .from(customers)
      .where(eq(customers.humanId, human.id))
      .limit(1);

    return new Response(
      JSON.stringify({
        id: human.id,
        firstName: human.firstName,
        lastName: human.lastName,
        phone: human.phone,
        username: customer?.username,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Me endpoint error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
