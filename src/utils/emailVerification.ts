import { randomBytes } from 'crypto';
import { db } from '@/db/index';
import { emailVerificationTokens, customers } from '@/db/human-centric-schema';
import { eq, and, gt } from 'drizzle-orm';

/**
 * Generate a secure random token for email verification
 */
export function generateVerificationToken(): string {
  return randomBytes(32).toString('hex');
}

/**
 * Create a new verification token for a customer
 */
export async function createVerificationToken(
  customerId: string,
  email: string,
  expirationHours: number = 24
): Promise<string> {
  const token = generateVerificationToken();
  const expiresAt = new Date(Date.now() + expirationHours * 60 * 60 * 1000);

  await db.insert(emailVerificationTokens).values({
    customerId,
    email,
    token,
    expiresAt,
  });

  return token;
}

/**
 * Validate and consume a verification token
 */
export async function validateVerificationToken(
  email: string,
  token: string
): Promise<{ valid: boolean; customerId?: string; error?: string }> {
  try {
    console.log(`🔐 validateVerificationToken: email=${email}, token=${token.substring(0, 16)}...`);

    const record = await db
      .select()
      .from(emailVerificationTokens)
      .where(
        and(eq(emailVerificationTokens.email, email), eq(emailVerificationTokens.token, token))
      )
      .limit(1);

    console.log(`   Found records: ${record.length}`);

    if (record.length === 0) {
      console.log('   ❌ No matching token found');
      return { valid: false, error: 'Token not found' };
    }

    const tokenRecord = record[0];
    console.log(`   Token record found`);
    console.log(`     Email: ${tokenRecord.email}`);
    console.log(`     VerifiedAt: ${tokenRecord.verifiedAt}`);
    console.log(`     ExpiresAt: ${tokenRecord.expiresAt}`);

    // Check if already verified
    if (tokenRecord.verifiedAt !== null && tokenRecord.verifiedAt !== undefined) {
      console.log('   ❌ Token already verified');
      return { valid: false, error: 'Token already verified' };
    }

    // Check if expired
    if (new Date(tokenRecord.expiresAt) < new Date()) {
      console.log('   ❌ Token expired');
      return { valid: false, error: 'Token expired' };
    }

    console.log(`   ✅ Token valid, customerId: ${tokenRecord.customerId}`);
    return { valid: true, customerId: tokenRecord.customerId };
  } catch (error) {
    console.error('Error validating token:', error);
    return { valid: false, error: 'Validation error' };
  }
}

/**
 * Mark token as verified and update customer
 */
export async function markTokenAsVerified(
  customerId: string,
  email: string,
  token: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Update token as verified
    await db
      .update(emailVerificationTokens)
      .set({ verifiedAt: new Date() })
      .where(
        and(
          eq(emailVerificationTokens.customerId, customerId),
          eq(emailVerificationTokens.email, email),
          eq(emailVerificationTokens.token, token)
        )
      );

    // Update customer as verified
    await db
      .update(customers)
      .set({ emailVerified: true, updatedAt: new Date() })
      .where(eq(customers.id, customerId));

    return { success: true };
  } catch (error) {
    console.error('Error marking token as verified:', error);
    return { success: false, error: 'Failed to verify email' };
  }
}

/**
 * Clean up expired tokens (should be called periodically)
 */
export async function cleanupExpiredTokens(): Promise<number> {
  try {
    const result = await db
      .delete(emailVerificationTokens)
      .where(gt(emailVerificationTokens.expiresAt, new Date()));

    return result.rowCount || 0;
  } catch (error) {
    console.error('Error cleaning up expired tokens:', error);
    return 0;
  }
}

/**
 * Resend verification email - delete old token and create new one
 */
export async function resendVerificationToken(customerId: string, email: string): Promise<string> {
  // Delete any existing unverified tokens
  await db
    .delete(emailVerificationTokens)
    .where(
      and(
        eq(emailVerificationTokens.customerId, customerId),
        eq(emailVerificationTokens.email, email)
      )
    );

  // Create new token
  return createVerificationToken(customerId, email);
}
