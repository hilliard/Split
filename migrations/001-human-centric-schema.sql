-- ============================================================
-- SPLIT APP: HUMAN-CENTRIC DATABASE MIGRATION
-- ============================================================
-- This migration transforms the database from a simple user-centric
-- model to a human-centric model with role-based architecture.
-- 
-- Key Changes:
-- 1. Separate humans (people) from authentication (customers/users role)
-- 2. Add temporal email tracking with email_history
-- 3. Implement RBAC system with site_roles and permissions
-- 4. Maintain backward compatibility during transition
--
-- WARNING: This migration requires careful execution. Test in 
-- development first. Back up production database before running.
-- ============================================================

-- ============================================================
-- PHASE 1: CREATE NEW HUMAN-CENTRIC TABLES
-- ============================================================

-- 1. BASE HUMANS TABLE (Core entity for all people)
CREATE TABLE IF NOT EXISTS "humans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"first_name" varchar(255),
	"last_name" varchar(255),
	"dob" date,
	"gender" varchar(50),
	"phone" varchar(20),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX "humans_name_idx" ON "humans" USING btree ("first_name", "last_name");

-- 2. EMAIL HISTORY TABLE (Temporal tracking for email changes)
CREATE TABLE IF NOT EXISTS "email_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"human_id" uuid NOT NULL REFERENCES "humans"("id") ON DELETE CASCADE,
	"email" varchar(255) NOT NULL,
	"effective_from" timestamp DEFAULT now() NOT NULL,
	"effective_to" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "email_history_unique" UNIQUE("human_id", "effective_from")
);

CREATE INDEX "email_history_human_idx" ON "email_history" USING btree ("human_id");
CREATE INDEX "email_history_email_idx" ON "email_history" USING btree ("email");
CREATE INDEX "email_history_effective_idx" ON "email_history" USING btree ("effective_from", "effective_to");

-- 3. SITE ROLES TABLE (RBAC: Define available roles)
CREATE TABLE IF NOT EXISTS "site_roles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"role_name" varchar(100) NOT NULL UNIQUE,
	"description" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);

-- 4. PERMISSIONS TABLE (RBAC: Define available permissions)
CREATE TABLE IF NOT EXISTS "permissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"permission_name" varchar(100) NOT NULL UNIQUE,
	"resource" varchar(100) NOT NULL,
	"action" varchar(100) NOT NULL,
	"description" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);

-- 5. HUMAN-SITE ROLES JUNCTION TABLE (Many-to-many: humans ↔ roles)
CREATE TABLE IF NOT EXISTS "human_site_roles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"human_id" uuid NOT NULL REFERENCES "humans"("id") ON DELETE CASCADE,
	"site_role_id" uuid NOT NULL REFERENCES "site_roles"("id") ON DELETE CASCADE,
	"assigned_at" timestamp DEFAULT now() NOT NULL,
	"assigned_by" uuid REFERENCES "humans"("id") ON DELETE SET NULL,
	CONSTRAINT "human_site_roles_unique" UNIQUE("human_id", "site_role_id")
);

CREATE INDEX "human_site_roles_human_idx" ON "human_site_roles" USING btree ("human_id");
CREATE INDEX "human_site_roles_role_idx" ON "human_site_roles" USING btree ("site_role_id");

-- 6. SITE ROLE PERMISSIONS JUNCTION TABLE (Many-to-many: roles ↔ permissions)
CREATE TABLE IF NOT EXISTS "site_role_permissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"site_role_id" uuid NOT NULL REFERENCES "site_roles"("id") ON DELETE CASCADE,
	"permission_id" uuid NOT NULL REFERENCES "permissions"("id") ON DELETE CASCADE,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "site_role_permissions_unique" UNIQUE("site_role_id", "permission_id")
);

CREATE INDEX "site_role_permissions_role_idx" ON "site_role_permissions" USING btree ("site_role_id");
CREATE INDEX "site_role_permissions_perm_idx" ON "site_role_permissions" USING btree ("permission_id");

-- 7. CUSTOMERS ROLE TABLE (User as a customer/participant)
CREATE TABLE IF NOT EXISTS "customers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"human_id" uuid NOT NULL REFERENCES "humans"("id") ON DELETE CASCADE,
	"username" varchar(255) NOT NULL UNIQUE,
	"password_hash" text NOT NULL,
	"loyalty_points" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX "customers_human_idx" ON "customers" USING btree ("human_id");
