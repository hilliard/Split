-- Migration: Add group support to events
-- This allows events to be associated with a group of people

ALTER TABLE events ADD COLUMN group_id UUID;

ALTER TABLE events 
ADD CONSTRAINT events_group_id_fk 
FOREIGN KEY (group_id) REFERENCES expense_groups(id) ON DELETE SET NULL;

CREATE INDEX events_group_idx ON events(group_id);
