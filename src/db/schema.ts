import { z } from 'zod';
import {
  pgTable,
  index,
  uuid,
  varchar,
  date,
  timestamp,
  foreignKey,
  unique,
  integer,
  json,
  text,
  boolean,
  pgView,
  numeric,
  doublePrecision,
  bigint,
  interval,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { sql } from 'drizzle-orm';

// ============================================================
// HUMAN-CENTRIC SCHEMA TABLES
// ============================================================

// Humans table - core person entity
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

// Customers table - authentication entity (formerly "users")
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

// Keep users table for backward compatibility with existing migrations
export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    email: varchar('email', { length: 255 }).unique().notNull(),
    username: varchar('username', { length: 255 }).notNull(),
    passwordHash: text('password_hash').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    emailIdx: index('email_idx').on(table.email),
  })
);

// Events table - represents a trip, dinner, vacation, etc.
export const events = pgTable(
  'events',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    creatorId: uuid('creator_id')
      .notNull()
      .references(() => humans.id, { onDelete: 'cascade' }),
    groupId: uuid('group_id').references(() => expenseGroups.id, { onDelete: 'set null' }),
    title: varchar('title', { length: 255 }).notNull(),
    description: text('description'),
    type: varchar('type', { length: 50 }).default('general').notNull(),
    status: varchar('status', { length: 50 }).default('scheduled'),
    startTime: timestamp('start_time', { withTimezone: true }).notNull(),
    endTime: timestamp('end_time', { withTimezone: true }),
    timezone: varchar('timezone', { length: 50 }).default('UTC'),
    isVirtual: boolean('is_virtual').default(false),
    venueId: uuid('venue_id'),
    isPublic: boolean('is_public').default(true),
    currency: varchar('currency', { length: 3 }).default('USD'),
    budgetCents: integer('budget_cents'),
    metadata: json('metadata')
      .$type<Record<string, unknown>>()
      .default({} as any),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    creatorIdx: index('events_creator_id').on(table.creatorId),
    groupIdx: index('events_group_id').on(table.groupId),
    startTimeIdx: index('idx_events_start_time').on(table.startTime),
    statusIdx: index('idx_events_status').on(table.status),
  })
);

// Activities table - subitems within an event (e.g., Gas, Hotel, Food)
export const activities = pgTable(
  'activities',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    eventId: uuid('event_id').references(() => events.id, { onDelete: 'cascade' }), // allow nulls (no NOT NULL specified)
    title: varchar('title', { length: 255 }).notNull(),
    startTime: timestamp('start_time', { withTimezone: true }),
    endTime: timestamp('end_time', { withTimezone: true }),
    locationName: varchar('location_name', { length: 255 }),
    sequenceOrder: integer('sequence_order').default(0),
    metadata: json('metadata')
      .$type<Record<string, unknown>>()
      .default({} as any),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    createdBy: uuid('created_by')
      .notNull()
      .references(() => humans.id),
  },
  (table) => ({
    eventIdx: index('idx_activities_event_id').on(table.eventId),
    startTimeIdx: index('idx_activities_start_time').on(table.startTime),
  })
);

// Expenses table - tracks money spent on activities/events
// 💰 IMPORTANT: All monetary amounts stored as INTEGER CENTS to avoid floating-point errors
//    Example: USD $50.25 = 5025 cents
//    Convert: centsToDollars(5025) = "50.25" | dollarsToCents(50.25) = 5025
//    See: MONETARY_STORAGE_GUIDE.md for full details
export const expenses = pgTable(
  'expenses',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    eventId: uuid('event_id').references(() => events.id, { onDelete: 'cascade' }),
    groupId: uuid('group_id').references(() => expenseGroups.id, { onDelete: 'set null' }),
    activityId: uuid('activity_id').references(() => activities.id, { onDelete: 'set null' }),
    amount: integer('amount').notNull(), // CENTS: $50.25 = 5025 | Use centsToDollars() to display
    tipAmount: integer('tip_amount').notNull().default(0), // CENTS: $3.45 = 345 | Use centsToDollars() to display
    category: varchar('category', { length: 50 }).default('misc'),
    description: varchar('description', { length: 500 }).notNull().default(''),
    paidBy: uuid('paid_by')
      .notNull()
      .references(() => humans.id, { onDelete: 'restrict' }),
    metadata: json('metadata')
      .$type<Record<string, unknown>>()
      .default({} as any),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    eventIdx: index('idx_expenses_event_id').on(table.eventId),
    groupIdx: index('idx_expenses_group_id').on(table.groupId),
    activityIdx: index('idx_expenses_activity_id').on(table.activityId),
    paidByIdx: index('idx_expenses_paid_by').on(table.paidBy),
    categoryIdx: index('idx_expenses_category').on(table.category),
  })
);

