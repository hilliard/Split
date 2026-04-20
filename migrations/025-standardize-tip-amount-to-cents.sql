-- Migration 025: Standardize tip_amount to cents (INTEGER)
-- 
-- GOAL: Convert all monetary values in expenses table to a single base unit (cents)
-- CURRENT STATE:
--   - amount: INTEGER (cents) ✅
--   - tip_amount: DECIMAL(10,2) (dollars) ❌ INCONSISTENT
--
-- AFTER MIGRATION:
--   - amount: INTEGER (cents) ✅
--   - tip_amount: INTEGER (cents) ✅
--
-- This eliminates manual * 100 and / 100 conversions throughout the codebase

DO $$
BEGIN
    -- Step 1: Verify column exists and is DECIMAL
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'expenses' AND column_name = 'tip_amount'
        AND data_type = 'numeric'
    ) THEN
        RAISE NOTICE 'Converting tip_amount from DECIMAL to INTEGER (dollars to cents)...';
        
        -- Step 2: Alter column type, converting dollars to cents
        -- DECIMAL(10,2) value 3.45 becomes INTEGER 345 (cents)
        ALTER TABLE expenses
        ALTER COLUMN tip_amount TYPE integer
        USING (CAST(CAST(tip_amount AS NUMERIC) * 100 AS INTEGER));
        
        RAISE NOTICE 'Successfully converted tip_amount to INTEGER (cents)';
    ELSIF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'expenses' AND column_name = 'tip_amount'
        AND data_type = 'integer'
    ) THEN
        RAISE NOTICE 'tip_amount is already INTEGER - no conversion needed';
    ELSE
        RAISE WARNING 'tip_amount column not found in expenses table';
    END IF;
    
    -- Step 3: Verify conversion worked
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'expenses' AND column_name = 'tip_amount'
        AND data_type = 'integer'
    ) THEN
        RAISE NOTICE 'Verification passed: tip_amount is now INTEGER type';
    ELSE
        RAISE ERROR 'Verification failed: tip_amount is not INTEGER after migration';
    END IF;

EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Migration error: %', SQLERRM;
END $$;
