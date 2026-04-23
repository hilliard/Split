-- Migration: Allow unlimited @resend.dev email testing
-- Purpose: Drop the strict unique constraint on customer emails and replace with 
--          a partial unique index that excludes @resend.dev sandbox emails
-- 
-- This allows developers to re-use @resend.dev test emails for unlimited testing cycles
-- while maintaining uniqueness for real production emails

-- Drop the old strict unique constraint
ALTER TABLE customers DROP CONSTRAINT customers_email_unique;

-- Create a partial unique index that allows @resend.dev emails but enforces uniqueness for everything else
-- PostgreSQL LIKE operator: '%@resend.dev' matches any email ending with @resend.dev
CREATE UNIQUE INDEX customers_email_unique ON customers(email) 
WHERE email NOT LIKE '%@resend.dev';

-- Result:
-- ✅ test1@resend.dev can be registered, then deleted and re-registered (infinite times)
-- ✅ test2@resend.dev can be registered, then deleted and re-registered (infinite times)
-- ✅ user@gmail.com cannot be registered twice (uniqueness enforced)
-- ✅ Production emails are protected, test emails are unrestricted
