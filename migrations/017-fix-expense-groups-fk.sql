-- Fix expense_groups foreign key constraint
-- Drop the old constraint that points to users
ALTER TABLE expense_groups 
DROP CONSTRAINT groups_created_by_fk;

-- Add the correct constraint pointing to humans
ALTER TABLE expense_groups
ADD CONSTRAINT groups_created_by_fk 
FOREIGN KEY (created_by) 
REFERENCES humans(id) 
ON DELETE CASCADE;
