-- Migration: Update events to use correct human_ids
-- This migration maps events creator_id from user_id to their corresponding human_id

-- We need to update events where creator_id matches users.id to use the humans.id instead
UPDATE "events" e
SET "creator_id" = h."id"
FROM "users" u
JOIN "humans" h ON h."first_name" = u."username"
WHERE e."creator_id" = u."id";

-- Note: This assumes the first_name in humans matches the username in users (from migration 001)
