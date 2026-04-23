import type { APIRoute } from 'astro';
import { validateVerificationToken, markTokenAsVerified } from '@/utils/emailVerification';
import { db } from '@/db/index';
import { customers } from '@/db/human-centric-schema';
import { eq } from 'drizzle-orm';

export const GET: APIRoute = async ({ url, cookies }) => {
  try {
    const token = url.searchParams.get('token');
    const email = url.searchParams.get('email');

    if (!token || !email) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Missing token or email parameter',
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validate token
    const validation = await validateVerificationToken(email, token);

    if (!validation.valid) {
      return new Response(
        JSON.stringify({
          success: false,
          error: validation.error || 'Invalid or expired token',
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const customerId = validation.customerId;
    if (!customerId) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Unable to verify email',
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Mark token as verified and update customer
    const result = await markTokenAsVerified(customerId, email, token);
    if (!result.success) {
      return new Response(
        JSON.stringify({
          success: false,
          error: result.error || 'Failed to verify email',
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Create session for the customer
    const crypto = await import('crypto');
    const sessionId = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    // Get the human ID from customer
    const customer = await db.select().from(customers).where(eq(customers.id, customerId)).limit(1);

    if (customer.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Customer not found',
        }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const humanId = customer[0].humanId;

    // Insert session
    await db.insert((await import('@/db/schema')).sessions).values({
      id: sessionId,
      userId: humanId,
      expiresAt,
    });

    // Set session cookie
    cookies.set('sessionId', sessionId, {
      httpOnly: true,
      path: '/',
      maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
      sameSite: 'lax',
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Email verified successfully',
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in verify-email endpoint:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
