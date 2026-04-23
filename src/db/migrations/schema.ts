import { pgTable, index, uuid, varchar, date, timestamp, foreignKey, unique, integer, json, text, boolean, pgView, numeric, doublePrecision, bigint, interval } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const humans = pgTable("humans", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	firstName: varchar("first_name", { length: 255 }),
	lastName: varchar("last_name", { length: 255 }),
	dob: date(),
	gender: varchar({ length: 50 }),
	phone: varchar({ length: 20 }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("humans_name_idx").using("btree", table.firstName.asc().nullsLast().op("text_ops"), table.lastName.asc().nullsLast().op("text_ops")),
]);

export const emailHistory = pgTable("email_history", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	humanId: uuid("human_id").notNull(),
	email: varchar({ length: 255 }).notNull(),
	effectiveFrom: timestamp("effective_from", { mode: 'string' }).defaultNow().notNull(),
	effectiveTo: timestamp("effective_to", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("email_history_effective_idx").using("btree", table.effectiveFrom.asc().nullsLast().op("timestamp_ops"), table.effectiveTo.asc().nullsLast().op("timestamp_ops")),
	index("email_history_email_idx").using("btree", table.email.asc().nullsLast().op("text_ops")),
	index("email_history_human_idx").using("btree", table.humanId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.humanId],
			foreignColumns: [humans.id],
			name: "email_history_human_id_fkey"
		}).onDelete("cascade"),
	unique("email_history_unique").on(table.humanId, table.effectiveFrom),
]);

export const settlements = pgTable("settlements", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	eventId: uuid("event_id").notNull(),
	groupId: uuid("group_id"),
	fromUserId: uuid("from_user_id").notNull(),
	toUserId: uuid("to_user_id").notNull(),
	amount: integer().notNull(),
	description: varchar({ length: 500 }).default('),
	status: varchar({ length: 50 }).default('pending').notNull(),
	paymentMethod: varchar("payment_method", { length: 100 }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	completedAt: timestamp("completed_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("settlements_created_at_idx").using("btree", table.createdAt.asc().nullsLast().op("timestamp_ops")),
	index("settlements_event_idx").using("btree", table.eventId.asc().nullsLast().op("uuid_ops")),
	index("settlements_from_user_idx").using("btree", table.fromUserId.asc().nullsLast().op("uuid_ops")),
	index("settlements_status_idx").using("btree", table.status.asc().nullsLast().op("text_ops")),
	index("settlements_to_user_idx").using("btree", table.toUserId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.eventId],
			foreignColumns: [events.id],
			name: "settlements_event_id_events_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.groupId],
			foreignColumns: [expenseGroups.id],
			name: "settlements_group_id_expense_groups_id_fk"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.fromUserId],
			foreignColumns: [humans.id],
			name: "settlements_from_user_id_humans_id_fk"
		}).onDelete("restrict"),
	foreignKey({
			columns: [table.toUserId],
			foreignColumns: [humans.id],
			name: "settlements_to_user_id_humans_id_fk"
		}).onDelete("restrict"),
]);

export const activities = pgTable("activities", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	eventId: uuid("event_id"),
	title: varchar({ length: 255 }).notNull(),
	locationName: varchar("location_name", { length: 255 }),
	sequenceOrder: integer("sequence_order").default(0),
	startTime: timestamp("start_time", { withTimezone: true, mode: 'string' }),
	endTime: timestamp("end_time", { withTimezone: true, mode: 'string' }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	metadata: json().default({}),
}, (table) => [
	index("idx_activities_event_id").using("btree", table.eventId.asc().nullsLast().op("uuid_ops")),
	index("idx_activities_start_time").using("btree", table.startTime.asc().nullsLast().op("timestamptz_ops")),
]);

export const users = pgTable("users", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	email: varchar({ length: 255 }).notNull(),
	username: varchar({ length: 255 }).notNull(),
	passwordHash: text("password_hash").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("email_idx").using("btree", table.email.asc().nullsLast().op("text_ops")),
	unique("users_email_unique").on(table.email),
]);

export const expenseGroups = pgTable("expense_groups", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: varchar({ length: 255 }).notNull(),
	createdBy: uuid("created_by").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("groups_created_by_idx").using("btree", table.createdBy.asc().nullsLast().op("uuid_ops")),
]);

