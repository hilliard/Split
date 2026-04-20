-- Migration 023: Ensure all foreign key constraints exist on expenses table
-- This migration adds missing foreign key constraints to the expenses table
-- If constraints don't exist, they will be created

-- The schema currently has these columns but may be missing the constraints:
-- - event_id (should reference events.id)
-- - activity_id (should reference activities.id)
-- - paid_by (should reference humans.id)
-- - group_id (should reference expense_groups.id) - if exists

DO $$
BEGIN
    -- Add event_id FK if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'expenses' AND constraint_name = 'expenses_event_id_fk'
    ) THEN
        ALTER TABLE expenses ADD CONSTRAINT expenses_event_id_fk
            FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE;
        RAISE NOTICE 'Added constraint: expenses_event_id_fk';
    END IF;

    -- Add activity_id FK if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'expenses' AND constraint_name = 'expenses_activity_id_fk'
    ) THEN
        ALTER TABLE expenses ADD CONSTRAINT expenses_activity_id_fk
            FOREIGN KEY (activity_id) REFERENCES activities(id) ON DELETE SET NULL;
        RAISE NOTICE 'Added constraint: expenses_activity_id_fk';
    END IF;

    -- Add paid_by FK if it doesn't reference humans
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
        WHERE tc.table_name = 'expenses' 
        AND kcu.column_name = 'paid_by'
        AND tc.constraint_type = 'FOREIGN KEY'
    ) THEN
        -- Drop old constraint if it exists (references wrong table)
        BEGIN
            ALTER TABLE expenses DROP CONSTRAINT IF EXISTS expenses_paid_by_fk CASCADE;
        EXCEPTION WHEN OTHERS THEN NULL;
        END;
        
        ALTER TABLE expenses ADD CONSTRAINT expenses_paid_by_fk
            FOREIGN KEY (paid_by) REFERENCES humans(id) ON DELETE RESTRICT;
        RAISE NOTICE 'Added constraint: expenses_paid_by_fk';
    END IF;

    -- Add group_id FK if the column exists and constraint doesn't
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'expenses' AND column_name = 'group_id'
    ) THEN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE table_name = 'expenses' AND constraint_name = 'expenses_group_id_fk'
        ) THEN
            ALTER TABLE expenses ADD CONSTRAINT expenses_group_id_fk
                FOREIGN KEY (group_id) REFERENCES expense_groups(id) ON DELETE SET NULL;
            RAISE NOTICE 'Added constraint: expenses_group_id_fk';
        END IF;
    END IF;

END $$;
