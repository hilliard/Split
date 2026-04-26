import type { APIRoute } from 'astro';
import { getHumanByEmail } from '@/db/queries';
import { createPasswordResetToken } from '@/utils/passwordReset';
import { sendPasswordResetEmail } from '@/utils/email';

export const POST: APIRoute = async (context) => {
  try {
    const data = await context.request.json();
    const email = data.email;

    if (!email || typeof email !== 'string') {
      return new Response(JSON.stringify({ error: 'Valid email is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Check if email exists
    const user = await getHumanByEmail(email);

    // Always return a success response even if email doesn't exist to prevent email enumeration
    if (!user || !user.customer) {
      return new Response(
        JSON.stringify({ message: 'If that email exists, we sent a password reset link to it.' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Generate reset token
    const token = await createPasswordResetToken(user.customer.id, email, 1); // 1 hour expiration

    // Generate reset URL
    const resetUrl = `${process.env.PUBLIC_URL || 'http://localhost:4321'}/auth/reset-password?token=${token}`;

    // Send email
    await sendPasswordResetEmail({
      recipientEmail: email,
      firstName: user.human.firstName || undefined,
      resetUrl,
    });

    return new Response(
      JSON.stringify({ message: 'If that email exists, we sent a password reset link to it.' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in forgot-password:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
