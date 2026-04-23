import type { APIRoute } from 'astro';
import { resendVerificationToken } from '@/utils/emailVerification';
import { sendVerificationEmail } from '@/utils/email';
import { db } from '@/db/index';
import { customers } from '@/db/schema';
import { eq } from 'drizzle-orm';

export const POST: APIRoute = async ({ request }) => {
  try {
    const data = await request.json();
    const { email, customerId } = data;

    if (!email || !customerId) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Email and customerId are required',
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Verify customer exists and email matches
    const customer = await db.select().from(customers).where(eq(customers.id, customerId)).limit(1);

    if (customer.length === 0 || customer[0].email !== email) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Customer not found or email mismatch',
        }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Check if already verified
    if (customer[0].emailVerified) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Email already verified',
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Resend verification token (deletes old ones and creates new)
    const token = await resendVerificationToken(customerId, email);

    // Send verification email
    const verificationUrl = `${process.env.PUBLIC_URL || 'http://localhost:4321'}/auth/verify-email?token=${token}&email=${encodeURIComponent(email)}`;
    const emailResult = await sendVerificationEmail({
      recipientEmail: email,
      firstName: customer[0].humanId?.split('-')[0] || 'User', // Extract first part of UUID as placeholder
      verificationUrl,
    });

    if (!emailResult.success) {
      return new Response(
        JSON.stringify({
          success: false,
          error: emailResult.error || 'Failed to send verification email',
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Verification email sent successfully',
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in resend-verification endpoint:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
