-- Migration: Add createdBy column to activities table (safer, non-destructive version)
-- Adds a nullable created_by column (UUID) referencing humans(id)

-- 1. Add the column, allow NULLs for existing data
ALTER TABLE activities
ADD COLUMN IF NOT EXISTS created_by UUID;

-- 2. Do not backfill here. Data backfill should be performed via a separate, explicit script
-- or by administrators after confirming appropriate mappings.

-- 3. Do not enforce NOT NULL or foreign key constraints yet to avoid breaking existing data
-- 4. When ready, you can run a data-migration to populate created_by and then add the FK:
--    ALTER TABLE activities
--    ALTER COLUMN created_by SET NOT NULL;
--    ALTER TABLE activities
--    ADD CONSTRAINT activities_created_by_fkey FOREIGN KEY (created_by) REFERENCES humans(id);
