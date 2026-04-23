import { relations } from 'drizzle-orm/relations';
import {
  humans,
  emailHistory,
  events,
  settlements,
  expenseGroups,
  expenses,
  activities,
} from './schema';

export const emailHistoryRelations = relations(emailHistory, ({ one }) => ({
  human: one(humans, {
    fields: [emailHistory.humanId],
    references: [humans.id],
  }),
}));

export const humansRelations = relations(humans, ({ many }) => ({
  emailHistories: many(emailHistory),
  settlements_fromUserId: many(settlements, {
    relationName: 'settlements_fromUserId_humans_id',
  }),
  settlements_toUserId: many(settlements, {
    relationName: 'settlements_toUserId_humans_id',
  }),
  expenses: many(expenses),
}));

export const settlementsRelations = relations(settlements, ({ one }) => ({
  event: one(events, {
    fields: [settlements.eventId],
    references: [events.id],
  }),
  expenseGroup: one(expenseGroups, {
    fields: [settlements.groupId],
    references: [expenseGroups.id],
  }),
  human_fromUserId: one(humans, {
    fields: [settlements.fromUserId],
    references: [humans.id],
    relationName: 'settlements_fromUserId_humans_id',
  }),
  human_toUserId: one(humans, {
    fields: [settlements.toUserId],
    references: [humans.id],
    relationName: 'settlements_toUserId_humans_id',
  }),
}));

export const eventsRelations = relations(events, ({ many }) => ({
  settlements: many(settlements),
  expenses: many(expenses),
}));

export const expenseGroupsRelations = relations(expenseGroups, ({ many }) => ({
  settlements: many(settlements),
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
  human: one(humans, {
    fields: [expenses.paidBy],
    references: [humans.id],
  }),
  expenseGroup: one(expenseGroups, {
    fields: [expenses.groupId],
    references: [expenseGroups.id],
  }),
}));

export const activitiesRelations = relations(activities, ({ many }) => ({
  expenses: many(expenses),
}));
