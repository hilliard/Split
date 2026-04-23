import { db } from './src/db/index';
import { humans } from './src/db/schema';
import { eq } from 'drizzle-orm';
import { hashPassword } from './src/utils/password';

async function resetHilliardPassword() {
  try {
    // Find user by email
    const users = await db.select().from(humans).where(eq(humans.email, 'hilliards@gmail.com'));

    if (!users || users.length === 0) {
      console.error('❌ User with email "hilliards@gmail.com" not found');
      process.exit(1);
    }

    const user = users[0];
    console.log('✓ Found user:', {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
    });

    // Set new password
    const newPassword = 'Hilliard@123';
    const hashedPassword = await hashPassword(newPassword);

    // Update password
    await db.update(humans).set({ passwordHash: hashedPassword }).where(eq(humans.id, user.id));

    console.log('\n✅ Password reset successfully!\n');
    console.log('Login credentials:');
    console.log('───────────────────────');
    console.log(`Email:    hilliards@gmail.com`);
    console.log(`Username: ${user.firstName}`);
    console.log(`Password: ${newPassword}`);
    console.log('───────────────────────\n');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

resetHilliardPassword();
