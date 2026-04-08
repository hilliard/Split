-- Migration 014: Fix activities table schema to match Drizzle ORM definition
-- The activities table has incorrect data types and missing columns

-- Step 1: Add missing columns to activities table
ALTER TABLE activities ADD COLUMN IF NOT EXISTS location_name VARCHAR(255);
ALTER TABLE activities ADD COLUMN IF NOT EXISTS sequence_order INTEGER DEFAULT 0;

-- Step 2: Convert time columns to TIMESTAMPTZ
-- First, add new columns with correct type
ALTER TABLE activities ADD COLUMN IF NOT EXISTS start_time_new TIMESTAMPTZ;
ALTER TABLE activities ADD COLUMN IF NOT EXISTS end_time_new TIMESTAMPTZ;
ALTER TABLE activities ADD COLUMN IF NOT EXISTS created_at_new TIMESTAMPTZ DEFAULT NOW();

-- Step 3: Migrate data from old columns to new columns (if data exists)
UPDATE activities 
SET created_at_new = created_at AT TIME ZONE 'UTC'
WHERE created_at_new IS NULL;

UPDATE activities 
SET start_time_new = created_at AT TIME ZONE 'UTC'
WHERE start_time IS NOT NULL AND start_time_new IS NULL;

UPDATE activities 
SET end_time_new = created_at AT TIME ZONE 'UTC'
WHERE end_time IS NOT NULL AND end_time_new IS NULL;

-- Step 4: Drop old columns and rename
ALTER TABLE activities DROP COLUMN IF EXISTS start_time;
ALTER TABLE activities DROP COLUMN IF EXISTS end_time;
ALTER TABLE activities DROP COLUMN IF EXISTS created_at;

ALTER TABLE activities RENAME COLUMN start_time_new TO start_time;
ALTER TABLE activities RENAME COLUMN end_time_new TO end_time;
ALTER TABLE activities RENAME COLUMN created_at_new TO created_at;

-- Step 5: Ensure created_at is NOT NULL
ALTER TABLE activities ALTER COLUMN created_at SET NOT NULL;

-- Step 6: Drop the 'name' column if it exists (it's not in the schema)
ALTER TABLE activities DROP COLUMN IF EXISTS name;

-- Step 7: Create proper indexes
CREATE INDEX IF NOT EXISTS idx_activities_event_id ON activities(event_id);
CREATE INDEX IF NOT EXISTS idx_activities_start_time ON activities(start_time);
CREATE INDEX IF NOT EXISTS idx_activities_title ON activities(title);
