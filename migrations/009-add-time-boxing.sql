-- Add time boxing fields to events and activities tables
-- This allows users to specify start and end times for activities within events

-- Add time fields to events table
ALTER TABLE events
ADD COLUMN start_time TIME,
ADD COLUMN end_time TIME;

-- Add time fields to activities table
ALTER TABLE activities
ADD COLUMN start_time TIME,
ADD COLUMN end_time TIME;

-- Add comment for clarity
COMMENT ON COLUMN events.start_time IS 'Start time of the event (optional, separate from date)';
COMMENT ON COLUMN events.end_time IS 'End time of the event (optional, separate from date)';
COMMENT ON COLUMN activities.start_time IS 'Start time of the activity (optional, separate from date)';
COMMENT ON COLUMN activities.end_time IS 'End time of the activity (optional, separate from date)';