// Expense Groups - the group that shares expenses
export const expenseGroups = pgTable(
  'expense_groups',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 255 }).notNull(),
    createdBy: uuid('created_by')
      .notNull()
      .references(() => humans.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    createdByIdx: index('groups_created_by_idx').on(table.createdBy),
  })
);

// Group members - users that belong to an expense group
export const groupMembers = pgTable(
  'group_members',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    groupId: uuid('group_id')
      .notNull()
      .references(() => expenseGroups.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => humans.id, { onDelete: 'cascade' }),
    groupRoleId: uuid('group_role_id').references(() => groupRoles.id),
    invitedAt: timestamp('invited_at').defaultNow().notNull(),
    joinedAt: timestamp('joined_at'),
  },
  (table) => ({
    groupUserIdx: index('group_members_group_user_idx').on(table.groupId, table.userId),
    roleIdx: index('group_members_role_idx').on(table.groupRoleId),
  })
);

// Pending group invitations - for inviting users by email before they join
export const pendingGroupInvitations = pgTable(
  'pending_group_invitations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    groupId: uuid('group_id')
      .notNull()
      .references(() => expenseGroups.id, { onDelete: 'cascade' }),
    email: varchar('email', { length: 255 }).notNull(),
    invitedBy: uuid('invited_by')
      .notNull()
      .references(() => humans.id, { onDelete: 'cascade' }),
    status: varchar('status', { length: 50 }).default('pending').notNull(), // pending, accepted, rejected, expired
    invitedAt: timestamp('invited_at').defaultNow().notNull(),
    expiresAt: timestamp('expires_at'), // Optional: 30 days from now
    acceptedAt: timestamp('accepted_at'),
  },
  (table) => ({
    groupEmailIdx: index('pending_invitations_group_email_idx').on(table.groupId, table.email),
    statusIdx: index('pending_invitations_status_idx').on(table.status),
  })
);

// Expense splits - how an expense is divided among group members
export const expenseSplits = pgTable(
  'expense_splits',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    expenseId: uuid('expense_id')
      .notNull()
      .references(() => expenses.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => humans.id, { onDelete: 'cascade' }),
    amount: integer('amount').notNull(), // in cents
  },
  (table) => ({
    expenseIdx: index('splits_expense_idx').on(table.expenseId),
    userIdx: index('splits_user_idx').on(table.userId),
  })
);

// Settlements table - track actual payment transactions
export const settlements = pgTable(
  'settlements',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    eventId: uuid('event_id')
      .references(() => events.id, { onDelete: 'cascade' }),
    groupId: uuid('group_id').references(() => expenseGroups.id, { onDelete: 'set null' }),
    fromUserId: uuid('from_user_id')
      .notNull()
      .references(() => humans.id, { onDelete: 'restrict' }),
    toUserId: uuid('to_user_id')
      .notNull()
      .references(() => humans.id, { onDelete: 'restrict' }),
    amount: integer('amount').notNull(), // in cents
    description: varchar('description', { length: 500 }).default(''),
    status: varchar('status', { length: 50 }).default('pending').notNull(), // pending, completed, disputed, cancelled
    paymentMethod: varchar('payment_method', { length: 100 }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    completedAt: timestamp('completed_at'),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    eventIdx: index('settlements_event_idx').on(table.eventId),
    fromUserIdx: index('settlements_from_user_idx').on(table.fromUserId),
    toUserIdx: index('settlements_to_user_idx').on(table.toUserId),
    statusIdx: index('settlements_status_idx').on(table.status),
    createdAtIdx: index('settlements_created_at_idx').on(table.createdAt),
  })
);

// Sessions table for authentication
export const sessions = pgTable(
  'sessions',
  {
    id: text('id').primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => humans.id, { onDelete: 'cascade' }),
    expiresAt: timestamp('expires_at').notNull(),
  },
  (table) => ({
    userIdIdx: index('sessions_user_id_idx').on(table.userId),
    expiresAtIdx: index('sessions_expires_at_idx').on(table.expiresAt),
  })
);

