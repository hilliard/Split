-- Add metadata column to activities table if it doesn't exist
ALTER TABLE activities
ADD COLUMN IF NOT EXISTS metadata json DEFAULT '{}'::json;
