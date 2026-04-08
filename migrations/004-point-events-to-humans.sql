-- Migration: Point events to humans instead of users
-- This updates the foreign key constraint from creator_id -> users.id to creator_id -> humans.id

-- Drop the current foreign key
ALTER TABLE "events" DROP CONSTRAINT IF EXISTS "events_creator_id_fk";

-- Add the new foreign key pointing to humans
ALTER TABLE "events" ADD CONSTRAINT "events_creator_id_fk"
FOREIGN KEY ("creator_id") REFERENCES "humans"("id") ON DELETE CASCADE;

-- Note: This assumes all users have corresponding humans records (which they do from migration 001)
