import { pgTable, text, timestamp, uuid, varchar, integer, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Users table
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
      .references(() => users.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 255 }).notNull(),
    description: text('description'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    creatorIdx: index('events_creator_idx').on(table.creatorId),
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
    name: varchar('name', { length: 255 }).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    eventIdx: index('activities_event_idx').on(table.eventId),
  })
);

// Expense groups - the group that shares expenses
export const expenseGroups = pgTable(
  'expense_groups',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 255 }).notNull(),
    createdBy: uuid('created_by')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
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
      .references(() => users.id, { onDelete: 'cascade' }),
    invitedAt: timestamp('invited_at').defaultNow().notNull(),
    joinedAt: timestamp('joined_at'),
  },
  (table) => ({
    groupUserIdx: index('group_members_group_user_idx').on(table.groupId, table.userId),
  })
);

// Expenses - tracks who paid and how much
export const expenses = pgTable(
  'expenses',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    groupId: uuid('group_id')
      .notNull()
      .references(() => expenseGroups.id, { onDelete: 'cascade' }),
    activityId: uuid('activity_id').references(() => activities.id, { onDelete: 'set null' }),
    paidBy: uuid('paid_by')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    amount: integer('amount').notNull(), // in cents
    description: varchar('description', { length: 255 }).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    groupIdx: index('expenses_group_idx').on(table.groupId),
    paidByIdx: index('expenses_paid_by_idx').on(table.paidBy),
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
      .references(() => users.id, { onDelete: 'cascade' }),
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
      .references(() => users.id, { onDelete: 'cascade' }),
    expiresAt: timestamp('expires_at').notNull(),
  },
  (table) => ({
    userIdIdx: index('sessions_user_id_idx').on(table.userId),
    expiresAtIdx: index('sessions_expires_at_idx').on(table.expiresAt),
  })
);

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  events: many(events),
  expenseGroups: many(expenseGroups),
  groupMemberships: many(groupMembers),
  expenses: many(expenses),
  sessions: many(sessions),
}));

export const eventsRelations = relations(events, ({ one, many }) => ({
  creator: one(users, {
    fields: [events.creatorId],
    references: [users.id],
  }),
  activities: many(activities),
}));

export const activitiesRelations = relations(activities, ({ one, many }) => ({
  event: one(events, {
    fields: [activities.eventId],
    references: [events.id],
  }),
  expenses: many(expenses),
}));

export const expenseGroupsRelations = relations(expenseGroups, ({ one, many }) => ({
  creator: one(users, {
    fields: [expenseGroups.createdBy],
    references: [users.id],
  }),
  members: many(groupMembers),
  expenses: many(expenses),
}));

export const groupMembersRelations = relations(groupMembers, ({ one }) => ({
  group: one(expenseGroups, {
    fields: [groupMembers.groupId],
    references: [expenseGroups.id],
  }),
  user: one(users, {
    fields: [groupMembers.userId],
    references: [users.id],
  }),
}));

export const expensesRelations = relations(expenses, ({ one, many }) => ({
  group: one(expenseGroups, {
    fields: [expenses.groupId],
    references: [expenseGroups.id],
  }),
  activity: one(activities, {
    fields: [expenses.activityId],
    references: [activities.id],
  }),
  payer: one(users, {
    fields: [expenses.paidBy],
    references: [users.id],
  }),
  splits: many(expenseSplits),
}));

export const expenseSplitsRelations = relations(expenseSplits, ({ one }) => ({
  expense: one(expenses, {
    fields: [expenseSplits.expenseId],
    references: [expenses.id],
  }),
  user: one(users, {
    fields: [expenseSplits.userId],
    references: [users.id],
  }),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));
