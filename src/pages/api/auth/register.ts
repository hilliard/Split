import type { APIRoute } from 'astro';
import { hashPassword } from '../../../utils';
import { registerSchema } from '../../../utils/validation';
import {
  getCustomerByUsername,
  getHumanByEmail,
  createHumanWithCustomer,
} from '../../../db/queries';
import { db } from '../../../db';
import { pendingGroupInvitations, groupMembers } from '../../../db/schema';
import { eq, and } from 'drizzle-orm';
import { ZodError } from 'zod';
import { createVerificationToken } from '../../../utils/emailVerification';
import { sendVerificationEmail } from '../../../utils/email';

export const POST: APIRoute = async (context) => {
  try {
    const data = await context.request.json();

    // Validate input
    const validatedData = registerSchema.parse(data);

    // Check if username already exists
    const existingUsername = await getCustomerByUsername(validatedData.username);
    if (existingUsername) {
      return new Response(JSON.stringify({ error: 'Username already registered' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Check if email is already used
    const existingEmail = await getHumanByEmail(validatedData.email);
    if (existingEmail) {
      return new Response(JSON.stringify({ error: 'Email already registered' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Hash password
    const passwordHash = await hashPassword(validatedData.password);

    // Create human + customer + email_history + role assignment (atomic)
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

    // Create verification token
    const token = await createVerificationToken(result.customerId, validatedData.email, 24);

    // Send verification email
    const verificationUrl = `${process.env.PUBLIC_URL || 'http://localhost:4321'}/auth/verify-email?token=${token}&email=${encodeURIComponent(validatedData.email)}`;
    const emailResult = await sendVerificationEmail({
      recipientEmail: validatedData.email,
      firstName: validatedData.username.split('.')[0] || validatedData.username,
      verificationUrl,
    });

    if (!emailResult.success) {
      // Don't fail registration, just warn
    }

    // Check for pending group invitations and auto-add user
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
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        humanId: result.humanId,
        customerId: result.customerId,
        email: validatedData.email,
        message: 'Registration successful! Check your email to verify your account.',
      }),
      {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      }
    );
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
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Internal server error' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
