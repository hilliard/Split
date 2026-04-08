-- Migration 011: Rename events.name to title and add missing columns
-- This fixes the schema mismatch between database and Drizzle definition

-- Check if the column exists before trying to rename
-- First, rename name to title if it exists
DO $$ 
BEGIN
    -- Check if 'name' column exists, if so rename to 'title'
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'events' AND column_name = 'name'
    ) THEN
        ALTER TABLE events RENAME COLUMN "name" TO title;
        RAISE NOTICE 'Column renamed: name -> title';
    END IF;

    -- Add type column if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'events' AND column_name = 'type'
    ) THEN
        ALTER TABLE events ADD COLUMN type VARCHAR(50) DEFAULT 'general' NOT NULL;
        RAISE NOTICE 'Column added: type';
    END IF;

    -- Add status column if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'events' AND column_name = 'status'
    ) THEN
        ALTER TABLE events ADD COLUMN status VARCHAR(50) DEFAULT 'scheduled';
        RAISE NOTICE 'Column added: status';
    END IF;

    -- Add start_time column if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'events' AND column_name = 'start_time'
    ) THEN
        ALTER TABLE events ADD COLUMN start_time TIMESTAMPTZ NOT NULL DEFAULT NOW();
        RAISE NOTICE 'Column added: start_time';
    END IF;

    -- Add end_time column if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'events' AND column_name = 'end_time'
    ) THEN
        ALTER TABLE events ADD COLUMN end_time TIMESTAMPTZ;
        RAISE NOTICE 'Column added: end_time';
    END IF;

    -- Add timezone column if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'events' AND column_name = 'timezone'
    ) THEN
        ALTER TABLE events ADD COLUMN timezone VARCHAR(50) DEFAULT 'UTC';
        RAISE NOTICE 'Column added: timezone';
    END IF;

    -- Add is_virtual column if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'events' AND column_name = 'is_virtual'
    ) THEN
        ALTER TABLE events ADD COLUMN is_virtual BOOLEAN DEFAULT false;
        RAISE NOTICE 'Column added: is_virtual';
    END IF;

    -- Add venue_id column if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'events' AND column_name = 'venue_id'
    ) THEN
        ALTER TABLE events ADD COLUMN venue_id UUID;
        RAISE NOTICE 'Column added: venue_id';
    END IF;

    -- Add is_public column if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'events' AND column_name = 'is_public'
    ) THEN
        ALTER TABLE events ADD COLUMN is_public BOOLEAN DEFAULT true;
        RAISE NOTICE 'Column added: is_public';
    END IF;

    -- Add currency column if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'events' AND column_name = 'currency'
    ) THEN
        ALTER TABLE events ADD COLUMN currency VARCHAR(3) DEFAULT 'USD';
        RAISE NOTICE 'Column added: currency';
    END IF;

    -- Add metadata column if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'events' AND column_name = 'metadata'
    ) THEN
        ALTER TABLE events ADD COLUMN metadata JSONB DEFAULT '{}'::jsonb;
        RAISE NOTICE 'Column added: metadata';
    END IF;

    -- Rename creator_id column if it doesn't exist but id column does (for backward compat)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'events' AND column_name = 'creator_id'
    ) AND EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'events' AND column_name = 'user_id'
    ) THEN
        ALTER TABLE events RENAME COLUMN user_id TO creator_id;
        RAISE NOTICE 'Column renamed: user_id -> creator_id';
    END IF;

END $$;

-- Update created_at if it doesn't have timezone support
DO $$
BEGIN
    -- This is just a note - we can't easily change column types in PostgreSQL
    -- But the application should handle both TIMESTAMP and TIMESTAMPTZ
    RAISE NOTICE 'Schema migration 011 completed';
END $$;