export const groupMembers = pgTable("group_members", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	groupId: uuid("group_id").notNull(),
	userId: uuid("user_id").notNull(),
	invitedAt: timestamp("invited_at", { mode: 'string' }).defaultNow().notNull(),
	joinedAt: timestamp("joined_at", { mode: 'string' }),
	groupRoleId: uuid("group_role_id"),
}, (table) => [
	index("group_members_group_user_idx").using("btree", table.groupId.asc().nullsLast().op("uuid_ops"), table.userId.asc().nullsLast().op("uuid_ops")),
]);

export const events = pgTable("events", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	creatorId: uuid("creator_id").notNull(),
	title: varchar({ length: 255 }).notNull(),
	description: text(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	location: varchar({ length: 255 }),
	currency: varchar({ length: 3 }).default('USD'),
	budgetCents: integer("budget_cents"),
	groupId: uuid("group_id"),
	type: varchar({ length: 50 }).default('general').notNull(),
	status: varchar({ length: 50 }).default('scheduled'),
	timezone: varchar({ length: 50 }).default('UTC'),
	isVirtual: boolean("is_virtual").default(false),
	venueId: uuid("venue_id"),
	isPublic: boolean("is_public").default(true),
	metadata: json().default({}),
	startTime: timestamp("start_time", { withTimezone: true, mode: 'string' }).notNull(),
	endTime: timestamp("end_time", { withTimezone: true, mode: 'string' }),
}, (table) => [
	index("idx_events_start_time").using("btree", table.startTime.asc().nullsLast().op("timestamptz_ops")),
	index("idx_events_status").using("btree", table.status.asc().nullsLast().op("text_ops")),
]);

export const expenseSplits = pgTable("expense_splits", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	expenseId: uuid("expense_id").notNull(),
	userId: uuid("user_id").notNull(),
	amount: integer().notNull(),
}, (table) => [
	index("splits_expense_idx").using("btree", table.expenseId.asc().nullsLast().op("uuid_ops")),
	index("splits_user_idx").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
]);

export const customers = pgTable("customers", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	humanId: uuid("human_id").notNull(),
	username: varchar({ length: 255 }).notNull(),
	passwordHash: text("password_hash").notNull(),
	loyaltyPoints: integer("loyalty_points").default(0),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	emailVerified: boolean("email_verified").default(false).notNull(),
}, (table) => [
	index("customers_human_idx").using("btree", table.humanId.asc().nullsLast().op("uuid_ops")),
	index("customers_username_idx").using("btree", table.username.asc().nullsLast().op("text_ops")),
]);

export const permissions = pgTable("permissions", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	permissionName: varchar("permission_name", { length: 100 }).notNull(),
	resource: varchar({ length: 100 }).notNull(),
	action: varchar({ length: 100 }).notNull(),
	description: text(),
	isActive: boolean("is_active").default(true).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
});

export const pendingGroupInvitations = pgTable("pending_group_invitations", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	groupId: uuid("group_id").notNull(),
	email: varchar({ length: 255 }).notNull(),
	invitedBy: uuid("invited_by").notNull(),
	status: varchar({ length: 50 }).default('pending').notNull(),
	invitedAt: timestamp("invited_at", { mode: 'string' }).defaultNow().notNull(),
	expiresAt: timestamp("expires_at", { mode: 'string' }),
	acceptedAt: timestamp("accepted_at", { mode: 'string' }),
}, (table) => [
	index("pending_invitations_group_email_idx").using("btree", table.groupId.asc().nullsLast().op("text_ops"), table.email.asc().nullsLast().op("text_ops")),
	index("pending_invitations_status_idx").using("btree", table.status.asc().nullsLast().op("text_ops")),
]);

export const humanSystemRoles = pgTable("human_system_roles", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	humanId: uuid("human_id").notNull(),
	systemRoleId: uuid("system_role_id").notNull(),
	assignedBy: uuid("assigned_by"),
	assignedAt: timestamp("assigned_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_human_system_roles_human_id").using("btree", table.humanId.asc().nullsLast().op("uuid_ops")),
	index("idx_human_system_roles_role_id").using("btree", table.systemRoleId.asc().nullsLast().op("uuid_ops")),
]);

export const sessions = pgTable("sessions", {
	id: text().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	expiresAt: timestamp("expires_at", { mode: 'string' }).notNull(),
}, (table) => [
	index("sessions_expires_at_idx").using("btree", table.expiresAt.asc().nullsLast().op("timestamp_ops")),
	index("sessions_user_id_idx").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
]);

