#!/usr/bin/env node

/**
 * Seed a test user with email 'john@example.com' for development
 * Run: node seed-test-user.mjs
 */

import { createHash } from 'crypto';

// Simple password hashing for demo (in production, use bcrypt)
function hashPassword(password) {
  return createHash('sha256').update(password).digest('hex');
}

// Connection string
const connectionString = 'postgresql://postgres:postgres@localhost:5432/split_db';

// Test user data
const testUser = {
  email: 'john@example.com',
  username: 'john_doe',
  password: 'password123',
  firstName: 'John',
  lastName: 'Doe',
};

const sql = `
-- Create a test human
INSERT INTO humans (id, first_name, last_name, created_at, updated_at)
VALUES (
  '123e4567-e89b-12d3-a456-426614174000',
  '${testUser.firstName}',
  '${testUser.lastName}',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Add email to email_history
INSERT INTO email_history (id, human_id, email, effective_from, created_at)
VALUES (
  '223e4567-e89b-12d3-a456-426614174000',
  '123e4567-e89b-12d3-a456-426614174000',
  '${testUser.email}',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Create customer (authentication)
INSERT INTO customers (id, human_id, username, password_hash, created_at, updated_at)
VALUES (
  '323e4567-e89b-12d3-a456-426614174000',
  '123e4567-e89b-12d3-a456-426614174000',
  '${testUser.username}',
  '${hashPassword(testUser.password)}',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign customer role
INSERT INTO site_roles (id, role_name, description, is_active, created_at)
VALUES (
  '423e4567-e89b-12d3-a456-426614174000',
  'customer',
  'Regular customer/user',
  true,
  NOW()
) ON CONFLICT (role_name) DO NOTHING;

INSERT INTO human_site_roles (id, human_id, site_role_id, assigned_at)
SELECT 
  '523e4567-e89b-12d3-a456-426614174000',
  '123e4567-e89b-12d3-a456-426614174000',
  id,
  NOW()
FROM site_roles 
WHERE role_name = 'customer'
ON CONFLICT DO NOTHING;
`;

console.log('Seeding test user...');
console.log('Email:', testUser.email);
console.log('Username:', testUser.username);
console.log('Password:', testUser.password);
console.log('');
console.log('SQL to execute:');
console.log(sql);
