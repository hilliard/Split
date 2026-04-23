import { db } from './src/db/index';
import { humans, humanSystemRoles, systemRoles } from './src/db/schema';
import { eq } from 'drizzle-orm';

async function makeSonnyAdmin() {
  try {
    // Find sonny human
    const sonnyHumans = await db.select().from(humans).where(eq(humans.firstName, 'sonny'));

    if (!sonnyHumans || sonnyHumans.length === 0) {
      console.error('❌ Sonny not found');
      process.exit(1);
    }

    const sonny = sonnyHumans[0];
    console.log('✓ Found sonny:', sonny.id);

    // Find admin role
    const adminRoles = await db.select().from(systemRoles).where(eq(systemRoles.name, 'admin'));

    if (!adminRoles || adminRoles.length === 0) {
      console.error('❌ Admin role not found');
      process.exit(1);
    }

    const adminRole = adminRoles[0];
    console.log('✓ Found admin role:', adminRole.id);

    // Assign admin role to sonny
    await db.insert(humanSystemRoles).values({
      humanId: sonny.id,
      systemRoleId: adminRole.id,
    });

    console.log('\n✅ Sonny is now an ADMIN user!\n');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

makeSonnyAdmin();
