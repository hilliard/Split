import type { APIRoute } from 'astro';
import { db } from '@/db';
import { humans } from '@/db/schema';
import { emailHistory } from '@/db/human-centric-schema';
import { getSession } from '@/utils/session';
import { isSystemAdmin } from '@/db/authorization';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const UpdateInfoSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().optional(),
  email: z.string().email().optional(),
});

/**
 * PUT /api/users/[id]/info
 * Update a user's basic info (name, email)
 * Admin only
 */
export const PUT: APIRoute = async (context) => {
  try {
    const sessionId = context.cookies.get('sessionId')?.value;
    const session = sessionId ? await getSession(sessionId) : null;

    if (!session || !session.userId) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    // Check if user is admin
    const isAdmin = await isSystemAdmin(session.userId);
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });
    }

    const targetUserId = context.params.id;
    if (!targetUserId) {
      return new Response(JSON.stringify({ error: 'User ID is required' }), { status: 400 });
    }

    // Parse request body
    const body = await context.request.json();
    const parseResult = UpdateInfoSchema.safeParse(body);

    if (!parseResult.success) {
      return new Response(
        JSON.stringify({ error: 'Invalid request body', details: parseResult.error.issues }),
        { status: 400 }
      );
    }

    const { firstName, lastName, email } = parseResult.data;

    // Verify target user exists
    const [targetUser] = await db.select().from(humans).where(eq(humans.id, targetUserId));

    if (!targetUser) {
      return new Response(JSON.stringify({ error: 'User not found' }), { status: 404 });
    }

    // Update first name and last name if provided
    if (firstName !== undefined || lastName !== undefined) {
      await db
        .update(humans)
        .set({
          firstName: firstName !== undefined ? firstName : targetUser.firstName,
          lastName: lastName !== undefined ? lastName : targetUser.lastName,
          updatedAt: new Date(),
        })
        .where(eq(humans.id, targetUserId));
    }

    // Update email if provided
    if (email !== undefined && email !== targetUser.email) {
      // Get current email history entry
      const [currentEmailHistory] = await db
        .select()
        .from(emailHistory)
        .where(eq(emailHistory.humanId, targetUserId))
        .orderBy(emailHistory.effectiveFrom);

      if (currentEmailHistory) {
        // End current email entry
        await db
          .update(emailHistory)
          .set({
            effectiveTo: new Date(),
          })
          .where(eq(emailHistory.id, currentEmailHistory.id));
      }

      // Create new email history entry
      await db.insert(emailHistory).values({
        humanId: targetUserId,
        email: email,
        effectiveFrom: new Date(),
        verificationStatus: 'pending',
      });
    }

    return new Response(JSON.stringify({ message: 'User info updated successfully' }), {
      status: 200,
    });
  } catch (error) {
    console.error('Error updating user info:', error);
    return new Response(JSON.stringify({ error: 'Failed to update user info' }), { status: 500 });
  }
};
