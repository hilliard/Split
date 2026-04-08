-- Update event budget column from decimal to integer (cents)
-- This provides better precision and is the standard way to handle money in databases

-- Drop existing budget column if it exists
ALTER TABLE "events" DROP COLUMN IF EXISTS "budget";

-- Add new budget_cents column that stores the amount in cents
ALTER TABLE "events" ADD COLUMN "budget_cents" integer;

-- Create index for efficient budget queries
CREATE INDEX "events_budget_cents_idx" ON "events" USING btree ("budget_cents");
