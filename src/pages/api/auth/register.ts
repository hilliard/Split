import type { APIRoute } from 'astro';
import { db } from '../../../db';
import { users } from '../../../db/schema';
import { humans, emailHistory, customers, humanSiteRoles, siteRoles } from '../../../db/human-centric-schema';
import { eq } from 'drizzle-orm';
import { hashPassword, createSession } from '../../../utils';
import { registerSchema } from '../../../utils/validation';
import { ZodError } from 'zod';

export const POST: APIRoute = async (context) => {
  try {
    console.log('📝 Register endpoint called');
    const data = await context.request.json();
    console.log('📦 Request data:', { username: data.username, email: data.email });
    
    // Validate input
    const validatedData = registerSchema.parse(data);
    console.log('✓ Validation passed');
    
    // Check if customer already exists (by username)
    console.log('🔍 Checking for existing customer...');
    const existingCustomer = await db
      .select()
      .from(customers)
      .where(eq(customers.username, validatedData.username))
      .limit(1);
    console.log('✓ Existing customer check completed:', existingCustomer.length);
    
    if (existingCustomer.length > 0) {
      return new Response(JSON.stringify({ error: 'Username already registered' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    // Check if email is already used in email_history
    console.log('🔍 Checking for existing email...');
    const existingEmail = await db
      .select()
      .from(emailHistory)
      .where(eq(emailHistory.email, validatedData.email))
      .limit(1);
    console.log('✓ Existing email check completed:', existingEmail.length);
    
    if (existingEmail.length > 0) {
      return new Response(JSON.stringify({ error: 'Email already registered' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    // Hash password
    console.log('🔐 Hashing password...');
    const passwordHash = await hashPassword(validatedData.password);
    console.log('✓ Password hashed');
    
    // PHASE 2: Create human in new schema
    console.log('👤 Creating human in new schema...');
    const [newHuman] = await db
      .insert(humans)
      .values({
        firstName: validatedData.username.split('.')[0] || validatedData.username,
        lastName: validatedData.username.split('.')[1] || '',
      })
      .returning({ id: humans.id });
    console.log('✓ Human created:', newHuman.id);
    
    // Create email history entry
    console.log('📧 Creating email history entry...');
    const [newEmailEntry] = await db
      .insert(emailHistory)
      .values({
        humanId: newHuman.id,
        email: validatedData.email,
      })
      .returning({ id: emailHistory.id });
    console.log('✓ Email history created:', newEmailEntry.id);
    
    // Create customer (authentication role)
    console.log('👤 Creating customer...');
    const [newCustomer] = await db
      .insert(customers)
      .values({
        humanId: newHuman.id,
        username: validatedData.username,
        passwordHash,
      })
      .returning({ id: customers.id });
    console.log('✓ Customer created:', newCustomer.id);
    
    // Get the "customer" role
    console.log('🔑 Finding customer role...');
    try {
      const [customerRole] = await db
        .select()
        .from(siteRoles)
        .where(eq(siteRoles.roleName, 'customer'))
        .limit(1);
      
      if (customerRole) {
        console.log('📌 Assigning customer role...');
        await db
          .insert(humanSiteRoles)
          .values({
            humanId: newHuman.id,
            siteRoleId: customerRole.id,
          });
        console.log('✓ Customer role assigned');
      } else {
        console.warn('⚠ Customer role not found in database');
      }
    } catch (roleError) {
      console.warn('⚠ Could not assign customer role:', roleError instanceof Error ? roleError.message : 'Unknown error');
      // Continue - role assignment is non-critical for registration
    }
    
    // BACKWARD COMPATIBILITY: Also create in old schema
    console.log('🔄 Creating user in legacy schema for backward compatibility...');
    const [newUserLegacy] = await db
      .insert(users)
      .values({
        email: validatedData.email,
        username: validatedData.username,
        passwordHash,
      })
      .returning({ id: users.id });
    console.log('✓ Legacy user created:', newUserLegacy.id);
    
    // Create session using legacy user ID (sessions table references users table)
    console.log('🔑 Creating session...');
    const sessionId = await createSession(newUserLegacy.id);
    console.log('✓ Session created');
    
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
      userId: newHuman.id,
      legacyUserId: newUserLegacy.id,
      message: 'Registered with new human-centric schema (legacy support active)',
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    if (error instanceof ZodError) {
      console.error('❌ Validation error:', error.errors);
      return new Response(JSON.stringify({ error: error.errors }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    console.error('❌ Register error:', error instanceof Error ? error.message : String(error));
    console.error('Stack:', error instanceof Error ? error.stack : 'N/A');
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
