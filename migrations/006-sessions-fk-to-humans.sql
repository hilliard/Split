-- Migration: Update sessions table to reference humans instead of users
-- The sessions table FK must point to humans.id since we're storing human_id values

-- Clear old sessions that don't have valid references
TRUNCATE TABLE "sessions";

-- Drop the current foreign key constraint
ALTER TABLE "sessions" DROP CONSTRAINT IF EXISTS "sessions_user_id_fkey";

-- Add the new foreign key pointing to humans
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "humans"("id") ON DELETE CASCADE;
