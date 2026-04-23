import { db } from './src/db/index';
import { customers, humans, humanSystemRoles, systemRoles } from './src/db/schema';
import { eq } from 'drizzle-orm';

async function checkAdminUsers() {
  try {
    console.log('=== Checking system roles ===\n');

    const allRoles = await db.select().from(systemRoles);
    allRoles.forEach((role) => {
      console.log(`Role: ${role.name} (${role.id})`);
    });

    console.log('\n=== Checking user-role assignments ===\n');

    const userRoles = await db.select().from(humanSystemRoles);

    for (const ur of userRoles) {
      const human = await db.select().from(humans).where(eq(humans.id, ur.humanId));

      const role = await db.select().from(systemRoles).where(eq(systemRoles.id, ur.systemRoleId));

      const customer = await db.select().from(customers).where(eq(customers.humanId, ur.humanId));

      if (human[0] && role[0]) {
        console.log(`${human[0].firstName} ${human[0].lastName || ''} → ${role[0].name}`);
        if (customer[0]) {
          console.log(`  Username: ${customer[0].username}`);
        }
      }
    }

    if (userRoles.length === 0) {
      console.log('No user-role assignments found');
    }
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkAdminUsers();
