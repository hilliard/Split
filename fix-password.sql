-- Update test user password with bcrypt hash for 'password123'
UPDATE customers 
SET password_hash = '$2b$10$wCNUbyKHjlvztgygkWYGFOqG1qxTPKy1zVfcN1k53P6oeEINuqswe'
WHERE username = 'john_doe';

-- Verify the update
SELECT username, password_hash FROM customers WHERE username = 'john_doe';
