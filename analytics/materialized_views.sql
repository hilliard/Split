-- Analytics Views for Split Database (Simplified Version)
-- These views are designed for external analysis tools
-- All monetary values are converted to DOLLARS for readability

-- ============================================================================
-- VIEW 1: EXPENSE SUMMARY (Main Analysis View)
-- ============================================================================
DROP VIEW IF EXISTS expense_summary_for_analysis CASCADE;
CREATE VIEW expense_summary_for_analysis AS
SELECT 
  e.id AS expense_id,
  e.event_id,
  e.activity_id,
  e.group_id,
  ROUND(e.amount / 100.0::NUMERIC, 2) AS amount_dollars,
  ROUND(e.tip_amount / 100.0::NUMERIC, 2) AS tip_dollars,
  ROUND((e.amount + e.tip_amount) / 100.0::NUMERIC, 2) AS total_dollars,
  e.category,
  e.description,
  e.paid_by AS payer_id,
  e.created_at::DATE AS expense_date,
  DATE_PART('year', e.created_at) AS expense_year,
  DATE_PART('month', e.created_at) AS expense_month,
  DATE_PART('week', e.created_at) AS expense_week,
  TO_CHAR(e.created_at, 'YYYY-MM') AS month_year,
  e.created_at
FROM expenses e
ORDER BY e.created_at DESC;

-- ============================================================================
-- VIEW 2: EXPENSE SPLITS (Settlement Data)
-- ============================================================================
DROP VIEW IF EXISTS expense_splits_for_analysis CASCADE;
CREATE VIEW expense_splits_for_analysis AS
SELECT 
  es.id AS split_id,
  es.expense_id,
  es.user_id,
  ROUND(es.amount / 100.0::NUMERIC, 2) AS split_dollars,
  e.paid_by AS paid_by_user_id,
  ROUND((es.amount) / 100.0::NUMERIC, 2) AS amount_owed_dollars
FROM expense_splits es
JOIN expenses e ON es.expense_id = e.id
ORDER BY es.id DESC;

-- ============================================================================
-- VIEW 3: DAILY SPENDING TREND
-- ============================================================================
DROP VIEW IF EXISTS daily_spending_trend_for_analysis CASCADE;
CREATE VIEW daily_spending_trend_for_analysis AS
SELECT 
  e.created_at::DATE AS expense_date,
  DATE_PART('year', e.created_at)::INT AS year,
  DATE_PART('month', e.created_at)::INT AS month,
  DATE_PART('week', e.created_at)::INT AS week,
  COUNT(*) AS expense_count,
  ROUND(SUM(e.amount) / 100.0::NUMERIC, 2) AS subtotal_dollars,
  ROUND(SUM(e.tip_amount) / 100.0::NUMERIC, 2) AS total_tips_dollars,
  ROUND(SUM(e.amount + e.tip_amount) / 100.0::NUMERIC, 2) AS daily_total_dollars,
  ROUND(AVG(e.amount + e.tip_amount) / 100.0::NUMERIC, 2) AS avg_expense_dollars,
  COUNT(DISTINCT e.paid_by) AS unique_payers
FROM expenses e
GROUP BY e.created_at::DATE,
         DATE_PART('year', e.created_at),
         DATE_PART('month', e.created_at),
         DATE_PART('week', e.created_at)
ORDER BY expense_date DESC;

-- ============================================================================
-- VIEW 4: CATEGORY SPENDING
-- ============================================================================
DROP VIEW IF EXISTS category_spending_for_analysis CASCADE;
CREATE VIEW category_spending_for_analysis AS
SELECT 
  e.category,
  COUNT(*) AS expense_count,
  ROUND(SUM(e.amount) / 100.0::NUMERIC, 2) AS subtotal_dollars,
  ROUND(SUM(e.tip_amount) / 100.0::NUMERIC, 2) AS total_tips_dollars,
  ROUND(SUM(e.amount + e.tip_amount) / 100.0::NUMERIC, 2) AS total_dollars,
  ROUND(AVG(e.amount + e.tip_amount) / 100.0::NUMERIC, 2) AS avg_expense_dollars,
  ROUND(MAX(e.amount) / 100.0::NUMERIC, 2) AS max_expense_dollars,
  ROUND(MIN(e.amount) / 100.0::NUMERIC, 2) AS min_expense_dollars
