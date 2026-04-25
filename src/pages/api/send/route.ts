import type { APIRoute } from 'astro';

export const POST: APIRoute = async (context) => {
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