// Email verification tokens - for email verification workflow
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

// Email history - track emails sent to humans
export const emailHistory = pgTable(
  'email_history',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    humanId: uuid('human_id').notNull().references(() => humans.id),
    email: varchar('email', { length: 255 }).notNull(),
    effectiveFrom: timestamp('effective_from', { withTimezone: true }).defaultNow().notNull(),
    effectiveTo: timestamp('effective_to', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    humanIdx: index('email_history_human_idx').on(table.humanId),
    emailIdx: index('email_history_email_idx').on(table.email),
  })
);

export const emailHistoryRelations = relations(emailHistory, ({ one }) => ({
  human: one(humans, {
    fields: [emailHistory.humanId],
    references: [humans.id],
  }),
}));

// Canonical update event schema (end-to-end validated shape for event updates)
export const updateEventSchema = z.object({
  title: z.string().min(1, 'Event title is required').max(255).optional(),
  description: z.string().max(2000).optional().nullable(),
  type: z.string().max(50).optional(),
  status: z.string().max(50).optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional().nullable(),
  timezone: z.string().max(50).optional(),
  isVirtual: z.boolean().optional(),
  isPublic: z.boolean().optional(),
  currency: z.string().length(3).optional(),
  budget: z.string().optional().nullable(),
});

// Relations
export const humansRelations = relations(humans, ({ many }) => ({
  events: many(events),
  expenseGroups: many(expenseGroups),
  groupMemberships: many(groupMembers),
  expenses: many(expenses),
  sessions: many(sessions),
}));

export const eventsRelations = relations(events, ({ one, many }) => ({
  creator: one(humans, {
    fields: [events.creatorId],
    references: [humans.id],
  }),
  group: one(expenseGroups, {
    fields: [events.groupId],
    references: [expenseGroups.id],
  }),
  activities: many(activities),
  expenses: many(expenses),
}));

export const activitiesRelations = relations(activities, ({ one, many }) => ({
  event: one(events, {
    fields: [activities.eventId],
    references: [events.id],
  }),
  expenses: many(expenses),
}));

export const expensesRelations = relations(expenses, ({ one }) => ({
  event: one(events, {
    fields: [expenses.eventId],
    references: [events.id],
  }),
  activity: one(activities, {
    fields: [expenses.activityId],
    references: [activities.id],
  }),
  paidByUser: one(humans, {
    fields: [expenses.paidBy],
    references: [humans.id],
  }),
}));

export const expenseGroupsRelations = relations(expenseGroups, ({ one, many }) => ({
  creator: one(humans, {
    fields: [expenseGroups.createdBy],
    references: [humans.id],
  }),
  members: many(groupMembers),
  expenses: many(expenses),
}));

export const groupMembersRelations = relations(groupMembers, ({ one }) => ({
  group: one(expenseGroups, {
    fields: [groupMembers.groupId],
    references: [expenseGroups.id],
  }),
  user: one(humans, {
    fields: [groupMembers.userId],
    references: [humans.id],
  }),
  role: one(groupRoles, {
    fields: [groupMembers.groupRoleId],
    references: [groupRoles.id],
  }),
}));

export const expenseSplitsRelations = relations(expenseSplits, ({ one }) => ({
  expense: one(expenses, {
    fields: [expenseSplits.expenseId],
    references: [expenses.id],
  }),
  user: one(humans, {
    fields: [expenseSplits.userId],
    references: [humans.id],
  }),
}));

export const settlementsRelations = relations(settlements, ({ one }) => ({
  event: one(events, {
    fields: [settlements.eventId],
    references: [events.id],
  }),
  group: one(expenseGroups, {
    fields: [settlements.groupId],
    references: [expenseGroups.id],
  }),
  fromUser: one(humans, {
    fields: [settlements.fromUserId],
    references: [humans.id],
  }),
  toUser: one(humans, {
    fields: [settlements.toUserId],
    references: [humans.id],
  }),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(humans, {
    fields: [sessions.userId],
    references: [humans.id],
  }),
}));

export const emailVerificationTokensRelations = relations(emailVerificationTokens, ({ one }) => ({
  customer: one(customers, {
    fields: [emailVerificationTokens.customerId],
    references: [customers.id],
  }),
}));

// ============================================================
// ROLE-BASED AUTHORIZATION TABLES
// ============================================================

