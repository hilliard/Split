import type { APIRoute } from 'astro';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY!);

export const GET: APIRoute = async () => {
  // send an email using the Resend SDK

  const { data, error } = await resend.emails.send({
    subject: 'Hello from Resend!',
    from: ' hilliards@gmail.com',
    to: 'delivered@resend.dev',
    html: '<p>This is a test email sent using the Resend SDK.</p>',
  });
  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  return new Response(JSON.stringify({ success: true, data }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
