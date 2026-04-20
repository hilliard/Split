# Split Database - Complete Data Dictionary & Schema Reference

## Overview

This database stores expense-sharing data for events, groups, and individuals. **All monetary values are stored as INTEGER cents** to ensure consistency and portability.

---

## Tables

### 🏠 `humans`

**Purpose**: Core user identity records

| Column      | Type      | Unit | Description                  | Notes                 |
| ----------- | --------- | ---- | ---------------------------- | --------------------- |
| `id`        | UUID      | -    | Primary key, user identifier | Generated on creation |
| `firstName` | VARCHAR   | -    | Given name                   | User profile          |
| `lastName`  | VARCHAR   | -    | Surname                      | User profile          |
| `email`     | VARCHAR   | -    | Email address                | May be null           |
| `createdAt` | TIMESTAMP | -    | Account creation date        | Timezone aware        |

**Example Query for Analysis:**

```sql
SELECT
  h.id,
  CONCAT(h.firstName, ' ', h.lastName) AS full_name,
  COUNT(DISTINCT e.id) AS expense_count,
  SUM(e.amount) / 100.0 AS total_paid_dollars
FROM humans h
LEFT JOIN expenses e ON h.id = e.paid_by
GROUP BY h.id, h.firstName, h.lastName
ORDER BY total_paid_dollars DESC;
```

---

### 👥 `customers`

**Purpose**: User account records (maps human to app account)

| Column         | Type      | Unit | Description                | Notes                         |
| -------------- | --------- | ---- | -------------------------- | ----------------------------- |
| `id`           | UUID      | -    | Primary key                |                               |
| `humanId`      | UUID FK   | -    | Foreign key to `humans.id` | One-to-one relationship       |
| `username`     | VARCHAR   | -    | App username               | **UNIQUE** - use for analysis |
| `passwordHash` | VARCHAR   | -    | Bcrypt hash                | Never export!                 |
| `createdAt`    | TIMESTAMP | -    | Account creation           | Timezone aware                |

**⚠️ Critical for Analysis**: The `username` field is **UNIQUE** and should be the primary identifier for data merges and external integrations. While humans can share first/last names, usernames are guaranteed unique. All analytical views include both username and display names.

**Example - Safe Data Merge:**

```sql
-- ❌ RISKY: Multiple users could have same name
SELECT DISTINCT h.first_name, h.last_name FROM humans h;

-- ✅ SAFE: Username is unique
SELECT DISTINCT c.username FROM customers c;

-- ✅ Best for analysis: Join on username + human ID combo
SELECT c.username, h.first_name, h.last_name
FROM customers c
JOIN humans h ON c.human_id = h.id;
```

---

### 📅 `events`

**Purpose**: Expense tracking events/trips (e.g., "Summer Trip to Hawaii", "Apartment Rent Split")

| Column        | Type      | Unit  | Description                       | Notes                                   |
| ------------- | --------- | ----- | --------------------------------- | --------------------------------------- |
| `id`          | UUID      | -     | Primary key                       |                                         |
| `creatorId`   | UUID FK   | -     | Foreign key to `humans.id`        | Who created the event                   |
| `groupId`     | UUID FK   | -     | Foreign key to `expenseGroups.id` | Which group shares this                 |
| `title`       | VARCHAR   | -     | Event name                        | "Trip to Iceland", etc.                 |
| `description` | TEXT      | -     | Event details                     | Optional narrative                      |
| `type`        | VARCHAR   | -     | Event category                    | "trip", "general", "rental", etc.       |
| `status`      | VARCHAR   | -     | Current status                    | "scheduled", "active", "completed"      |
| `startTime`   | TIMESTAMP | -     | Event start                       | Timezone aware                          |
| `endTime`     | TIMESTAMP | -     | Event end                         | Timezone aware                          |
| `timezone`    | VARCHAR   | -     | Timezone identifier               | "UTC", "America/New_York", etc.         |
| `isVirtual`   | BOOLEAN   | -     | Is online?                        | If false, assumes in-person             |
| `isPublic`    | BOOLEAN   | -     | Visibility                        | Public vs private event                 |
| `currency`    | VARCHAR   | -     | Currency code                     | "USD", "EUR", "GBP", etc.               |
| `budgetCents` | INTEGER   | cents | Optional spending limit           | $100.00 = 10000 cents, NULL if no limit |
| `createdAt`   | TIMESTAMP | -     | Created date                      | Timezone aware                          |

