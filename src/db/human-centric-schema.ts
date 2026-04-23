import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  boolean,
  date,
  integer,
  uniqueIndex,
  index,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ============================================================
// HUMAN-CENTRIC SCHEMA FOR DRIZZLE ORM
// ============================================================

// 1. BASE HUMANS TABLE
export const humans = pgTable(
  'humans',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    firstName: varchar('first_name', { length: 255 }),
    lastName: varchar('last_name', { length: 255 }),
    dob: date('dob'),
    gender: varchar('gender', { length: 50 }),
    phone: varchar('phone', { length: 20 }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    nameIdx: index('humans_name_idx').on(table.firstName, table.lastName),
  })
);

// 2. EMAIL HISTORY TABLE
export const emailHistory = pgTable(
  'email_history',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    humanId: uuid('human_id')
      .notNull()
      .references(() => humans.id, { onDelete: 'cascade' }),
    email: varchar('email', { length: 255 }).notNull(),
    effectiveFrom: timestamp('effective_from').defaultNow().notNull(),
    effectiveTo: timestamp('effective_to'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    humanIdx: index('email_history_human_idx').on(table.humanId),
    emailIdx: index('email_history_email_idx').on(table.email),
    effectiveIdx: index('email_history_effective_idx').on(table.effectiveFrom, table.effectiveTo),
    uniqueIdx: uniqueIndex('email_history_unique').on(table.humanId, table.effectiveFrom),
  })
);

// 3. SITE ROLES TABLE
export const siteRoles = pgTable('site_roles', {
  id: uuid('id').primaryKey().defaultRandom(),
  roleName: varchar('role_name', { length: 100 }).notNull().unique(),
  description: text('description'),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 4. PERMISSIONS TABLE
export const permissions = pgTable('permissions', {
  id: uuid('id').primaryKey().defaultRandom(),
  permissionName: varchar('permission_name', { length: 100 }).notNull().unique(),
  resource: varchar('resource', { length: 100 }).notNull(),
  action: varchar('action', { length: 100 }).notNull(),
  description: text('description'),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 5. HUMAN-SITE ROLES JUNCTION TABLE
export const humanSiteRoles = pgTable(
  'human_site_roles',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    humanId: uuid('human_id')
      .notNull()
      .references(() => humans.id, { onDelete: 'cascade' }),
    siteRoleId: uuid('site_role_id')
      .notNull()
      .references(() => siteRoles.id, { onDelete: 'cascade' }),
    assignedAt: timestamp('assigned_at').defaultNow().notNull(),
    assignedBy: uuid('assigned_by').references(() => humans.id, { onDelete: 'set null' }),
  },
  (table) => ({
    humanIdx: index('human_site_roles_human_idx').on(table.humanId),
    roleIdx: index('human_site_roles_role_idx').on(table.siteRoleId),
    uniqueIdx: uniqueIndex('human_site_roles_unique').on(table.humanId, table.siteRoleId),
  })
);

// 6. SITE ROLE PERMISSIONS JUNCTION TABLE
export const siteRolePermissions = pgTable(
  'site_role_permissions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    siteRoleId: uuid('site_role_id')
      .notNull()
      .references(() => siteRoles.id, { onDelete: 'cascade' }),
    permissionId: uuid('permission_id')
      .notNull()
      .references(() => permissions.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    roleIdx: index('site_role_permissions_role_idx').on(table.siteRoleId),
    permIdx: index('site_role_permissions_perm_idx').on(table.permissionId),
    uniqueIdx: uniqueIndex('site_role_permissions_unique').on(table.siteRoleId, table.permissionId),
  })
);

// 7. CUSTOMERS TABLE (Authentication + customer role)
export const customers = pgTable(
  'customers',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    humanId: uuid('human_id')
      .notNull()
      .references(() => humans.id, { onDelete: 'cascade' }),
    username: varchar('username', { length: 255 }).notNull().unique(),
    email: varchar('email', { length: 255 }).notNull().unique(),
    passwordHash: text('password_hash').notNull(),
    emailVerified: boolean('email_verified').default(false).notNull(),
    loyaltyPoints: integer('loyalty_points').default(0),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    humanIdx: index('customers_human_idx').on(table.humanId),
    usernameIdx: index('customers_username_idx').on(table.username),
    emailIdx: index('customers_email_idx').on(table.email),
    verifiedIdx: index('customers_verified_idx').on(table.emailVerified),
  })
);