export const systemRoles = pgTable("system_roles", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: varchar({ length: 50 }).notNull(),
	description: text(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
});

export const groupRoles = pgTable("group_roles", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: varchar({ length: 50 }).notNull(),
	description: text(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
});

export const groupRolePermissions = pgTable("group_role_permissions", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	groupRoleId: uuid("group_role_id").notNull(),
	permissionId: uuid("permission_id").notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
});

export const expenses = pgTable("expenses", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	groupId: uuid("group_id"),
	activityId: uuid("activity_id"),
	paidBy: uuid("paid_by").notNull(),
	amount: integer().notNull(),
	description: varchar({ length: 255 }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	tipAmount: integer("tip_amount").default(sql`'0'`).notNull(),
	eventId: uuid("event_id"),
	category: varchar({ length: 50 }).default('misc'),
	metadata: json().default({}),
}, (table) => [
	foreignKey({
			columns: [table.eventId],
			foreignColumns: [events.id],
			name: "expenses_event_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.activityId],
			foreignColumns: [activities.id],
			name: "expenses_activity_id_fk"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.paidBy],
			foreignColumns: [humans.id],
			name: "expenses_paid_by_fk"
		}).onDelete("restrict"),
	foreignKey({
			columns: [table.groupId],
			foreignColumns: [expenseGroups.id],
			name: "expenses_group_id_fk"
		}).onDelete("set null"),
]);
export const expenseSummaryForAnalysis = pgView("expense_summary_for_analysis", {	expenseId: uuid("expense_id"),
	eventId: uuid("event_id"),
	activityId: uuid("activity_id"),
	groupId: uuid("group_id"),
	amountDollars: numeric("amount_dollars"),
	tipDollars: numeric("tip_dollars"),
	totalDollars: numeric("total_dollars"),
	category: varchar({ length: 50 }),
	description: varchar({ length: 255 }),
	payerId: uuid("payer_id"),
	payerUsername: varchar("payer_username", { length: 255 }),
	payerDisplayName: text("payer_display_name"),
	expenseDate: date("expense_date"),
	expenseYear: doublePrecision("expense_year"),
	expenseMonth: doublePrecision("expense_month"),
	expenseWeek: doublePrecision("expense_week"),
	monthYear: text("month_year"),
	createdAt: timestamp("created_at", { mode: 'string' }),
}).as(sql`SELECT e.id AS expense_id, e.event_id, e.activity_id, e.group_id, round(e.amount::numeric / 100.0, 2) AS amount_dollars, round(e.tip_amount::numeric / 100.0, 2) AS tip_dollars, round((e.amount + e.tip_amount)::numeric / 100.0, 2) AS total_dollars, e.category, e.description, e.paid_by AS payer_id, c_payer.username AS payer_username, (h_payer.first_name::text || ' '::text) || h_payer.last_name::text AS payer_display_name, e.created_at::date AS expense_date, date_part('year'::text, e.created_at) AS expense_year, date_part('month'::text, e.created_at) AS expense_month, date_part('week'::text, e.created_at) AS expense_week, to_char(e.created_at, 'YYYY-MM'::text) AS month_year, e.created_at FROM expenses e LEFT JOIN humans h_payer ON e.paid_by = h_payer.id LEFT JOIN customers c_payer ON h_payer.id = c_payer.human_id ORDER BY e.created_at DESC`);

export const expenseSplitsForAnalysis = pgView("expense_splits_for_analysis", {	splitId: uuid("split_id"),
	expenseId: uuid("expense_id"),
	userId: uuid("user_id"),
	userUsername: varchar("user_username", { length: 255 }),
	userDisplayName: text("user_display_name"),
	splitDollars: numeric("split_dollars"),
	paidByUserId: uuid("paid_by_user_id"),
	payerUsername: varchar("payer_username", { length: 255 }),
	payerDisplayName: text("payer_display_name"),
	amountOwedDollars: numeric("amount_owed_dollars"),
}).as(sql`SELECT es.id AS split_id, es.expense_id, es.user_id, c_user.username AS user_username, (h_user.first_name::text || ' '::text) || h_user.last_name::text AS user_display_name, round(es.amount::numeric / 100.0, 2) AS split_dollars, e.paid_by AS paid_by_user_id, c_payer.username AS payer_username, (h_payer.first_name::text || ' '::text) || h_payer.last_name::text AS payer_display_name, round(es.amount::numeric / 100.0, 2) AS amount_owed_dollars FROM expense_splits es JOIN expenses e ON es.expense_id = e.id LEFT JOIN humans h_user ON es.user_id = h_user.id LEFT JOIN customers c_user ON h_user.id = c_user.human_id LEFT JOIN humans h_payer ON e.paid_by = h_payer.id LEFT JOIN customers c_payer ON h_payer.id = c_payer.human_id ORDER BY es.id DESC`);