**Example Query:**

```sql
SELECT
  title,
  currency,
  budgetCents / 100.0 AS budget_dollars,
  COUNT(ex.id) AS expense_count,
  SUM(ex.amount + ex.tip_amount) / 100.0 AS total_spent_dollars,
  CASE
    WHEN budgetCents > 0 THEN ROUND((SUM(ex.amount + ex.tip_amount)::FLOAT / budgetCents) * 100, 1)
    ELSE NULL
  END AS budget_percent_used
FROM events e
LEFT JOIN expenses ex ON e.id = ex.event_id
GROUP BY e.id, e.title, e.currency, e.budgetCents;
```

---

### 💰 `expenses`

**Purpose**: Individual transactions within events

| Column        | Type      | Unit  | Description                       | Notes                                               |
| ------------- | --------- | ----- | --------------------------------- | --------------------------------------------------- |
| `id`          | UUID      | -     | Primary key                       |                                                     |
| `eventId`     | UUID FK   | cents | Foreign key to `events.id`        | Which event this belongs to                         |
| `groupId`     | UUID FK   | -     | Foreign key to `expenseGroups.id` | Which group is splitting this                       |
| `activityId`  | UUID FK   | -     | Foreign key to `activities.id`    | Optional: which activity within event               |
| `amount`      | INTEGER   | cents | Cost of the expense               | $50.00 = 5000 cents. **ALWAYS IN CENTS**            |
| `tipAmount`   | INTEGER   | cents | Tip/gratuity amount               | $2.50 = 250 cents. **NOW STANDARDIZED TO CENTS** ✅ |
| `category`    | VARCHAR   | -     | Expense type                      | "food", "transport", "lodging", "misc", etc.        |
| `description` | VARCHAR   | -     | What was purchased                | "Flight + hotel", "Dinner at Mario's", etc.         |
| `paidBy`      | UUID FK   | -     | Foreign key to `humans.id`        | Who paid out of pocket                              |
| `createdAt`   | TIMESTAMP | -     | When recorded                     | Timezone aware                                      |

**Total Expense Calculation:**

```
totalCents = amount + tipAmount
totalDollars = totalCents / 100.0
```

**Example Query:**

```sql
SELECT
  e.description,
  e.amount / 100.0 AS amount_dollars,
  e.tip_amount / 100.0 AS tip_dollars,
  (e.amount + e.tip_amount) / 100.0 AS total_dollars,
  e.category,
  CONCAT(h.firstName, ' ', h.lastName) AS paid_by,
  e.created_at
FROM expenses e
JOIN humans h ON e.paid_by = h.id
WHERE e.event_id = 'YOUR_EVENT_UUID'
ORDER BY e.created_at DESC;
```

---

### 👥 `expenseGroups`

**Purpose**: Groups of people who regularly split expenses

| Column      | Type      | Unit | Description                | Notes                                     |
| ----------- | --------- | ---- | -------------------------- | ----------------------------------------- |
| `id`        | UUID      | -    | Primary key                |                                           |
| `name`      | VARCHAR   | -    | Group name                 | "Apartment Sharers", "Travel Squad", etc. |
| `createdBy` | UUID FK   | -    | Foreign key to `humans.id` | Who created the group                     |
| `createdAt` | TIMESTAMP | -    | Creation date              | Timezone aware                            |

**Example Query:**

```sql
SELECT
  eg.name,
  COUNT(DISTINCT gm.user_id) AS member_count,
  COUNT(DISTINCT e.id) AS total_expenses,
  SUM(e.amount + e.tip_amount) / 100.0 AS total_group_spending
FROM expense_groups eg
LEFT JOIN group_members gm ON eg.id = gm.group_id
LEFT JOIN expenses e ON eg.id = e.group_id
GROUP BY eg.id, eg.name;
```

---

### 🤝 `groupMembers`

**Purpose**: Maps users to groups (many-to-many relationship)

| Column     | Type      | Unit | Description                       | Notes          |
| ---------- | --------- | ---- | --------------------------------- | -------------- |
| `groupId`  | UUID FK   | -    | Foreign key to `expenseGroups.id` |                |
| `userId`   | UUID FK   | -    | Foreign key to `humans.id`        |                |
| `joinedAt` | TIMESTAMP | -    | When user joined                  | Timezone aware |