FROM expenses e
WHERE e.category IS NOT NULL
GROUP BY e.category
ORDER BY total_dollars DESC;

-- ============================================================================
-- VIEW 5: GROUP SPENDING SUMMARY
-- ============================================================================
DROP VIEW IF EXISTS group_spending_for_analysis CASCADE;
CREATE VIEW group_spending_for_analysis AS
SELECT 
  eg.id AS group_id,
  eg.name AS group_name,
  eg.created_at::DATE AS group_created_date,
  COUNT(DISTINCT e.id) AS total_expenses,
  ROUND(SUM(e.amount + e.tip_amount) / 100.0::NUMERIC, 2) AS total_group_spending_dollars,
  ROUND(AVG(e.amount + e.tip_amount) / 100.0::NUMERIC, 2) AS avg_expense_dollars,
  MIN(e.created_at)::DATE AS first_expense_date,
  MAX(e.created_at)::DATE AS last_expense_date
FROM expense_groups eg
LEFT JOIN expenses e ON eg.id = e.group_id
GROUP BY eg.id, eg.name, eg.created_at
ORDER BY total_group_spending_dollars DESC;

-- ============================================================================
-- VIEW 6: USER SUMMARY (Payers)
-- ============================================================================
DROP VIEW IF EXISTS user_payer_summary_for_analysis CASCADE;
CREATE VIEW user_payer_summary_for_analysis AS
SELECT 
  h.id AS user_id,
  h.first_name,
  h.last_name,
  COUNT(DISTINCT e.id) AS expenses_created,
  ROUND(SUM(e.amount + e.tip_amount) / 100.0::NUMERIC, 2) AS total_paid_dollars,
  ROUND(AVG(e.amount + e.tip_amount) / 100.0::NUMERIC, 2) AS avg_expense_dollars,
  ROUND(SUM(e.tip_amount) / 100.0::NUMERIC, 2) AS total_tips_paid_dollars,
  MIN(e.created_at)::DATE AS first_expense_date,
  MAX(e.created_at)::DATE AS last_expense_date
FROM humans h
LEFT JOIN expenses e ON h.id = e.paid_by
WHERE e.id IS NOT NULL
GROUP BY h.id, h.first_name, h.last_name
ORDER BY total_paid_dollars DESC;

-- ============================================================================
-- VIEW 7: USER SUMMARY (Participants via Splits)
-- ============================================================================
DROP VIEW IF EXISTS user_participant_summary_for_analysis CASCADE;
CREATE VIEW user_participant_summary_for_analysis AS
SELECT 
  h.id AS user_id,
  h.first_name,
  h.last_name,
  COUNT(DISTINCT es.expense_id) AS expenses_involved_in,
  ROUND(SUM(es.amount) / 100.0::NUMERIC, 2) AS total_owed_dollars,
  ROUND(AVG(es.amount) / 100.0::NUMERIC, 2) AS avg_split_dollars
FROM humans h
LEFT JOIN expense_splits es ON h.id = es.user_id
WHERE es.id IS NOT NULL
GROUP BY h.id, h.first_name, h.last_name
ORDER BY total_owed_dollars DESC;

-- ============================================================================
-- VIEW 8: EVENTS SUMMARY
-- ============================================================================
DROP VIEW IF EXISTS events_summary_for_analysis CASCADE;
CREATE VIEW events_summary_for_analysis AS
SELECT 
  ev.id AS event_id,
  ev.title AS event_name,
  ev.type AS event_type,
  ev.status,
  ev.currency,
  ev.start_time::DATE AS start_date,
  ev.end_time::DATE AS end_date,
  (ev.end_time - ev.start_time) AS duration_days,
  COUNT(DISTINCT e.id) AS total_expenses,
  ROUND(SUM(e.amount + e.tip_amount) / 100.0::NUMERIC, 2) AS total_spending_dollars,
  ROUND(AVG(e.amount + e.tip_amount) / 100.0::NUMERIC, 2) AS avg_expense_dollars,
  COUNT(DISTINCT e.paid_by) AS unique_payers
FROM events ev
LEFT JOIN expenses e ON ev.id = e.event_id
GROUP BY ev.id, ev.title, ev.type, ev.status, ev.currency, ev.start_time, ev.end_time
ORDER BY ev.created_at DESC;