// System roles - app-level (admin, user)
export const systemRoles = pgTable('system_roles', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 50 }).notNull().unique(),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Site roles - updated app-level (admin, customer, organizer)
export const siteRoles = pgTable('site_roles', {
  id: uuid('id').primaryKey().defaultRandom(),
  roleName: varchar('role_name', { length: 100 }).notNull().unique(),
  description: text('description'),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Group roles - group-level (owner, admin, member, viewer)
export const groupRoles = pgTable('group_roles', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 50 }).notNull().unique(),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Permissions - what actions are allowed
export const permissions = pgTable(
  'permissions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    resource: varchar('resource', { length: 50 }).notNull(),
    action: varchar('action', { length: 50 }).notNull(),
    description: text('description'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    resourceActionIdx: index('idx_permissions_resource_action').on(table.resource, table.action),
  })
);

// User system roles - maps humans to system roles
export const humanSystemRoles = pgTable(
  'human_system_roles',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    humanId: uuid('human_id')
      .notNull()
      .references(() => humans.id, { onDelete: 'cascade' }),
    systemRoleId: uuid('system_role_id')
      .notNull()
      .references(() => systemRoles.id),
    assignedBy: uuid('assigned_by').references(() => humans.id, { onDelete: 'set null' }),
    assignedAt: timestamp('assigned_at').defaultNow().notNull(),
  },
  (table) => ({
    humanIdx: index('idx_human_system_roles_human_id').on(table.humanId),
    roleIdx: index('idx_human_system_roles_role_id').on(table.systemRoleId),
  })
);

// Human site roles - maps humans to site roles
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
    uniqueIdx: unique('human_site_roles_unique').on(table.humanId, table.siteRoleId),
  })
);

// Site role permissions - maps site roles to permissions
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
    uniqueIdx: unique('site_role_permissions_unique').on(table.siteRoleId, table.permissionId),
  })
);

// Group role permissions - maps group roles to permissions
export const groupRolePermissions = pgTable(
  'group_role_permissions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    groupRoleId: uuid('group_role_id')
      .notNull()
      .references(() => groupRoles.id, { onDelete: 'cascade' }),
    permissionId: uuid('permission_id')
      .notNull()
      .references(() => permissions.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    roleIdx: index('idx_group_role_perms_role_id').on(table.groupRoleId),
    permIdx: index('idx_group_role_perms_perm_id').on(table.permissionId),
  })
);

// ============================================================
// AUTHORIZATION RELATIONS
// ============================================================

export const systemRolesRelations = relations(systemRoles, ({ many }) => ({
  humanRoles: many(humanSystemRoles),
}));

export const groupRolesRelations = relations(groupRoles, ({ many }) => ({
  permissions: many(groupRolePermissions),
}));

export const permissionsRelations = relations(permissions, ({ many }) => ({
  groupRoles: many(groupRolePermissions),
}));

export const humanSystemRolesRelations = relations(humanSystemRoles, ({ one }) => ({
  human: one(humans, {
    fields: [humanSystemRoles.humanId],
    references: [humans.id],
  }),
  role: one(systemRoles, {
    fields: [humanSystemRoles.systemRoleId],
    references: [systemRoles.id],
  }),
  assignedByUser: one(humans, {
    fields: [humanSystemRoles.assignedBy],
    references: [humans.id],
  }),
}));

export const groupRolePermissionsRelations = relations(groupRolePermissions, ({ one }) => ({
  groupRole: one(groupRoles, {
    fields: [groupRolePermissions.groupRoleId],
    references: [groupRoles.id],
  }),
  permission: one(permissions, {
    fields: [groupRolePermissions.permissionId],
    references: [permissions.id],
  }),
}));