**Example Query (Find all expenses for a user in a group):**

```sql
SELECT
  e.description,
  (e.amount + e.tip_amount) / 100.0 AS amount_dollars,
  h.firstName || ' ' || h.lastName AS paid_by
FROM expenses e
JOIN group_members gm ON e.group_id = gm.group_id
JOIN humans h ON e.paid_by = h.id
WHERE gm.group_id = 'GROUP_UUID'
  AND gm.user_id = 'USER_UUID'
ORDER BY e.created_at DESC;
```

---

### 📍 `activities`

**Purpose**: Sub-events within an event (e.g., individual dinners, activities, legs of a trip)

| Column        | Type      | Unit | Description                | Notes                                 |
| ------------- | --------- | ---- | -------------------------- | ------------------------------------- |
| `id`          | UUID      | -    | Primary key                |                                       |
| `eventId`     | UUID FK   | -    | Foreign key to `events.id` | Parent event                          |
| `title`       | VARCHAR   | -    | Activity name              | "Day 1 - Museum", "Dinner - Thursday" |
| `description` | TEXT      | -    | Details                    | Optional                              |
| `startTime`   | TIMESTAMP | -    | Activity start             | Timezone aware                        |
| `endTime`     | TIMESTAMP | -    | Activity end               | Timezone aware                        |
| `createdAt`   | TIMESTAMP | -    | When added                 | Timezone aware                        |

---

### 💔 `expenseSplits`

**Purpose**: How expenses are divided among group members

| Column      | Type    | Unit  | Description                  | Notes                             |
| ----------- | ------- | ----- | ---------------------------- | --------------------------------- |
| `id`        | UUID    | -     | Primary key                  |                                   |
| `expenseId` | UUID FK | -     | Foreign key to `expenses.id` | Which expense                     |
| `userId`    | UUID FK | -     | Foreign key to `humans.id`   | Who owes this portion             |
| `amount`    | INTEGER | cents | Their share                  | $12.50 = 1250 cents. **IN CENTS** |

**Example Query (Calculate who owes whom):**

```sql
SELECT
  u1.firstName || ' ' || u1.lastName AS paid_by,
  u2.firstName || ' ' || u2.lastName AS owes_to,
  SUM(es.amount) / 100.0 AS amount_owed_dollars
FROM expense_splits es
JOIN expenses e ON es.expense_id = e.id
JOIN humans u1 ON e.paid_by = u1.id
JOIN humans u2 ON es.user_id = u2.id
GROUP BY u1.id, u1.firstName, u1.lastName, u2.id, u2.firstName, u2.lastName
HAVING es.user_id != e.paid_by;  -- Don't count self
```

---

## Unit Conversion Reference

**All monetary columns are stored as INTEGER CENTS:**

| Format  | DB Value | Human Readable         |
| ------- | -------- | ---------------------- |
| $1.00   | 100      | One dollar             |
| $100.00 | 10000    | One hundred dollars    |
| $0.01   | 1        | One cent               |
| $1.50   | 150      | One dollar fifty cents |

**To convert for analysis:**

```sql
-- Cents to Dollars (for viewing)
amount / 100.0 AS amount_dollars

-- Dollars to Cents (for calculations)
amount_dollars * 100 AS amount_cents

-- Decimals (precise)
ROUND(amount / 100.0, 2) AS amount_dollars_precise
```

---

## Index Optimization

Key indexes exist for fast queries:

| Table         | Index                       | Purpose                |
| ------------- | --------------------------- | ---------------------- |
| events        | `idx_events_creator_id`     | Find events by creator |
| events        | `idx_events_group_id`       | Find events by group   |
| expenses      | `idx_expenses_event_id`     | Find expenses by event |
| expenses      | `idx_expenses_group_id`     | Find expenses by group |
| expenses      | `idx_expenses_paid_by`      | Find expenses by payer |
| group_members | `idx_group_members_user_id` | Find groups for a user |

---

## Exporting for External Analysis

### Option 1: Direct SQL Query

