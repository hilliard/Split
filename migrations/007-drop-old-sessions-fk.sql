-- Drop the old foreign key constraint that still references users table
ALTER TABLE "sessions" DROP CONSTRAINT IF EXISTS "sessions_user_id_fk";
