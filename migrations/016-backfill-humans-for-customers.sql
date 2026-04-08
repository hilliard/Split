-- Backfill missing humans records for customers
-- This ensures foreign key integrity for groups and other features

INSERT INTO humans (id, created_at, updated_at)
SELECT c.human_id, NOW(), NOW()
FROM customers c
WHERE c.human_id NOT IN (SELECT id FROM humans)
ON CONFLICT (id) DO NOTHING;
