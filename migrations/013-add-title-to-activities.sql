-- Migration 013: Add missing title column to activities table
-- The activities table is missing the title column that Drizzle schema expects

ALTER TABLE activities ADD COLUMN IF NOT EXISTS title VARCHAR(255);

-- Update existing activities with a default title if none exists
UPDATE activities SET title = 'Activity ' || id WHERE title IS NULL;

-- Make title NOT NULL to match schema
ALTER TABLE activities ALTER COLUMN title SET NOT NULL;

-- Create index on title for faster lookups if needed
CREATE INDEX IF NOT EXISTS idx_activities_title ON activities(title);
