-- Migration 022: Make activities.event_id optional (nullable)
-- Purpose: Allow standalone activities to exist without being tied to an event
-- This enables the "attach activity to event" feature

ALTER TABLE activities
ALTER COLUMN event_id DROP NOT NULL;
