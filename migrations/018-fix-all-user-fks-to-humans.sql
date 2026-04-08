-- Find and fix all foreign key constraints that incorrectly point to users table
-- when they should point to humans table

-- Check group_members FK
ALTER TABLE group_members 
DROP CONSTRAINT group_members_user_id_fk;

ALTER TABLE group_members
ADD CONSTRAINT group_members_user_id_fk 
FOREIGN KEY (user_id) 
REFERENCES humans(id) 
ON DELETE CASCADE;

-- Check for any other tables with similar issues
-- expenseSplits might have the same problem
ALTER TABLE expense_splits 
DROP CONSTRAINT IF EXISTS expense_splits_user_id_fk;

ALTER TABLE expense_splits
ADD CONSTRAINT expense_splits_user_id_fk 
FOREIGN KEY (user_id) 
REFERENCES humans(id) 
ON DELETE CASCADE;