CREATE INDEX "customers_username_idx" ON "customers" USING btree ("username");

-- 8. PAYERS TABLE (Who pays money)
CREATE TABLE IF NOT EXISTS "payers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"human_id" uuid NOT NULL REFERENCES "humans"("id") ON DELETE CASCADE,
	"username" varchar(255) NOT NULL UNIQUE,
	"created_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX "payers_human_idx" ON "payers" USING btree ("human_id");

-- 9. PAYEES TABLE (Who receives money)
CREATE TABLE IF NOT EXISTS "payees" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"human_id" uuid NOT NULL REFERENCES "humans"("id") ON DELETE CASCADE,
	"username" varchar(255) NOT NULL UNIQUE,
	"created_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX "payees_human_idx" ON "payees" USING btree ("human_id");

-- ============================================================
-- PHASE 2: MIGRATE EXISTING DATA
-- ============================================================

-- 1. Migrate existing users to humans table
INSERT INTO "humans" ("id", "first_name", "last_name", "created_at", "updated_at")
	SELECT "id", "username", '', "created_at", "updated_at"
	FROM "users"
	WHERE NOT EXISTS (SELECT 1 FROM "humans" WHERE "id" = "users"."id")
	ON CONFLICT DO NOTHING;

-- 2. Create email_history records from existing users
INSERT INTO "email_history" ("human_id", "email", "effective_from")
	SELECT u."id", u."email", u."created_at"
	FROM "users" u
	WHERE NOT EXISTS (
		SELECT 1 FROM "email_history" 
		WHERE "human_id" = u."id" AND "email" = u."email"
	)
	ON CONFLICT DO NOTHING;

-- 3. Create customer role records for existing users
INSERT INTO "customers" ("human_id", "username", "password_hash", "created_at", "updated_at")
	SELECT u."id", u."username", u."password_hash", u."created_at", u."updated_at"
	FROM "users" u
	WHERE NOT EXISTS (
		SELECT 1 FROM "customers" WHERE "human_id" = u."id"
	)
	ON CONFLICT DO NOTHING;

-- 4. Create default roles if not exist
INSERT INTO "site_roles" ("role_name", "description") VALUES
	('admin', 'Administrator with full system access'),
	('customer', 'Regular user/customer'),
	('organizer', 'Event organizer'),
	('payor', 'Can pay expenses'),
	('payee', 'Can receive payments')
ON CONFLICT ("role_name") DO NOTHING;

-- 5. Create default permissions if not exist
INSERT INTO "permissions" ("permission_name", "resource", "action") VALUES
	('users.manage', 'users', 'manage'),
	('users.view', 'users', 'view'),
	('events.create', 'events', 'create'),
	('events.edit', 'events', 'edit'),
	('events.delete', 'events', 'delete'),
	('events.view', 'events', 'view'),
	('expenses.create', 'expenses', 'create'),
	('expenses.edit', 'expenses', 'edit'),
	('expenses.delete', 'expenses', 'delete'),
	('expenses.view', 'expenses', 'view'),
	('groups.create', 'groups', 'create'),
	('groups.manage', 'groups', 'manage'),
	('groups.view', 'groups', 'view')
ON CONFLICT ("permission_name") DO NOTHING;

-- 6. Assign permissions to roles
-- Admin gets all permissions
INSERT INTO "site_role_permissions" ("site_role_id", "permission_id")
	SELECT sr."id", p."id"
	FROM "site_roles" sr, "permissions" p
	WHERE sr."role_name" = 'admin'
	AND NOT EXISTS (
		SELECT 1 FROM "site_role_permissions"
		WHERE "site_role_id" = sr."id" AND "permission_id" = p."id"
	)
ON CONFLICT DO NOTHING;

-- Customer gets read and create permissions
INSERT INTO "site_role_permissions" ("site_role_id", "permission_id")
	SELECT sr."id", p."id"
	FROM "site_roles" sr, "permissions" p
	WHERE sr."role_name" = 'customer'
	AND p."permission_name" IN (
		'events.view', 'events.create',
		'expenses.view', 'expenses.create',
		'groups.view', 'groups.create'
	)
	AND NOT EXISTS (
		SELECT 1 FROM "site_role_permissions"
		WHERE "site_role_id" = sr."id" AND "permission_id" = p."id"
	)