// add the views and stored procedures here as needed in the future 
export const expenseSummaryForAnalysis = pgView('expense_summary_for_analysis', {
  expenseId: uuid('expense_id'),
  eventId: uuid('event_id'),
  activityId: uuid('activity_id'),
  groupId: uuid('group_id'),
  amountDollars: numeric('amount_dollars'),
  tipDollars: numeric('tip_dollars'),
  totalDollars: numeric('total_dollars'),
  category: varchar({ length: 50 }),
  description: varchar({ length: 255 }),
  payerId: uuid('payer_id'),
  payerUsername: varchar('payer_username', { length: 255 }),
  payerDisplayName: text('payer_display_name'),
  expenseDate: date('expense_date'),
  expenseYear: doublePrecision('expense_year'),
  expenseMonth: doublePrecision('expense_month'),
  expenseWeek: doublePrecision('expense_week'),
  monthYear: text('month_year'),
  createdAt: timestamp('created_at', { mode: 'string' }),
}).as(
  sql`SELECT e.id AS expense_id, e.event_id, e.activity_id, e.group_id, round(e.amount::numeric / 100.0, 2) AS amount_dollars, round(e.tip_amount::numeric / 100.0, 2) AS tip_dollars, round((e.amount + e.tip_amount)::numeric / 100.0, 2) AS total_dollars, e.category, e.description, e.paid_by AS payer_id, c_payer.username AS payer_username, (h_payer.first_name::text || ' '::text) || h_payer.last_name::text AS payer_display_name, e.created_at::date AS expense_date, date_part('year'::text, e.created_at) AS expense_year, date_part('month'::text, e.created_at) AS expense_month, date_part('week'::text, e.created_at) AS expense_week, to_char(e.created_at, 'YYYY-MM'::text) AS month_year, e.created_at FROM expenses e LEFT JOIN humans h_payer ON e.paid_by = h_payer.id LEFT JOIN customers c_payer ON h_payer.id = c_payer.human_id ORDER BY e.created_at DESC`
);

export const expenseSplitsForAnalysis = pgView('expense_splits_for_analysis', {
  splitId: uuid('split_id'),
  expenseId: uuid('expense_id'),
  userId: uuid('user_id'),
  userUsername: varchar('user_username', { length: 255 }),
  userDisplayName: text('user_display_name'),
  splitDollars: numeric('split_dollars'),
  paidByUserId: uuid('paid_by_user_id'),
  payerUsername: varchar('payer_username', { length: 255 }),
  payerDisplayName: text('payer_display_name'),
  amountOwedDollars: numeric('amount_owed_dollars'),
}).as(
  sql`SELECT es.id AS split_id, es.expense_id, es.user_id, c_user.username AS user_username, (h_user.first_name::text || ' '::text) || h_user.last_name::text AS user_display_name, round(es.amount::numeric / 100.0, 2) AS split_dollars, e.paid_by AS paid_by_user_id, c_payer.username AS payer_username, (h_payer.first_name::text || ' '::text) || h_payer.last_name::text AS payer_display_name, round(es.amount::numeric / 100.0, 2) AS amount_owed_dollars FROM expense_splits es JOIN expenses e ON es.expense_id = e.id LEFT JOIN humans h_user ON es.user_id = h_user.id LEFT JOIN customers c_user ON h_user.id = c_user.human_id LEFT JOIN humans h_payer ON e.paid_by = h_payer.id LEFT JOIN customers c_payer ON h_payer.id = c_payer.human_id ORDER BY es.id DESC`
);

export const dailySpendingTrendForAnalysis = pgView('daily_spending_trend_for_analysis', {
  expenseDate: date('expense_date'),
  year: integer(),
  month: integer(),
  week: integer(),
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  expenseCount: bigint('expense_count', { mode: 'number' }),
  subtotalDollars: numeric('subtotal_dollars'),
  totalTipsDollars: numeric('total_tips_dollars'),
  dailyTotalDollars: numeric('daily_total_dollars'),
  avgExpenseDollars: numeric('avg_expense_dollars'),
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  uniquePayers: bigint('unique_payers', { mode: 'number' }),
}).as(
  sql`SELECT created_at::date AS expense_date, date_part('year'::text, created_at)::integer AS year, date_part('month'::text, created_at)::integer AS month, date_part('week'::text, created_at)::integer AS week, count(*) AS expense_count, round(sum(amount)::numeric / 100.0, 2) AS subtotal_dollars, round(sum(tip_amount)::numeric / 100.0, 2) AS total_tips_dollars, round(sum(amount + tip_amount)::numeric / 100.0, 2) AS daily_total_dollars, round(avg(amount + tip_amount) / 100.0, 2) AS avg_expense_dollars, count(DISTINCT paid_by) AS unique_payers FROM expenses e GROUP BY (created_at::date), (date_part('year'::text, created_at)), (date_part('month'::text, created_at)), (date_part('week'::text, created_at)) ORDER BY (created_at::date) DESC`
);

