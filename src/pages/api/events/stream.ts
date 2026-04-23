import type { APIRoute } from 'astro';
import { db } from '@/db';
import { sessions } from '@/db/schema';
import { eq } from 'drizzle-orm';

// Store connected clients: Map<subscriptionId, Set<controller>>
// subscriptionId can be eventId, groupId, etc.
const clientRegistry = new Map<string, Set<ReadableStreamDefaultController>>();

export const GET: APIRoute = async (context) => {
  try {
    const sessionId = context.cookies.get('sessionId')?.value;
    if (!sessionId) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Validate session
    const [session] = await db.select().from(sessions).where(eq(sessions.id, sessionId)).limit(1);

    if (!session || new Date(session.expiresAt) < new Date()) {
      return new Response(JSON.stringify({ error: 'Session expired' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get subscription ID (eventId or groupId)
    const eventId = context.url.searchParams.get('eventId');
    const groupId = context.url.searchParams.get('groupId');
    const subscriptionId = eventId || groupId;

    if (!subscriptionId) {
      return new Response(JSON.stringify({ error: 'eventId or groupId required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Create SSE response
    const encoder = new TextEncoder();
    let isClosed = false;

    const readable = new ReadableStream({
      start(controller) {
        // Register client
        if (!clientRegistry.has(subscriptionId)) {
          clientRegistry.set(subscriptionId, new Set());
        }
        clientRegistry.get(subscriptionId)!.add(controller);

        // Send initial connection message
        controller.enqueue(encoder.encode('data: {"type":"connected"}\n\n'));

        // Cleanup on disconnect
        const checkInterval = setInterval(() => {
          if (isClosed) {
            clientRegistry.get(subscriptionId)?.delete(controller);
            if (clientRegistry.get(subscriptionId)?.size === 0) {
              clientRegistry.delete(subscriptionId);
            }
            clearInterval(checkInterval);
          }
        }, 30000);
      },
      cancel() {
        isClosed = true;
      },
    });

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    console.error('SSE Error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

// Export helper to broadcast events
export function broadcastUpdate(subscriptionId: string, event: any) {
  const clients = clientRegistry.get(subscriptionId);
  if (!clients || clients.size === 0) return;

  const encoder = new TextEncoder();
  const message = `data: ${JSON.stringify(event)}\n\n`;

  for (const controller of clients) {
    try {
      controller.enqueue(encoder.encode(message));
    } catch (error) {
      clients.delete(controller);
    }
  }
}
