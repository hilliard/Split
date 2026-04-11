-- Add tip_amount column to expenses table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'expenses' AND column_name = 'tip_amount'
  ) THEN
    ALTER TABLE "expenses" ADD COLUMN "tip_amount" numeric(10, 2) DEFAULT '0' NOT NULL;
    RAISE NOTICE 'Added tip_amount column to expenses table';
  ELSE
    RAISE NOTICE 'tip_amount column already exists on expenses table';
  END IF;
END $$;
