-- Migration 015: Fix activities foreign key constraint
-- The activities table has a foreign key pointing to users instead of events

-- Step 1: Drop the incorrect foreign key constraint
ALTER TABLE activities DROP CONSTRAINT IF EXISTS activities_event_id_fk;

-- Step 2: Add the correct foreign key constraint
ALTER TABLE activities 
ADD CONSTRAINT activities_event_id_fk 
FOREIGN KEY (event_id) 
REFERENCES events(id) 
ON DELETE CASCADE;