export const dailySpendingTrendForAnalysis = pgView("daily_spending_trend_for_analysis", {	expenseDate: date("expense_date"),
	year: integer(),
	month: integer(),
	week: integer(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	expenseCount: bigint("expense_count", { mode: "number" }),
	subtotalDollars: numeric("subtotal_dollars"),
	totalTipsDollars: numeric("total_tips_dollars"),
	dailyTotalDollars: numeric("daily_total_dollars"),
	avgExpenseDollars: numeric("avg_expense_dollars"),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	uniquePayers: bigint("unique_payers", { mode: "number" }),
}).as(sql`SELECT created_at::date AS expense_date, date_part('year'::text, created_at)::integer AS year, date_part('month'::text, created_at)::integer AS month, date_part('week'::text, created_at)::integer AS week, count(*) AS expense_count, round(sum(amount)::numeric / 100.0, 2) AS subtotal_dollars, round(sum(tip_amount)::numeric / 100.0, 2) AS total_tips_dollars, round(sum(amount + tip_amount)::numeric / 100.0, 2) AS daily_total_dollars, round(avg(amount + tip_amount) / 100.0, 2) AS avg_expense_dollars, count(DISTINCT paid_by) AS unique_payers FROM expenses e GROUP BY (created_at::date), (date_part('year'::text, created_at)), (date_part('month'::text, created_at)), (date_part('week'::text, created_at)) ORDER BY (created_at::date) DESC`);

export const categorySpendingForAnalysis = pgView("category_spending_for_analysis", {	category: varchar({ length: 50 }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	expenseCount: bigint("expense_count", { mode: "number" }),
	subtotalDollars: numeric("subtotal_dollars"),
	totalTipsDollars: numeric("total_tips_dollars"),
	totalDollars: numeric("total_dollars"),
	avgExpenseDollars: numeric("avg_expense_dollars"),
	maxExpenseDollars: numeric("max_expense_dollars"),
	minExpenseDollars: numeric("min_expense_dollars"),
}).as(sql`SELECT category, count(*) AS expense_count, round(sum(amount)::numeric / 100.0, 2) AS subtotal_dollars, round(sum(tip_amount)::numeric / 100.0, 2) AS total_tips_dollars, round(sum(amount + tip_amount)::numeric / 100.0, 2) AS total_dollars, round(avg(amount + tip_amount) / 100.0, 2) AS avg_expense_dollars, round(max(amount)::numeric / 100.0, 2) AS max_expense_dollars, round(min(amount)::numeric / 100.0, 2) AS min_expense_dollars FROM expenses e WHERE category IS NOT NULL GROUP BY category ORDER BY (round(sum(amount + tip_amount)::numeric / 100.0, 2)) DESC`);

export const groupSpendingForAnalysis = pgView("group_spending_for_analysis", {	groupId: uuid("group_id"),
	groupName: varchar("group_name", { length: 255 }),
	groupCreatedDate: date("group_created_date"),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	totalExpenses: bigint("total_expenses", { mode: "number" }),
	totalGroupSpendingDollars: numeric("total_group_spending_dollars"),
	avgExpenseDollars: numeric("avg_expense_dollars"),
	firstExpenseDate: date("first_expense_date"),
	lastExpenseDate: date("last_expense_date"),
}).as(sql`SELECT eg.id AS group_id, eg.name AS group_name, eg.created_at::date AS group_created_date, count(DISTINCT e.id) AS total_expenses, round(sum(e.amount + e.tip_amount)::numeric / 100.0, 2) AS total_group_spending_dollars, round(avg(e.amount + e.tip_amount) / 100.0, 2) AS avg_expense_dollars, min(e.created_at)::date AS first_expense_date, max(e.created_at)::date AS last_expense_date FROM expense_groups eg LEFT JOIN expenses e ON eg.id = e.group_id GROUP BY eg.id, eg.name, eg.created_at ORDER BY (round(sum(e.amount + e.tip_amount)::numeric / 100.0, 2)) DESC`);

export const userPayerSummaryForAnalysis = pgView("user_payer_summary_for_analysis", {	userId: uuid("user_id"),
	username: varchar({ length: 255 }),
	firstName: varchar("first_name", { length: 255 }),
	lastName: varchar("last_name", { length: 255 }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	expensesCreated: bigint("expenses_created", { mode: "number" }),
	totalPaidDollars: numeric("total_paid_dollars"),
	avgExpenseDollars: numeric("avg_expense_dollars"),
	totalTipsPaidDollars: numeric("total_tips_paid_dollars"),
	firstExpenseDate: date("first_expense_date"),
	lastExpenseDate: date("last_expense_date"),
}).as(sql`SELECT h.id AS user_id, c.username, h.first_name, h.last_name, count(DISTINCT e.id) AS expenses_created, round(sum(e.amount + e.tip_amount)::numeric / 100.0, 2) AS total_paid_dollars, round(avg(e.amount + e.tip_amount) / 100.0, 2) AS avg_expense_dollars, round(sum(e.tip_amount)::numeric / 100.0, 2) AS total_tips_paid_dollars, min(e.created_at)::date AS first_expense_date, max(e.created_at)::date AS last_expense_date FROM humans h LEFT JOIN customers c ON h.id = c.human_id LEFT JOIN expenses e ON h.id = e.paid_by WHERE e.id IS NOT NULL GROUP BY h.id, c.username, h.first_name, h.last_name ORDER BY (round(sum(e.amount + e.tip_amount)::numeric / 100.0, 2)) DESC`);

export const userParticipantSummaryForAnalysis = pgView("user_participant_summary_for_analysis", {	userId: uuid("user_id"),
	username: varchar({ length: 255 }),
	firstName: varchar("first_name", { length: 255 }),
	lastName: varchar("last_name", { length: 255 }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	expensesInvolvedIn: bigint("expenses_involved_in", { mode: "number" }),
	totalOwedDollars: numeric("total_owed_dollars"),
	avgSplitDollars: numeric("avg_split_dollars"),
}).as(sql`SELECT h.id AS user_id, c.username, h.first_name, h.last_name, count(DISTINCT es.expense_id) AS expenses_involved_in, round(sum(es.amount)::numeric / 100.0, 2) AS total_owed_dollars, round(avg(es.amount) / 100.0, 2) AS avg_split_dollars FROM humans h LEFT JOIN customers c ON h.id = c.human_id LEFT JOIN expense_splits es ON h.id = es.user_id WHERE es.id IS NOT NULL GROUP BY h.id, c.username, h.first_name, h.last_name ORDER BY (round(sum(es.amount)::numeric / 100.0, 2)) DESC`);

export const eventsSummaryForAnalysis = pgView("events_summary_for_analysis", {	eventId: uuid("event_id"),
	eventName: varchar("event_name", { length: 255 }),
	eventType: varchar("event_type", { length: 50 }),
	status: varchar({ length: 50 }),
	currency: varchar({ length: 3 }),
	startDate: date("start_date"),
	endDate: date("end_date"),
	durationDays: interval("duration_days"),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	totalExpenses: bigint("total_expenses", { mode: "number" }),
	totalSpendingDollars: numeric("total_spending_dollars"),
	avgExpenseDollars: numeric("avg_expense_dollars"),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	uniquePayers: bigint("unique_payers", { mode: "number" }),
}).as(sql`SELECT ev.id AS event_id, ev.title AS event_name, ev.type AS event_type, ev.status, ev.currency, ev.start_time::date AS start_date, ev.end_time::date AS end_date, ev.end_time - ev.start_time AS duration_days, count(DISTINCT e.id) AS total_expenses, round(sum(e.amount + e.tip_amount)::numeric / 100.0, 2) AS total_spending_dollars, round(avg(e.amount + e.tip_amount) / 100.0, 2) AS avg_expense_dollars, count(DISTINCT e.paid_by) AS unique_payers FROM events ev LEFT JOIN expenses e ON ev.id = e.event_id GROUP BY ev.id, ev.title, ev.type, ev.status, ev.currency, ev.start_time, ev.end_time ORDER BY ev.created_at DESC`);