export const categorySpendingForAnalysis = pgView('category_spending_for_analysis', {
  category: varchar({ length: 50 }),
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  expenseCount: bigint('expense_count', { mode: 'number' }),
  subtotalDollars: numeric('subtotal_dollars'),
  totalTipsDollars: numeric('total_tips_dollars'),
  totalDollars: numeric('total_dollars'),
  avgExpenseDollars: numeric('avg_expense_dollars'),
  maxExpenseDollars: numeric('max_expense_dollars'),
  minExpenseDollars: numeric('min_expense_dollars'),
}).as(
  sql`SELECT category, count(*) AS expense_count, round(sum(amount)::numeric / 100.0, 2) AS subtotal_dollars, round(sum(tip_amount)::numeric / 100.0, 2) AS total_tips_dollars, round(sum(amount + tip_amount)::numeric / 100.0, 2) AS total_dollars, round(avg(amount + tip_amount) / 100.0, 2) AS avg_expense_dollars, round(max(amount)::numeric / 100.0, 2) AS max_expense_dollars, round(min(amount)::numeric / 100.0, 2) AS min_expense_dollars FROM expenses e WHERE category IS NOT NULL GROUP BY category ORDER BY (round(sum(amount + tip_amount)::numeric / 100.0, 2)) DESC`
);

export const groupSpendingForAnalysis = pgView('group_spending_for_analysis', {
  groupId: uuid('group_id'),
  groupName: varchar('group_name', { length: 255 }),
  groupCreatedDate: date('group_created_date'),
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  totalExpenses: bigint('total_expenses', { mode: 'number' }),
  totalGroupSpendingDollars: numeric('total_group_spending_dollars'),
  avgExpenseDollars: numeric('avg_expense_dollars'),
  firstExpenseDate: date('first_expense_date'),
  lastExpenseDate: date('last_expense_date'),
}).as(
  sql`SELECT eg.id AS group_id, eg.name AS group_name, eg.created_at::date AS group_created_date, count(DISTINCT e.id) AS total_expenses, round(sum(e.amount + e.tip_amount)::numeric / 100.0, 2) AS total_group_spending_dollars, round(avg(e.amount + e.tip_amount) / 100.0, 2) AS avg_expense_dollars, min(e.created_at)::date AS first_expense_date, max(e.created_at)::date AS last_expense_date FROM expense_groups eg LEFT JOIN expenses e ON eg.id = e.group_id GROUP BY eg.id, eg.name, eg.created_at ORDER BY (round(sum(e.amount + e.tip_amount)::numeric / 100.0, 2)) DESC`
);

export const userPayerSummaryForAnalysis = pgView('user_payer_summary_for_analysis', {
  userId: uuid('user_id'),
  username: varchar({ length: 255 }),
  firstName: varchar('first_name', { length: 255 }),
  lastName: varchar('last_name', { length: 255 }),
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  expensesCreated: bigint('expenses_created', { mode: 'number' }),
  totalPaidDollars: numeric('total_paid_dollars'),
  avgExpenseDollars: numeric('avg_expense_dollars'),
  totalTipsPaidDollars: numeric('total_tips_paid_dollars'),
  firstExpenseDate: date('first_expense_date'),
  lastExpenseDate: date('last_expense_date'),
}).as(
  sql`SELECT h.id AS user_id, c.username, h.first_name, h.last_name, count(DISTINCT e.id) AS expenses_created, round(sum(e.amount + e.tip_amount)::numeric / 100.0, 2) AS total_paid_dollars, round(avg(e.amount + e.tip_amount) / 100.0, 2) AS avg_expense_dollars, round(sum(e.tip_amount)::numeric / 100.0, 2) AS total_tips_paid_dollars, min(e.created_at)::date AS first_expense_date, max(e.created_at)::date AS last_expense_date FROM humans h LEFT JOIN customers c ON h.id = c.human_id LEFT JOIN expenses e ON h.id = e.paid_by WHERE e.id IS NOT NULL GROUP BY h.id, c.username, h.first_name, h.last_name ORDER BY (round(sum(e.amount + e.tip_amount)::numeric / 100.0, 2)) DESC`
);

