-- Migration 012: Consolidate date/time columns into TIMESTAMPTZ
-- This converts separate DATE and TIME columns into proper TIMESTAMPTZ columns for Drizzle compatibility

-- Step 1: Add new TIMESTAMPTZ columns
ALTER TABLE events ADD COLUMN IF NOT EXISTS start_time_new TIMESTAMPTZ;
ALTER TABLE events ADD COLUMN IF NOT EXISTS end_time_new TIMESTAMPTZ;

-- Step 2: Migrate data from old columns to new TIMESTAMPTZ columns
UPDATE events
SET 
  start_time_new = CASE 
    WHEN start_date IS NOT NULL AND start_time IS NOT NULL THEN 
      (start_date::text || ' ' || start_time::text)::TIMESTAMPTZ
    WHEN start_date IS NOT NULL THEN 
      start_date::TIMESTAMPTZ
    ELSE NOW()
  END
WHERE start_time_new IS NULL;

UPDATE events
SET 
  end_time_new = CASE
    WHEN end_date IS NOT NULL AND end_time IS NOT NULL THEN 
      (end_date::text || ' ' || end_time::text)::TIMESTAMPTZ
    WHEN end_date IS NOT NULL THEN 
      end_date::TIMESTAMPTZ
    ELSE NULL
  END
WHERE end_time_new IS NULL;

-- Step 3: Drop old columns if they exist
ALTER TABLE events DROP COLUMN IF EXISTS start_date CASCADE;
ALTER TABLE events DROP COLUMN IF EXISTS end_date CASCADE;
ALTER TABLE events DROP COLUMN IF EXISTS start_time CASCADE;
ALTER TABLE events DROP COLUMN IF EXISTS end_time CASCADE;

-- Step 4: Rename new columns to final names
ALTER TABLE events RENAME COLUMN start_time_new TO start_time;
ALTER TABLE events RENAME COLUMN end_time_new TO end_time;

-- Step 5: Ensure start_time is NOT NULL and add indexes
ALTER TABLE events ALTER COLUMN start_time SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_events_start_time ON events(start_time);
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
