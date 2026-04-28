import { db } from './src/db';
import { humans, customers, systemRoles, humanSystemRoles } from './src/db/schema';
import { eq } from 'drizzle-orm';

async function makeAdmin(usernameToPromote: string) {
  try {
    console.log(`🔍 Looking up user: ${usernameToPromote}`);
    
    // 1. Get the customer and human ID
    const [customer] = await db
      .select({ humanId: customers.humanId })
      .from(customers)
      .where(eq(customers.username, usernameToPromote))
      .limit(1);

    if (!customer) {
      console.error(`❌ User '${usernameToPromote}' not found in database.`);
      process.exit(1);
    }

    const humanId = customer.humanId;

    // 2. Ensure 'admin' role exists in systemRoles
    let [adminRole] = await db
      .select()
      .from(systemRoles)
      .where(eq(systemRoles.name, 'admin'))
      .limit(1);

    if (!adminRole) {
      console.log(`⚠️ 'admin' system role not found. Creating it...`);
      [adminRole] = await db
        .insert(systemRoles)
        .values({
          name: 'admin',
          description: 'System Administrator'
        })
        .returning();
    }

    // 3. Check if user already has a system role
    const [existingRole] = await db
      .select()
      .from(humanSystemRoles)
      .where(eq(humanSystemRoles.humanId, humanId))
      .limit(1);

    if (existingRole) {
      // Update existing role to admin
      await db
        .update(humanSystemRoles)
        .set({ systemRoleId: adminRole.id })
        .where(eq(humanSystemRoles.humanId, humanId));
      
      console.log(`✅ Updated existing role to ADMIN for ${usernameToPromote}`);
    } else {
      // Insert new admin role
      await db
        .insert(humanSystemRoles)
        .values({
          humanId: humanId,
          systemRoleId: adminRole.id
        });
      
      console.log(`✅ Assigned new ADMIN role to ${usernameToPromote}`);
    }

    console.log(`🎉 Success! User '${usernameToPromote}' is now a system admin.`);
    console.log(`If they refresh the page, they will see the '🔐 Manage Users' link in the header!`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to assign admin role:', error);
    process.exit(1);
  }
}

// Get username from arguments, or default to johnelway
const username = process.argv[2] || 'johnelway';
makeAdmin(username);
