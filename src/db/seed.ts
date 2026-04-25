import { Client } from 'pg'
import dotenv from 'dotenv'
import path from 'path'

// Load local env to get DATABASE_URL
dotenv.config({ path: path.resolve('.', '.env.local'), override: true })
const url = process.env.DATABASE_URL
if (!url) {
  console.error('DATABASE_URL not set')
  process.exit(1)
}

(async () => {
  const client = new Client({ connectionString: url })
  try {
    await client.connect()
    const seedSql = `
BEGIN;
-- Seed a sample user (Alice Smith)
INSERT INTO humans (id, first_name, last_name, dob, gender, phone, created_at, updated_at)
  VALUES ('11111111-1111-1111-1111-111111111111', 'Alice', 'Smith', NULL, NULL, NULL, NOW(), NOW())
  ON CONFLICT (id) DO NOTHING;

-- Link a customer row for the user
INSERT INTO customers (id, human_id, username, email, password_hash, created_at, updated_at, email_verified, loyalty_points)
  VALUES ('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'alice', 'alice@example.com', '', NOW(), NOW(), TRUE, 0)
  ON CONFLICT (id) DO NOTHING;
COMMIT;
`;
    await client.query(seedSql)
    console.log('Seed complete')
  } catch (err) {
    console.error('Seed failed', err)
  } finally {
    await client.end()
  }
})()
