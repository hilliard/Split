#!/usr/bin/env node

/**
 * Seed test users with different privilege levels
 * 
 * Creates multiple test users with varying permission levels:
 * - admin_user: System admin (can manage users, view all data)
 * - regular_user: Regular user (personal events + group participation)
 * - viewer_user: Limited viewer (read-only access to shared groups)
 * 
 * Run: node seed-test-users-with-roles.mjs
 */

import postgres from 'postgres';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Load .env.local
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, '.env.local');

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && !key.startsWith('#') && value) {
      process.env[key.trim()] = value.trim();
    }
  });
}

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('❌ DATABASE_URL not found in environment or .env.local');
  process.exit(1);
}

console.log('📚 Using connection string:', connectionString.replace(/\/\/.*@/, '//***@'));

// Handle SSL requirement for cloud databases (Neon, etc.)
const sql = postgres(connectionString, { 
  max: 1,
  ssl: 'require'
});

// Test users with different roles
const testUsers = [
  {
    id: '00000001-0000-0000-0000-000000000001',
    humanId: '10000001-0000-0000-0000-000000000001',
    firstName: 'Admin',
    lastName: 'User',
    username: 'admin_test',
    email: 'admin@test.local',
    password: 'admin_password123',
    systemRole: 'admin',
    description: 'System administrator with full access'
  },
  {
    id: '00000002-0000-0000-0000-000000000002',
    humanId: '10000002-0000-0000-0000-000000000002',
    firstName: 'Regular',
    lastName: 'User',
    username: 'user_test',
    email: 'user@test.local',
    password: 'user_password123',
    systemRole: 'user',
    description: 'Regular user with standard permissions'
  },
  {
    id: '00000003-0000-0000-0000-000000000003',
    humanId: '10000003-0000-0000-0000-000000000003',
    firstName: 'Guest',
    lastName: 'Viewer',
    username: 'viewer_test',
    email: 'viewer@test.local',
    password: 'viewer_password123',
    systemRole: 'user', // Start as regular user, will get viewer role in groups
    description: 'Test user for viewer/read-only testing'
  },
  {
    id: '00000004-0000-0000-0000-000000000004',
    humanId: '10000004-0000-0000-0000-000000000004',
    firstName: 'Power',
    lastName: 'User',
    username: 'power_test',
    email: 'power@test.local',
    password: 'power_password123',
    systemRole: 'user',
    description: 'Test user for testing group admin/owner roles'
  }
];

async function seedUsers() {
  try {
    console.log('🌱 Starting test user seeding...\n');

    // First, ensure system roles exist
    console.log('📋 Ensuring system roles exist...');
    const systemRoles = ['admin', 'user'];
    
    for (const roleName of systemRoles) {
      await sql`
        INSERT INTO system_roles (name, description, created_at)
        VALUES (${roleName}, ${'System-level ' + roleName + ' role'}, NOW())
        ON CONFLICT (name) DO NOTHING
      `;
      console.log(`  ✓ System role '${roleName}' ensured`);
    }

    // Create test users
    console.log('\n👥 Creating test users...');
    
    for (const user of testUsers) {
      const passwordHash = await bcrypt.hash(user.password, 10);

      // Create human record
      await sql`
        INSERT INTO humans (id, first_name, last_name, created_at, updated_at)
        VALUES (${user.humanId}, ${user.firstName}, ${user.lastName}, NOW(), NOW())
        ON CONFLICT (id) DO NOTHING
      `;

      // Create customer (credentials)
      await sql`
        INSERT INTO customers (id, human_id, username, password_hash, created_at, updated_at)
        VALUES (${user.id}, ${user.humanId}, ${user.username}, ${passwordHash}, NOW(), NOW())
        ON CONFLICT (id) DO NOTHING
      `;

      // Assign system role
      const roleRecord = await sql`SELECT id FROM system_roles WHERE name = ${user.systemRole}`;
      
      if (roleRecord.length > 0) {
        const roleId = roleRecord[0].id;
        
        await sql`
          INSERT INTO human_system_roles (human_id, system_role_id, assigned_at)
          VALUES (${user.humanId}, ${roleId}, NOW())
          ON CONFLICT (human_id, system_role_id) DO NOTHING
        `;
      }

      console.log(`  ✓ Created ${user.username} (${user.systemRole})`);
      console.log(`    Email: ${user.email}`);
      console.log(`    Password: ${user.password}`);
    }

    console.log('\n✅ Test users seeded successfully!\n');
    console.log('📝 Test Credentials:\n');
    
    for (const user of testUsers) {
      console.log(`${user.username}:`);
      console.log(`  Email: ${user.email}`);
      console.log(`  Password: ${user.password}`);
      console.log(`  Role: ${user.systemRole}`);
      console.log(`  → ${user.description}\n`);
    }

  } catch (err) {
    console.error('❌ Error seeding users:', err.message);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

seedUsers();