ON CONFLICT DO NOTHING;

-- ============================================================
-- PHASE 3: EXTEND EXISTING DOMAIN TABLES
-- ============================================================

-- Add human_id to events (optional but recommended for non-user references)
-- ALTER TABLE "events" ADD COLUMN "organizer_human_id" uuid REFERENCES "humans"("id");

-- ============================================================
-- PHASE 4: PROVIDE HELPFUL VIEWS FOR BACKWARD COMPATIBILITY
-- ============================================================

-- View: Get current email for each human (backward compatibility)
CREATE OR REPLACE VIEW "humans_with_email" AS
	SELECT 
		h."id",
		h."first_name",
		h."last_name",
		h."dob",
		h."gender",
		h."phone",
		COALESCE(eh."email", c."username" || '@split.local') as "email",
		h."created_at",
		h."updated_at"
	FROM "humans" h
	LEFT JOIN "email_history" eh ON h."id" = eh."human_id" AND eh."effective_to" IS NULL
	LEFT JOIN "customers" c ON h."id" = c."human_id";

-- View: Get human with all assigned roles
CREATE OR REPLACE VIEW "humans_with_roles" AS
	SELECT 
		h."id",
		h."first_name",
		h."last_name",
		json_agg(sr."role_name") as "roles"
	FROM "humans" h
	LEFT JOIN "human_site_roles" hsr ON h."id" = hsr."human_id"
	LEFT JOIN "site_roles" sr ON hsr."site_role_id" = sr."id"
	GROUP BY h."id", h."first_name", h."last_name";

-- View: Get role with all permissions
CREATE OR REPLACE VIEW "roles_with_permissions" AS
	SELECT 
		sr."id",
		sr."role_name",
		sr."description",
		json_agg(
			json_build_object(
				'permission_name', p."permission_name",
				'resource', p."resource",
				'action', p."action"
			)
		) as "permissions"
	FROM "site_roles" sr
	LEFT JOIN "site_role_permissions" srp ON sr."id" = srp."site_role_id"
	LEFT JOIN "permissions" p ON srp."permission_id" = p."id"
	GROUP BY sr."id", sr."role_name", sr."description";

-- ============================================================
-- FINAL NOTES
-- ============================================================
-- 
-- KEY CHANGES SUMMARY:
-- 1. humans = base person entity (first_name, last_name, phone, dob, gender)
-- 2. email_history = track email changes over time (temporal data)
-- 3. customers = authentication credential (username, password_hash)
-- 4. site_roles + permissions + junctions = full RBAC system
-- 5. payers/payees = specialized roles for expense tracking
--
-- MIGRATION STRATEGY:
-- Phase 1: New tables created in parallel
-- Phase 2: Data migrated from existing 'users' table
-- Phase 3: Views provide backward compatibility
-- Phase 4: Code gradually migrated to use new structure
-- Phase 5: Eventually deprecate old 'users' table
--
-- QUERIES FOR COMMON OPERATIONS:
--
-- Get human with current email and roles:
--   SELECT h.*, eh.email, array_agg(sr.role_name) as roles
--   FROM humans h
--   LEFT JOIN email_history eh ON h.id = eh.human_id AND eh.effective_to IS NULL
--   LEFT JOIN human_site_roles hsr ON h.id = hsr.human_id
--   LEFT JOIN site_roles sr ON hsr.site_role_id = sr.id
--   GROUP BY h.id, eh.email;
--
-- Check if human has permission:
--   SELECT EXISTS(
--     SELECT 1
--     FROM human_site_roles hsr
--     JOIN site_role_permissions srp ON hsr.site_role_id = srp.site_role_id
--     JOIN permissions p ON srp.permission_id = p.id
--     WHERE hsr.human_id = $1
--     AND p.permission_name = $2
--   );
--
-- Get all humans with a specific role:
--   SELECT h.*
--   FROM humans h
--   JOIN human_site_roles hsr ON h.id = hsr.human_id
--   JOIN site_roles sr ON hsr.site_role_id = sr.id
--   WHERE sr.role_name = $1;
--
-- ============================================================
