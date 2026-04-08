-- ============================================================
-- TEST DATA SEED SCRIPT
-- ============================================================
-- This script populates the database with test users for development

-- Create test human (john)
INSERT INTO humans (
  id, 
  first_name, 
  last_name, 
  created_at, 
  updated_at
) VALUES (
  '123e4567-e89b-12d3-a456-426614174000',
  'John',
  'Doe',
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Add email to email_history for john
INSERT INTO email_history (
  id,
  human_id,
  email,
  effective_from,
  created_at
) VALUES (
  '223e4567-e89b-12d3-a456-426614174000',
  '123e4567-e89b-12d3-a456-426614174000',
  'john@example.com',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Create customer record for john (username: john_doe, password: password123)
-- Password hash is SHA256 of 'password123' for testing
INSERT INTO customers (
  id,
  human_id,
  username,
  password_hash,
  created_at,
  updated_at
) VALUES (
  '323e4567-e89b-12d3-a456-426614174000',
  '123e4567-e89b-12d3-a456-426614174000',
  'john_doe',
  'ef92b778bafe771e89245d171bafcd62f1d1bea2c123fba71e47a72f8fc5248e',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Ensure customer role exists
INSERT INTO site_roles (
  id,
  role_name,
  description,
  is_active,
  created_at
) VALUES (
  '423e4567-e89b-12d3-a456-426614174000',
  'customer',
  'Regular customer/user',
  true,
  NOW()
) ON CONFLICT (role_name) DO NOTHING;

-- Assign customer role to john
INSERT INTO human_site_roles (
  id,
  human_id,
  site_role_id,
  assigned_at
)
SELECT 
  '523e4567-e89b-12d3-a456-426614174000',
  '123e4567-e89b-12d3-a456-426614174000',
  id,
  NOW()
FROM site_roles 
WHERE role_name = 'customer'
ON CONFLICT DO NOTHING;

-- Verify seed data was created
SELECT '✓ Test Data Seeded' as message;
SELECT 'john@example.com' as email, 'john_doe' as username, 'password123' as password;
