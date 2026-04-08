-- Migration 020: Add Role-Based Authorization System
-- Implements system-level and group-level roles with permissions

-- ============================================================
-- SYSTEM ROLES
-- ============================================================

CREATE TABLE IF NOT EXISTS system_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default system roles
INSERT INTO system_roles (name, description) VALUES
  ('admin', 'System administrator - full access to app and users'),
  ('user', 'Regular user - personal and group access')
ON CONFLICT DO NOTHING;

-- ============================================================
-- GROUP ROLES
-- ============================================================

CREATE TABLE IF NOT EXISTS group_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default group roles
INSERT INTO group_roles (name, description) VALUES
  ('owner', 'Group creator - full control of group'),
  ('admin', 'Group admin - invite/manage events'),
  ('member', 'Group member - can participate and create events'),
  ('viewer', 'Read-only access to group')
ON CONFLICT DO NOTHING;

-- ============================================================
-- PERMISSIONS
-- ============================================================

-- NOTE: permissions table already exists from migration 001 with permission_name column.
-- This CREATE TABLE is kept as a no-op guard; new permissions are inserted below.
CREATE TABLE IF NOT EXISTS permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  permission_name VARCHAR(100) NOT NULL UNIQUE,
  resource VARCHAR(50) NOT NULL,
  action VARCHAR(50) NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default permissions
-- permission_name follows 'resource.action' pattern (required NOT NULL column from migration 001)
INSERT INTO permissions (permission_name, resource, action, description) VALUES
  ('group.create',        'group',        'create',  'Create a new group'),
  ('group.read',          'group',        'read',    'View group details'),
  ('group.update',        'group',        'update',  'Edit group'),
  ('group.delete',        'group',        'delete',  'Delete group'),
  ('group.member.invite', 'group.member', 'invite',  'Invite user to group'),
  ('group.member.remove', 'group.member', 'remove',  'Remove user from group'),

  ('event.create',        'event',        'create',  'Create event in group'),
  ('event.read',          'event',        'read',    'View event'),
  ('event.update',        'event',        'update',  'Edit event'),
  ('event.delete',        'event',        'delete',  'Delete event'),

  ('expense.create',      'expense',      'create',  'Add expense'),
  ('expense.read',        'expense',      'read',    'View expense'),
  ('expense.update',      'expense',      'update',  'Edit expense'),

  ('user.manage',         'user',         'manage',  'Manage users (admin only)')
ON CONFLICT (permission_name) DO NOTHING;

-- ============================================================
-- USER ROLES - System level
-- ============================================================

CREATE TABLE IF NOT EXISTS human_system_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  human_id UUID NOT NULL REFERENCES humans(id) ON DELETE CASCADE,
  system_role_id UUID NOT NULL REFERENCES system_roles(id),
  assigned_by UUID REFERENCES humans(id) ON DELETE SET NULL,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(human_id, system_role_id),
  CONSTRAINT no_duplicate_roles CHECK (TRUE)
);

CREATE INDEX IF NOT EXISTS idx_human_system_roles_human_id 
  ON human_system_roles(human_id);

CREATE INDEX IF NOT EXISTS idx_human_system_roles_role_id 
  ON human_system_roles(system_role_id);

-- ============================================================
-- GROUP MEMBERSHIPS - Group level roles
-- ============================================================

ALTER TABLE group_members 
ADD COLUMN IF NOT EXISTS group_role_id UUID REFERENCES group_roles(id);

-- Set default role for existing members
UPDATE group_members 
SET group_role_id = (SELECT id FROM group_roles WHERE name = 'member')
WHERE group_role_id IS NULL;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_group_members_role_id 
  ON group_members(group_role_id);

-- ============================================================
-- ROLE PERMISSIONS MAPPING
-- ============================================================

CREATE TABLE IF NOT EXISTS group_role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_role_id UUID NOT NULL REFERENCES group_roles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(group_role_id, permission_id)
);

CREATE INDEX IF NOT EXISTS idx_role_perms_role_id 
  ON group_role_permissions(group_role_id);

CREATE INDEX IF NOT EXISTS idx_role_perms_perm_id 
  ON group_role_permissions(permission_id);

-- Map OWNER role to all permissions
INSERT INTO group_role_permissions (group_role_id, permission_id)
SELECT gr.id, p.id FROM group_roles gr, permissions p
WHERE gr.name = 'owner'
ON CONFLICT DO NOTHING;

-- Map ADMIN role to all except member management
INSERT INTO group_role_permissions (group_role_id, permission_id)
SELECT gr.id, p.id FROM group_roles gr, permissions p
WHERE gr.name = 'admin' AND p.resource NOT IN ('group.member')
ON CONFLICT DO NOTHING;

-- Map MEMBER role to create/read/update (not delete)
INSERT INTO group_role_permissions (group_role_id, permission_id)
SELECT gr.id, p.id FROM group_roles gr, permissions p
WHERE gr.name = 'member' AND p.action IN ('create', 'read', 'update')
  AND p.resource IN ('event', 'expense')
ON CONFLICT DO NOTHING;

-- Map VIEWER role to read only
INSERT INTO group_role_permissions (group_role_id, permission_id)
SELECT gr.id, p.id FROM group_roles gr, permissions p
WHERE gr.name = 'viewer' AND p.action = 'read'
ON CONFLICT DO NOTHING;

-- ============================================================
-- AUTO-ASSIGN ROLES FOR EXISTING DATA
-- ============================================================

-- Auto-assign existing group creators as OWNERS
INSERT INTO group_members (group_id, user_id, group_role_id, joined_at)
SELECT 
  eg.id,
  eg.created_by,
  (SELECT id FROM group_roles WHERE name = 'owner'),
  eg.created_at
FROM expense_groups eg
WHERE NOT EXISTS (
  SELECT 1 FROM group_members gm 
  WHERE gm.group_id = eg.id AND gm.user_id = eg.created_by
)
ON CONFLICT DO NOTHING;

-- ============================================================
-- SET OWNER ROLE FOR GROUP CREATORS
-- ============================================================

UPDATE group_members gm
SET group_role_id = (SELECT id FROM group_roles WHERE name = 'owner')
WHERE gm.user_id IN (
  SELECT created_by FROM expense_groups eg
  WHERE eg.id = gm.group_id
) AND gm.group_role_id IS NULL;