```sql
-- Export all expenses with UNIQUE usernames (safe for merges)
SELECT
  e.id AS expense_id,
  ev.title AS event,
  e.description,
  e.amount / 100.0 AS amount_dollars,
  e.tip_amount / 100.0 AS tip_dollars,
  (e.amount + e.tip_amount) / 100.0 AS total_dollars,
  e.category,
  c_payer.username AS payer_username,  -- ✅ UNIQUE - safe for joins
  h_payer.first_name || ' ' || h_payer.last_name AS payer_display_name,
  e.created_at
FROM expenses e
JOIN events ev ON e.event_id = ev.id
LEFT JOIN humans h_payer ON e.paid_by = h_payer.id
LEFT JOIN customers c_payer ON h_payer.id = c_payer.human_id
ORDER BY e.created_at DESC;
```

**⚠️ Always include `username`** (or `c.username`) when exporting for external analysis:

- Use `username` as the join key in external tools (Excel VLOOKUP, Tableau, Power BI, etc.)
- Display names (first_name, last_name) are for readability only
- Multiple users can have the same name, but only one can have each username

### Option 2: Use Export Scripts

See: `scripts/export-data.js` and `scripts/export-data.py`

These scripts automatically include `username` fields in all exports.

### Option 3: Query Analytical Views

All views include both unique `username` and display names:

```sql
-- ✅ Recommended: Use pre-built views that include usernames
SELECT * FROM expense_summary_for_analysis;
SELECT * FROM user_payer_summary_for_analysis;
SELECT * FROM expense_splits_for_analysis;
```

---

## Data Integrity Notes

⚠️ **Important for external analysis:**

1. **No NULL amounts**: All expense amounts are NOT NULL (enforced by schema)
2. **TipAmount standardization**: As of 2026-04-20, tipAmount is INTEGER (cents), not decimal
3. **Timezone aware**: All timestamps include timezone info
4. **Foreign keys**: Enforced with CASCADE DELETE on events (deletes associated expenses/activities)
5. **No data loss**: Deleted records are marked as deleted, not purged (soft delete pattern may be added)
6. **Use `username` as primary key**: While `first_name || ' ' || last_name` is displayed in views, **`username` is UNIQUE and should be used for data integration**:
   - Two users can have the same name (e.g., "Tom Smith")
   - Only one user can have a username (e.g., `tom.smith` is unique)
   - All analytical views include both `username` (unique) and `first_name`/`last_name` (display only)
   - When merging analysis data with external tools, join on `username`, not on names

---

## Common Analysis Queries

### Monthly Spending

```sql
SELECT
  DATE_TRUNC('month', e.created_at) AS month,
  SUM(e.amount + e.tip_amount) / 100.0 AS total_spent
FROM expenses e
GROUP BY DATE_TRUNC('month', e.created_at)
ORDER BY month DESC;
```

### Category Breakdown

```sql
SELECT
  e.category,
  COUNT(*) AS count,
  SUM(e.amount) / 100.0 AS total_dollars,
  AVG(e.amount) / 100.0 AS avg_dollars
FROM expenses e
WHERE e.event_id = 'EVENT_UUID'
GROUP BY e.category
ORDER BY total_dollars DESC;
```

### Group Settlement Summary

```sql
SELECT
  eg.name AS group_name,
  h.firstName || ' ' || h.lastName AS user,
  SUM(e.amount + e.tip_amount) / 100.0 AS total_owed
FROM expense_groups eg
JOIN group_members gm ON eg.id = gm.group_id
JOIN humans h ON gm.user_id = h.id
LEFT JOIN expense_splits es ON h.id = es.user_id
LEFT JOIN expenses e ON es.expense_id = e.id AND e.group_id = eg.id
GROUP BY eg.id, eg.name, h.firstName, h.lastName
ORDER BY eg.name, total_owed DESC;
```

---

## For BI/Analytics Tools (Tableau, Power BI, Looker)

1. **Point to this database** with a read-only user (recommended)
2. **Connect to views** in: `analytics/materialized_views.sql`
3. **Use the currency conversion rule**: Divide by 100 for dollar displays
4. **Filter by timezone** for consistent reporting across regions

---

## Questions?

For schema clarification, see:

- [Drizzle Schema Definition](../src/db/schema.ts)
- [Currency Standardization Details](../CURRENCY_STANDARDIZATION_PLAN.md)
- [Database Architecture](../DATABASE_ARCHITECTURE.md)