// 8. EMAIL VERIFICATION TOKENS TABLE
export const emailVerificationTokens = pgTable(
  'email_verification_tokens',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    customerId: uuid('customer_id')
      .notNull()
      .references(() => customers.id, { onDelete: 'cascade' }),
    email: varchar('email', { length: 255 }).notNull(),
    token: text('token').notNull().unique(),
    expiresAt: timestamp('expires_at').notNull(),
    verifiedAt: timestamp('verified_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    customerIdx: index('email_tokens_customer_idx').on(table.customerId),
    emailIdx: index('email_tokens_email_idx').on(table.email),
    tokenIdx: index('email_tokens_token_idx').on(table.token),
    expiresAtIdx: index('email_tokens_expires_at_idx').on(table.expiresAt),
  })
);

// 9. PAYERS TABLE
export const payers = pgTable(
  'payers',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    humanId: uuid('human_id')
      .notNull()
      .references(() => humans.id, { onDelete: 'cascade' }),
    username: varchar('username', { length: 255 }).notNull().unique(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    humanIdx: index('payers_human_idx').on(table.humanId),
  })
);

// 9. PAYEES TABLE
export const payees = pgTable(
  'payees',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    humanId: uuid('human_id')
      .notNull()
      .references(() => humans.id, { onDelete: 'cascade' }),
    username: varchar('username', { length: 255 }).notNull().unique(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    humanIdx: index('payees_human_idx').on(table.humanId),
  })
);

// ============================================================
// RELATIONS
// ============================================================

export const humansRelations = relations(humans, ({ many, one }) => ({
  emailHistory: many(emailHistory),
  customer: one(customers),
  payer: one(payers),
  payee: one(payees),
  rolesAssigned: many(humanSiteRoles),
  assignedByRoles: many(humanSiteRoles, { relationName: 'assignedBy' }),
}));

export const emailHistoryRelations = relations(emailHistory, ({ one }) => ({
  human: one(humans, {
    fields: [emailHistory.humanId],
    references: [humans.id],
  }),
}));

export const customersRelations = relations(customers, ({ one }) => ({
  human: one(humans, {
    fields: [customers.humanId],
    references: [humans.id],
  }),
}));

export const emailVerificationTokensRelations = relations(emailVerificationTokens, ({ one }) => ({
  customer: one(customers, {
    fields: [emailVerificationTokens.customerId],
    references: [customers.id],
  }),
}));

export const payersRelations = relations(payers, ({ one }) => ({
  human: one(humans, {
    fields: [payers.humanId],
    references: [humans.id],
  }),
}));

export const payeesRelations = relations(payees, ({ one }) => ({
  human: one(humans, {
    fields: [payees.humanId],
    references: [humans.id],
  }),
}));

export const humanSiteRolesRelations = relations(humanSiteRoles, ({ one }) => ({
  human: one(humans, {
    fields: [humanSiteRoles.humanId],
    references: [humans.id],
  }),
  role: one(siteRoles, {
    fields: [humanSiteRoles.siteRoleId],
    references: [siteRoles.id],
  }),
  assignedBy: one(humans, {
    fields: [humanSiteRoles.assignedBy],
    references: [humans.id],
    relationName: 'assignedBy',
  }),
}));

export const siteRolePermissionsRelations = relations(siteRolePermissions, ({ one }) => ({
  role: one(siteRoles, {
    fields: [siteRolePermissions.siteRoleId],
    references: [siteRoles.id],
  }),
  permission: one(permissions, {
    fields: [siteRolePermissions.permissionId],
    references: [permissions.id],
  }),
}));

export const siteRolesRelations = relations(siteRoles, ({ many }) => ({
  humans: many(humanSiteRoles),
  permissions: many(siteRolePermissions),
}));

export const permissionsRelations = relations(permissions, ({ many }) => ({
  roles: many(siteRolePermissions),
}));
