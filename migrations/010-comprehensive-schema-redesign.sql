-- Migration 010: Comprehensive Schema Redesign
-- Transforms events, activities and creates expenses table with proper structure
-- This migration aligns with the event management architecture

-- Step 1: Create new events table with complete structure
-- Rename old events to events_old as backup
ALTER TABLE events RENAME TO events_old;

-- Create new events table with proper structure
CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id UUID NOT NULL REFERENCES humans(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(50) NOT NULL DEFAULT 'general',
    status VARCHAR(50) DEFAULT 'scheduled',
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ,
    timezone VARCHAR(50) DEFAULT 'UTC',
    is_virtual BOOLEAN DEFAULT false,
    venue_id UUID,
    group_id UUID REFERENCES expense_groups(id) ON DELETE SET NULL,
    is_public BOOLEAN DEFAULT true,
    budget_cents INTEGER,
    currency VARCHAR(3) DEFAULT 'USD',
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 2: Migrate data from old events table to new events table
-- Convert date fields to TIMESTAMPTZ by combining start_date + start_time
INSERT INTO events (
    id,
    creator_id,
    title,
    description,
    type,
    status,
    start_time,
    end_time,
    timezone,
    is_virtual,
    group_id,
    is_public,
    budget_cents,
    currency,
    created_at
)
SELECT 
    id,
    creator_id,
    name AS title,
    description,
    'general' AS type,
    'scheduled' AS status,
    CASE 
        WHEN start_date IS NOT NULL THEN 
            CASE 
                WHEN start_time IS NOT NULL THEN 
                    (start_date::timestamp || ' ' || start_time)::TIMESTAMPTZ
                ELSE 
                    start_date::timestamp::TIMESTAMPTZ
            END
        ELSE NOW()
    END AS start_time,
    CASE 
        WHEN end_date IS NOT NULL THEN 
            CASE 
                WHEN end_time IS NOT NULL THEN 
                    (end_date::timestamp || ' ' || end_time)::TIMESTAMPTZ
                ELSE 
                    end_date::timestamp::TIMESTAMPTZ
            END
        ELSE NULL
    END AS end_time,
    'UTC' AS timezone,
    false AS is_virtual,
    group_id,
    true AS is_public,
    budget_cents,
    currency,
    created_at
FROM events_old;

-- Create indexes for events
CREATE INDEX idx_events_creator_id ON events(creator_id);
CREATE INDEX idx_events_group_id ON events(group_id);
CREATE INDEX idx_events_start_time ON events(start_time);
CREATE INDEX idx_events_status ON events(status);

-- Step 3: Create new activities table with proper structure
-- Rename old activities to activities_old
ALTER TABLE activities RENAME TO activities_old;

-- Create new activities table
CREATE TABLE activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    start_time TIMESTAMPTZ,
    end_time TIMESTAMPTZ,
    location_name VARCHAR(255),
    sequence_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 4: Migrate data from old activities to new activities
INSERT INTO activities (
    id,
    event_id,
    title,
    start_time,
    end_time,
    sequence_order,
    created_at
)
SELECT 
    id,
    event_id,
    name AS title,
    start_time,
    end_time,
    0 AS sequence_order,
    created_at
FROM activities_old;

-- Create indexes for activities
CREATE INDEX idx_activities_event_id ON activities(event_id);
CREATE INDEX idx_activities_start_time ON activities(start_time);

-- Step 5: Create expenses table
CREATE TABLE expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    activity_id UUID REFERENCES activities(id) ON DELETE SET NULL,
    amount DECIMAL(10, 2) NOT NULL,
    category VARCHAR(50) NOT NULL,
    description TEXT,
    paid_by UUID REFERENCES humans(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for expenses
CREATE INDEX idx_expenses_event_id ON expenses(event_id);
CREATE INDEX idx_expenses_activity_id ON expenses(activity_id);
CREATE INDEX idx_expenses_paid_by ON expenses(paid_by);
CREATE INDEX idx_expenses_category ON expenses(category);

-- Step 6: Clean up old tables
DROP TABLE activities_old;
DROP TABLE events_old;

-- Add comments for clarity
COMMENT ON COLUMN events.title IS 'Event name/title';
COMMENT ON COLUMN events.type IS 'Event type (concert, dinner, sports, etc.)';
COMMENT ON COLUMN events.status IS 'Event status (scheduled, ongoing, canceled, completed)';
COMMENT ON COLUMN events.start_time IS 'Event start time (TIMESTAMPTZ includes date and time)';
COMMENT ON COLUMN events.end_time IS 'Event end time (TIMESTAMPTZ includes date and time)';
COMMENT ON COLUMN events.timezone IS 'Local timezone for proper time display';
COMMENT ON COLUMN events.is_virtual IS 'Whether event is virtual/streamed';
COMMENT ON COLUMN events.is_public IS 'Whether event is public or invite-only';
COMMENT ON COLUMN events.metadata IS 'Type-specific metadata (JSONB)';
COMMENT ON COLUMN activities.location_name IS 'Physical or virtual location of activity';
COMMENT ON COLUMN activities.sequence_order IS 'Display order if exact times are not strict';
COMMENT ON COLUMN expenses.category IS 'Expense category (food, transport, tickets, etc.)';
COMMENT ON COLUMN expenses.paid_by IS 'Human who paid the expense';
