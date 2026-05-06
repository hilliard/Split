# Human-Centric Database Starter Kit

This starter kit consolidates the philosophy and the raw SQL needed to port the **Human-Centric Database Architecture** into a brand new project. This architecture is designed for scalability, temporal tracking, and robust Role-Based Access Control (RBAC). It runs beautifully on PostgreSQL.

---

## 1. Core Philosophy

A traditional "user-centric" design tightly couples a person's physical identity (name, dob) with their authentication credentials (username, password) in a single `users` table. 

The **Human-Centric Design** splits this apart:
1. **`humans`**: The absolute core entity. Represents a physical person. 
2. **`customers` (or users/staff)**: The authentication credential role. A human can have a customer account, a staff account, or no account at all.
3. **`email_history`**: Temporal tracking. A human's email is tracked over time, ensuring historical data integrity even if they change their primary email.
4. **`site_roles` & `permissions`**: Granular RBAC system mapped to the `humans` table via junction tables, allowing infinite extensibility for administrative panels and granular feature access.

### Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                     HUMAN-CENTRIC CORE                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────────────┐         ┌──────────────────┐                  │
│  │    HUMANS        │◄────────│  EMAIL_HISTORY   │                  │
│  │                  │         │  (Temporal)      │                  │
│  │ id (PK)          │         │                  │                  │
│  │ first_name       │         │ human_id (FK)    │                  │
│  │ last_name        │         │ email            │                  │
│  │ dob              │         │ effective_from   │                  │
│  │ gender           │         │ effective_to     │                  │
│  │ phone            │         │                  │                  │
│  │ created_at       │         └──────────────────┘                  │
│  │ updated_at       │                                               │
│  └────┬─────────────┘                                               │
│       │                                                    n        │
│       │ 1:1                                                         │
│       ├─────────┬──────────────┬──────────────────┐                 │
│       │         │              │                  │                 │
│  ┌────▼────┐ ┌──▼──────┐ ┌─────▼────┐ ┌──────────▼──┐               │
│  │CUSTOMERS│ │ PAYERS  │ │ PAYEES   │ │    OTHER    │               │
│  │         │ │         │ │          │ │   ROLES     │               │
│  │ human_id│ │human_id │ │human_id  │ │             │               │
│  │username │ │username │ │username  │ │             │               │
│  │password │ │         │ │          │ │             │               │
│  │loyalty_ │ │         │ │          │ │             │               │
│  │ points  │ │         │ │          │ │             │               │
│  └────────┘ └─────────┘ └──────────┘ └─────────────┘                │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                    ROLE-BASED ACCESS CONTROL                        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────────────┐                  ┌──────────────────┐         │
│  │  SITE_ROLES      │                  │  PERMISSIONS     │         │
│  │                  │                  │                  │         │
│  │ id (PK)          │                  │ id (PK)          │         │
│  │ role_name        │ ◄────junction───► │ permission_name  │         │
│  │ description      │   (many:many)    │ resource         │         │
│  │ is_active        │                  │ action           │         │
│  │ created_at       │                  │ is_active        │         │
│  └────┬─────────────┘                  └──────────────────┘         │
│       │                                                             │
│       │ junction: SITE_ROLE_PERMISSIONS                             │
│       │                                                             │
│       │ junction: HUMAN_SITE_ROLES                                  │
│       │                                                             │
│       └───────────────────┬───────────────────────────────────────┐ │
│                           │                                       │ │
│                    Can have many roles                        Many:Many│
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 2. Raw SQL Implementation (PostgreSQL)

Copy and execute the following SQL script to instantly spin up the Human-Centric architecture in your new project's Postgres instance.

```sql
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
```

## 3. Seed Default Roles and Permissions

You can immediately seed the database with a default Admin and Customer role, and their base permissions. 

```sql
-- Create default roles
INSERT INTO "site_roles" ("role_name", "description") VALUES
	('admin', 'Administrator with full system access'),
	('customer', 'Regular user/customer')
ON CONFLICT ("role_name") DO NOTHING;

-- Create default permissions
INSERT INTO "permissions" ("permission_name", "resource", "action") VALUES
	('users.manage', 'users', 'manage'),
	('users.view', 'users', 'view')
ON CONFLICT ("permission_name") DO NOTHING;

-- Assign all permissions to Admin
INSERT INTO "site_role_permissions" ("site_role_id", "permission_id")
	SELECT sr."id", p."id"
	FROM "site_roles" sr, "permissions" p
	WHERE sr."role_name" = 'admin'
ON CONFLICT DO NOTHING;
```
