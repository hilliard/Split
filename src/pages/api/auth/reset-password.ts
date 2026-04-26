import type { APIRoute } from 'astro';
import { validatePasswordResetToken, consumePasswordResetToken } from '@/utils/passwordReset';
import { updateCustomerPassword } from '@/db/queries';
import { hashPassword } from '@/utils';
import { z } from 'zod';

const ResetPasswordSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  password: z.string().min(8, 'Password must be at least 8 characters long'),
});

export const POST: APIRoute = async (context) => {
  try {
    const data = await context.request.json();
    
    // Validate request
    const validationResult = ResetPasswordSchema.safeParse(data);
    if (!validationResult.success) {
      return new Response(
        JSON.stringify({ error: validationResult.error.issues[0].message }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    const { token, password } = validationResult.data;

    // Validate token
    const tokenResult = await validatePasswordResetToken(token);
    if (!tokenResult.valid || !tokenResult.customerId) {
      return new Response(
        JSON.stringify({ error: tokenResult.error || 'Invalid token' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Hash the new password
    const hashedPassword = await hashPassword(password);

    // Update password in the database
    const updateSuccess = await updateCustomerPassword(tokenResult.customerId, hashedPassword);
    if (!updateSuccess) {
      return new Response(
        JSON.stringify({ error: 'Failed to update password' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Mark token as used
    await consumePasswordResetToken(token);

    return new Response(
      JSON.stringify({ success: true, message: 'Password has been successfully reset' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in reset-password:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
