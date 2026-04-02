import type { APIRoute } from 'astro';
import { db } from '../../../db';
import { users } from '../../../db/schema';
import { eq } from 'drizzle-orm';
import { verifyPassword, createSession } from '../../../utils';
import { loginSchema } from '../../../utils/validation';
import { ZodError } from 'zod';

export const POST: APIRoute = async (context) => {
  try {
    const data = await context.request.json();
    
    // Validate input
    const validatedData = loginSchema.parse(data);
    
    // Find user
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, validatedData.email))
      .limit(1);
    
    if (!user) {
      return new Response(JSON.stringify({ error: 'Invalid email or password' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    // Verify password
    const passwordValid = await verifyPassword(validatedData.password, user.passwordHash);
    
    if (!passwordValid) {
      return new Response(JSON.stringify({ error: 'Invalid email or password' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    // Create session
    const sessionId = await createSession(user.id);
    
    // Set session cookie
    context.cookies.set('sessionId', sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/',
    });
    
    return new Response(JSON.stringify({
      success: true,
      userId: user.id,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return new Response(JSON.stringify({ error: error.errors }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