export const userParticipantSummaryForAnalysis = pgView('user_participant_summary_for_analysis', {
  userId: uuid('user_id'),
  username: varchar({ length: 255 }),
  firstName: varchar('first_name', { length: 255 }),
  lastName: varchar('last_name', { length: 255 }),
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  expensesInvolvedIn: bigint('expenses_involved_in', { mode: 'number' }),
  totalOwedDollars: numeric('total_owed_dollars'),
  avgSplitDollars: numeric('avg_split_dollars'),
}).as(
  sql`SELECT h.id AS user_id, c.username, h.first_name, h.last_name, count(DISTINCT es.expense_id) AS expenses_involved_in, round(sum(es.amount)::numeric / 100.0, 2) AS total_owed_dollars, round(avg(es.amount) / 100.0, 2) AS avg_split_dollars FROM humans h LEFT JOIN customers c ON h.id = c.human_id LEFT JOIN expense_splits es ON h.id = es.user_id WHERE es.id IS NOT NULL GROUP BY h.id, c.username, h.first_name, h.last_name ORDER BY (round(sum(es.amount)::numeric / 100.0, 2)) DESC`
);

export const eventsSummaryForAnalysis = pgView('events_summary_for_analysis', {
  eventId: uuid('event_id'),
  eventName: varchar('event_name', { length: 255 }),
  eventType: varchar('event_type', { length: 50 }),
  status: varchar({ length: 50 }),
  currency: varchar({ length: 3 }),
  startDate: date('start_date'),
  endDate: date('end_date'),
  durationDays: interval('duration_days'),
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  totalExpenses: bigint('total_expenses', { mode: 'number' }),
  totalSpendingDollars: numeric('total_spending_dollars'),
  avgExpenseDollars: numeric('avg_expense_dollars'),
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  uniquePayers: bigint('unique_payers', { mode: 'number' }),
}).as(
  sql`SELECT ev.id AS event_id, ev.title AS event_name, ev.type AS event_type, ev.status, ev.currency, ev.start_time::date AS start_date, ev.end_time::date AS end_date, ev.end_time - ev.start_time AS duration_days, count(DISTINCT e.id) AS total_expenses, round(sum(e.amount + e.tip_amount)::numeric / 100.0, 2) AS total_spending_dollars, round(avg(e.amount + e.tip_amount) / 100.0, 2) AS avg_expense_dollars, count(DISTINCT e.paid_by) AS unique_payers FROM events ev LEFT JOIN expenses e ON ev.id = e.event_id GROUP BY ev.id, ev.title, ev.type, ev.status, ev.currency, ev.start_time, ev.end_time ORDER BY ev.created_at DESC`
);

// 9. PAYERS TABLE
export const payers = pgTable('payers', {
  id: uuid('id').primaryKey().defaultRandom(),
  humanId: uuid('human_id').notNull().references(() => humans.id, { onDelete: 'cascade' }),
  username: varchar('username', { length: 255 }).notNull().unique(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  humanIdx: index('payers_human_idx').on(table.humanId),
}));

// 9. PAYEES TABLE
export const payees = pgTable('payees', {
  id: uuid('id').primaryKey().defaultRandom(),
  humanId: uuid('human_id').notNull().references(() => humans.id, { onDelete: 'cascade' }),
  username: varchar('username', { length: 255 }).notNull().unique(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  humanIdx: index('payees_human_idx').on(table.humanId),
}));

export const payersRelations = relations(payers, ({ one }) => ({
  human: one(humans, { fields: [payers.humanId], references: [humans.id] }),
}));

export const payeesRelations = relations(payees, ({ one }) => ({
  human: one(humans, { fields: [payees.humanId], references: [humans.id] }),
}));

// Password reset tokens - for forgot password workflow
export const passwordResetTokens = pgTable(
  'password_reset_tokens',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    customerId: uuid('customer_id')
      .notNull()
      .references(() => customers.id, { onDelete: 'cascade' }),
    email: varchar('email', { length: 255 }).notNull(),
    token: text('token').notNull().unique(),
    expiresAt: timestamp('expires_at').notNull(),
    usedAt: timestamp('used_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    customerIdx: index('pwd_reset_tokens_customer_idx').on(table.customerId),
    emailIdx: index('pwd_reset_tokens_email_idx').on(table.email),
    tokenIdx: index('pwd_reset_tokens_token_idx').on(table.token),
  })
);

export const passwordResetTokensRelations = relations(passwordResetTokens, ({ one }) => ({
  customer: one(customers, {
    fields: [passwordResetTokens.customerId],
    references: [customers.id],
  }),
}));
