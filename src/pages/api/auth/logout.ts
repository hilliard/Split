import type { APIRoute } from 'astro';
import { deleteSession } from '../../../utils/session';

export const POST: APIRoute = async (context) => {
  try {
    const sessionId = context.cookies.get('sessionId')?.value;

    if (sessionId) {
      await deleteSession(sessionId);
      context.cookies.delete('sessionId', { path: '/' });
    }

    return context.redirect('/');
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
