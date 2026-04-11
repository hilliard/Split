-- Fix expenses paid_by foreign key constraint to reference humans instead of users

-- Drop the old constraint
ALTER TABLE "expenses" DROP CONSTRAINT "expenses_paid_by_fk";

-- Add the correct constraint to reference humans table
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_paid_by_fk" 
  FOREIGN KEY ("paid_by") REFERENCES "humans"("id") ON DELETE RESTRICT;
