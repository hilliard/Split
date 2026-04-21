import type { APIRoute } from 'astro';
import { db } from '../../../db';
import { customers } from '../../../db/human-centric-schema';
import { eq } from 'drizzle-orm';
import { getHumanByUsername } from '../../../db/queries';
import { verifyPassword, createSession } from '../../../utils';
import { loginSchema } from '../../../utils/validation';
import { ZodError } from 'zod';

export const POST: APIRoute = async (context) => {
  try {
    const data = await context.request.json();
    
    console.log('📨 Raw data received:', data);
    console.log('📨 Data keys:', Object.keys(data));
    console.log('📨 Data types:', Object.entries(data).map(([k, v]) => `${k}: ${typeof v}`));
    
    // Validate input
    const validatedData = loginSchema.parse(data);
    
    console.log('🔍 Attempting login for username:', validatedData.username);
    
    // Get human by username
    const result = await getHumanByUsername(validatedData.username);
    
    if (!result) {
      console.log('❌ FAILED: User not found in database:', validatedData.username);
      return new Response(JSON.stringify({ error: 'Invalid username or password' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    console.log('✓ Found user in database');
    console.log('  Human:', { id: result.human?.id, name: result.human?.firstName });
    console.log('  Customer username:', result.customer?.username);
    
    const human = result.human;
    
    // Verify customer exists
    if (!result.customer) {
      console.log('❌ FAILED: Customer object is null/undefined');
      return new Response(JSON.stringify({ error: 'Invalid username or password' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    const customer = result.customer;
    console.log('🔐 Customer password hash exists:', !!customer.passwordHash);
    
    // Verify password
    const passwordValid = await verifyPassword(validatedData.password, customer.passwordHash);
    console.log('🔐 Password verification result:', passwordValid);
    
    if (!passwordValid) {
      console.log('❌ FAILED: Password mismatch for user:', validatedData.username);
      return new Response(JSON.stringify({ error: 'Invalid username or password' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    console.log('✅ Authentication successful for:', validatedData.username);
    
    // Create session with human ID
    const sessionId = await createSession(human.id);
    
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
      humanId: human.id,
      username: customer.username,
      schema: 'human-centric',
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return new Response(JSON.stringify({ error: error.flatten() }), {
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
