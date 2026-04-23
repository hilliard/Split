/**
 * Authentication & Authorization Middleware
 *
 * Utilities for protecting API endpoints based on user roles
 */

import type { AstroCookies } from 'astro';
import { db } from '../db/index.ts';
import { sessions } from '../db/schema.ts';
import { eq } from 'drizzle-orm';
import { isAdmin, canUserEditGroup, canUserViewGroup } from './roles.ts';

export interface AuthContext {
  userId: string;
  authenticated: boolean;
  isAdmin: boolean;
}

/**
 * Extract and validate user session from cookies
 */
export async function getAuthContext(cookies: AstroCookies): Promise<AuthContext | null> {
  try {
    const sessionId = cookies.get('session_id')?.value;
    if (!sessionId) {
      return null;
    }

    const session = await db.query.sessions.findFirst({
      where: eq(sessions.id, sessionId),
    });

    if (!session || new Date(session.expiresAt) < new Date()) {
      return null;
    }

    const userIsAdmin = await isAdmin(session.userId);

    return {
      userId: session.userId,
      authenticated: true,
      isAdmin: userIsAdmin,
    };
  } catch (error) {
    console.error('Error getting auth context:', error);
    return null;
  }
}

/**
 * Response helpers
 */

export function unauthorizedResponse(message = 'Unauthorized') {
  return new Response(JSON.stringify({ error: message }), {
    status: 401,
    headers: { 'Content-Type': 'application/json' },
  });
}

export function forbiddenResponse(message = 'Forbidden') {
  return new Response(JSON.stringify({ error: message }), {
    status: 403,
    headers: { 'Content-Type': 'application/json' },
  });
}

export function badRequestResponse(message: string) {
  return new Response(JSON.stringify({ error: message }), {
    status: 400,
    headers: { 'Content-Type': 'application/json' },
  });
}

export function errorResponse(message: string, status = 500) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export function successResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

/**
 * Permission checking utilities
 */

export async function requireAuth(cookies: AstroCookies) {
  const auth = await getAuthContext(cookies);
  if (!auth) {
    throw new Error('UNAUTHORIZED');
  }
  return auth;
}

export async function requireAdmin(cookies: AstroCookies) {
  const auth = await getAuthContext(cookies);
  if (!auth || !auth.isAdmin) {
    throw new Error('FORBIDDEN_ADMIN_ONLY');
  }
  return auth;
}

export async function requireGroupEdit(cookies: AstroCookies, groupId: string) {
  const auth = await getAuthContext(cookies);
  if (!auth) {
    throw new Error('UNAUTHORIZED');
  }

  const canEdit = await canUserEditGroup(groupId, auth.userId);
  if (!canEdit) {
    throw new Error('FORBIDDEN_GROUP_EDIT');
  }

  return auth;
}

export async function requireGroupView(cookies: AstroCookies, groupId: string) {
  const auth = await getAuthContext(cookies);
  if (!auth) {
    throw new Error('UNAUTHORIZED');
  }

  const canView = await canUserViewGroup(groupId, auth.userId);
  if (!canView) {
    throw new Error('FORBIDDEN_GROUP_VIEW');
  }

  return auth;
}

/**
 * Error handling wrapper for API routes
 *
 * Usage:
 * export const POST: APIRoute = withAuth(async (req, context, auth) => {
 *   // Your handler code here
 * });
 */

export function withAuth(
  handler: (req: Request, context: any, auth: AuthContext) => Promise<Response>
) {
  return async (context: any) => {
    try {
      const auth = await getAuthContext(context.cookies);
      if (!auth) {
        return unauthorizedResponse();
      }

      return await handler(context.request, context, auth);
    } catch (error) {
      if (error instanceof Error && error.message === 'UNAUTHORIZED') {
        return unauthorizedResponse();
      }
      if (error instanceof Error && error.message === 'FORBIDDEN_ADMIN_ONLY') {
        return forbiddenResponse('Admin access required');
      }
      if (error instanceof Error && error.message === 'FORBIDDEN_GROUP_EDIT') {
        return forbiddenResponse('You do not have permission to edit this group');
      }
      if (error instanceof Error && error.message === 'FORBIDDEN_GROUP_VIEW') {
        return forbiddenResponse('You do not have permission to view this group');
      }

      console.error('API error:', error);
      return errorResponse(error instanceof Error ? error.message : 'Internal server error');
    }
  };
}

export function withAdminAuth(
  handler: (req: Request, context: any, auth: AuthContext) => Promise<Response>
) {
  return async (context: any) => {
    try {
      const auth = await getAuthContext(context.cookies);
      if (!auth) {
        return unauthorizedResponse();
      }

      if (!auth.isAdmin) {
        return forbiddenResponse('Admin access required');
      }

      return await handler(context.request, context, auth);
    } catch (error) {
      console.error('API error:', error);
      return errorResponse(error instanceof Error ? error.message : 'Internal server error');
    }
  };
}
