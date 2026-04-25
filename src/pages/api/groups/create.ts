import type { APIRoute } from 'astro';
import { db } from '../../../db';
import { expenseGroups, groupMembers, sessions } from '../../../db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const createGroupSchema = z.object({
  name: z.string().min(1, 'Group name is required').max(255),
});

export const POST: APIRoute = async (context) => {
  try {
    // Get session
    const sessionId = context.cookies.get('sessionId')?.value;
    if (!sessionId) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const [session] = await db.select().from(sessions).where(eq(sessions.id, sessionId)).limit(1);

    if (!session || new Date(session.expiresAt) < new Date()) {
      return new Response(JSON.stringify({ error: 'Session expired' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Parse and validate
    const data = await context.request.json();
    const validatedData = createGroupSchema.parse(data);

    // Create group
    console.log('Creating group with:', { name: validatedData.name, createdBy: session.userId });
    const [newGroup] = await db
      .insert(expenseGroups)
      .values({
        name: validatedData.name,
        createdBy: session.userId,
      })
      .returning();

    console.log('✓ Group created:', newGroup.id);

    // Add creator as member
    await db.insert(groupMembers).values({
      groupId: newGroup.id,
      userId: session.userId,
      joinedAt: new Date(),
    });

    return new Response(
      JSON.stringify({
        success: true,
        group: newGroup,
      }),
      {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error creating group:', error);

    if (error instanceof z.ZodError) {
      const details = error.flatten();
      return new Response(JSON.stringify({ error: 'Validation failed', details }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const errorMessage = error instanceof Error ? error.message : JSON.stringify(error);
    const errorCode = error instanceof Error && 'code' in error ? (error as any).code : null;

    console.error('Full error object:', {
      message: errorMessage,
      code: errorCode,
      name: error instanceof Error ? error.name : 'Unknown',
    });

    return new Response(
      JSON.stringify({
        error: 'Failed to create group',
        details: errorMessage,
        code: errorCode,
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
