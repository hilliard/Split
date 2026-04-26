import { randomBytes } from 'crypto';
import { db } from '@/db';
import { passwordResetTokens, customers } from '@/db/schema';
import { eq, and, isNull } from 'drizzle-orm';

export function generateResetToken(): string {
  return randomBytes(32).toString('hex');
}

export async function createPasswordResetToken(
  customerId: string,
  email: string,
  expirationHours: number = 1
): Promise<string> {
  // Invalidate previous un-used tokens for this user
  await db
    .update(passwordResetTokens)
    .set({ usedAt: new Date() })
    .where(
      and(
        eq(passwordResetTokens.customerId, customerId),
        isNull(passwordResetTokens.usedAt)
      )
    );

  const token = generateResetToken();
  const expiresAt = new Date(Date.now() + expirationHours * 60 * 60 * 1000);

  await db.insert(passwordResetTokens).values({
    customerId,
    email,
    token,
    expiresAt,
  });

  return token;
}

export async function validatePasswordResetToken(
  token: string
): Promise<{ valid: boolean; customerId?: string; email?: string; error?: string }> {
  try {
    const record = await db
      .select()
      .from(passwordResetTokens)
      .where(eq(passwordResetTokens.token, token))
      .limit(1);

    if (record.length === 0) {
      return { valid: false, error: 'Token not found' };
    }

    const tokenRecord = record[0];

    // Check if already used
    if (tokenRecord.usedAt !== null) {
      return { valid: false, error: 'Token has already been used' };
    }

    // Check if expired
    if (new Date(tokenRecord.expiresAt) < new Date()) {
      return { valid: false, error: 'Token has expired' };
    }

    return { valid: true, customerId: tokenRecord.customerId, email: tokenRecord.email };
  } catch (error) {
    console.error('Error validating token:', error);
    return { valid: false, error: 'Validation error' };
  }
}

export async function consumePasswordResetToken(token: string): Promise<boolean> {
  try {
    await db
      .update(passwordResetTokens)
      .set({ usedAt: new Date() })
      .where(eq(passwordResetTokens.token, token));
    return true;
  } catch (error) {
    console.error('Error consuming token:', error);
    return false;
  }
}
