import type { APIRoute } from 'astro';
import { hashPassword, createSession } from '../../../utils';
import { registerSchema } from '../../../utils/validation';
import { getCustomerByUsername, getHumanByEmail, createHumanWithCustomer } from '../../../db/queries';
import { db } from '../../../db';
import { pendingGroupInvitations, groupMembers } from '../../../db/schema';
import { eq, and } from 'drizzle-orm';
import { ZodError } from 'zod';

export const POST: APIRoute = async (context) => {
  try {
    console.log('📝 Register endpoint called');
    const data = await context.request.json();
    console.log('📦 Request data:', { username: data.username, email: data.email });
    
    // Validate input
    const validatedData = registerSchema.parse(data);
    console.log('✓ Validation passed');
    
    // Check if username already exists
    console.log('🔍 Checking for existing username...');
    const existingUsername = await getCustomerByUsername(validatedData.username);
    if (existingUsername) {
      return new Response(JSON.stringify({ error: 'Username already registered' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    // Check if email is already used
    console.log('🔍 Checking for existing email...');
    const existingEmail = await getHumanByEmail(validatedData.email);
    if (existingEmail) {
      return new Response(JSON.stringify({ error: 'Email already registered' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    // Hash password
    console.log('🔐 Hashing password...');
    const passwordHash = await hashPassword(validatedData.password);
    console.log('✓ Password hashed');
    
    // Create human + customer + email_history + role assignment (atomic)
    console.log('👤 Creating human with customer role...');
    const result = await createHumanWithCustomer(
      validatedData.email,
      validatedData.username,
      passwordHash,
      validatedData.username.split('.')[0] || validatedData.username,
      validatedData.username.split('.')[1] || ''
    );
    
    if (!result) {
      throw new Error('Failed to create human with customer');
    }
    
    console.log('✓ Human created:', result.humanId);
    console.log('✓ Customer created:', result.customerId);
    console.log('✓ Email history created');
    console.log('✓ Customer role assigned');
    
    // Check for pending group invitations and auto-add user
    console.log('👥 Checking for pending group invitations...');
    const pendingInvites = await db
      .select()
      .from(pendingGroupInvitations)
      .where(
        and(
          eq(pendingGroupInvitations.email, validatedData.email),
          eq(pendingGroupInvitations.status, 'pending')
        )
      );
    
    if (pendingInvites.length > 0) {
      console.log(`✓ Found ${pendingInvites.length} pending invitation(s)`);
      
      // Add user to each group and mark invitation as accepted
      for (const invite of pendingInvites) {
        await db.insert(groupMembers).values({
          groupId: invite.groupId,
          userId: result.humanId,
          joinedAt: new Date(),
        });
        
        await db
          .update(pendingGroupInvitations)
          .set({
            status: 'accepted',
            acceptedAt: new Date(),
          })
          .where(eq(pendingGroupInvitations.id, invite.id));
        
        console.log(`✓ Added to group: ${invite.groupId}`);
      }
    }
    
    // Create session using human ID
    console.log('🔑 Creating session...');
    const sessionId = await createSession(result.humanId);
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
      humanId: result.humanId,
      customerId: result.customerId,
      message: 'Registered successfully',
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    if (error instanceof ZodError) {
      console.error('❌ Validation error:', error.flatten());
      return new Response(JSON.stringify({ error: error.flatten() }), {
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
