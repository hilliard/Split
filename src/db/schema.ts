import { pgTable, text, timestamp, uuid, varchar, integer, index, boolean, decimal, json, date } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

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
    passwordHash: text('password_hash').notNull(),
    loyaltyPoints: integer('loyalty_points').default(0),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    humanIdx: index('customers_human_idx').on(table.humanId),
    usernameIdx: index('customers_username_idx').on(table.username),
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
    metadata: json('metadata').$type<Record<string, unknown>>().default({} as any),
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
    eventId: uuid('event_id')
      .notNull()
      .references(() => events.id, { onDelete: 'cascade' }),
    title: varchar('title', { length: 255 }).notNull(),
    startTime: timestamp('start_time', { withTimezone: true }),
    endTime: timestamp('end_time', { withTimezone: true }),
    locationName: varchar('location_name', { length: 255 }),
    sequenceOrder: integer('sequence_order').default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    eventIdx: index('idx_activities_event_id').on(table.eventId),
    startTimeIdx: index('idx_activities_start_time').on(table.startTime),
  })
);

// Expenses table - tracks money spent on activities/events
export const expenses = pgTable(
  'expenses',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    eventId: uuid('event_id')
      .notNull()
      .references(() => events.id, { onDelete: 'cascade' }),
    activityId: uuid('activity_id').references(() => activities.id, { onDelete: 'set null' }),
    amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
    category: varchar('category', { length: 50 }).notNull(),
    description: text('description'),
    paidBy: uuid('paid_by').references(() => humans.id, { onDelete: 'restrict' }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    eventIdx: index('idx_expenses_event_id').on(table.eventId),
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
    invitedAt: timestamp('invited_at').defaultNow().notNull(),
    joinedAt: timestamp('joined_at'),
  },
  (table) => ({
    groupUserIdx: index('group_members_group_user_idx').on(table.groupId, table.userId),
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

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(humans, {
    fields: [sessions.userId],
    references: [humans.id],
  }),
}));
