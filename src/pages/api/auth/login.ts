import type { APIRoute } from 'astro';
import { db } from '../../../db';
import { users } from '../../../db/schema';
import { emailHistory, customers } from '../../../db/human-centric-schema';
import { eq } from 'drizzle-orm';
import { verifyPassword, createSession } from '../../../utils';
import { loginSchema } from '../../../utils/validation';
import { ZodError } from 'zod';

export const POST: APIRoute = async (context) => {
  try {
    const data = await context.request.json();
    
    // Validate input
    const validatedData = loginSchema.parse(data);
    
    console.log('🔍 Attempting login for:', validatedData.email);
    
    // Always check legacy schema first (most compatible with sessions table)
    console.log('🔄 Checking legacy schema...');
    const [legacyUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, validatedData.email))
      .limit(1);
    
    if (legacyUser) {
      console.log('✓ Found user in legacy schema');
      
      // Verify password
      const passwordValid = await verifyPassword(validatedData.password, legacyUser.passwordHash);
      
      if (!passwordValid) {
        return new Response(JSON.stringify({ error: 'Invalid email or password' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      
      // Create session with legacy user ID
      const sessionId = await createSession(legacyUser.id);
      
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
        userId: legacyUser.id,
        schema: 'legacy',
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    // PHASE 2 FALLBACK: Check new schema if not found in legacy
    console.log('🔍 Looking up email in new schema...');
    const [emailRecord] = await db
      .select()
      .from(emailHistory)
      .where(eq(emailHistory.email, validatedData.email))
      .limit(1);
    
    if (emailRecord) {
      console.log('✓ Found email in new schema');
      
      // Get customer for password verification
      const [customerRecord] = await db
        .select()
        .from(customers)
        .where(eq(customers.humanId, emailRecord.humanId))
        .limit(1);
      
      if (customerRecord) {
        // Verify password
        const passwordValid = await verifyPassword(validatedData.password, customerRecord.passwordHash);
        
        if (!passwordValid) {
          return new Response(JSON.stringify({ error: 'Invalid email or password' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' },
          });
        }
        
        // Note: New schema-only users won't have a session created (sessions table references users table)
        // This is expected - phase 2 transition is in progress
        return new Response(JSON.stringify({
          error: 'User account migration in progress. Please re-register.',
          code: 'MIGRATION_PENDING',
        }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }
    
    // User not found in either schema
    return new Response(JSON.stringify({ error: 'Invalid email or password' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return new Response(JSON.stringify({ error: error.errors }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    console.error('Login error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
