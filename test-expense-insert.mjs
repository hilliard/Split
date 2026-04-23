import postgres from 'postgres';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'SET' : 'NOT SET');
if (process.env.DATABASE_URL) {
  const match = process.env.DATABASE_URL.match(/postgresql:\/\/([^:]+):/);
  console.log('Database user:', match ? match[1] : 'unknown');
}

const connStr = process.env.DATABASE_URL;
if (!connStr) {
  console.error('❌ DATABASE_URL not set!');
  process.exit(1);
}

const sql = postgres(connStr);

try {
  console.log('Testing expense insert...');

  // Test with a known event and human
  const eventId = '56ccd0fe-ce73-43d7-bc26-0f59c2bc9f22';
  const paidBy = '61994963-eb56-4d04-89af-8e1593a507ca';

  const result = await sql`
    INSERT INTO expenses (id, event_id, amount, description, category, paid_by)
    VALUES (
      ${uuidv4()}, 
      ${eventId}, 
      ${100.0}, 
      ${'Test Flight'}, 
      ${'misc'}, 
      ${paidBy}
    )
    RETURNING *
  `;

  console.log('✅ Insert succeeded!');
  console.log(JSON.stringify(result[0], null, 2));
} catch (error) {
  console.error('❌ Insert failed:');
  console.error('Error:', error.message);
  if (error.detail) console.error('Detail:', error.detail);
  console.error('Code:', error.code);
} finally {
  await sql.end();
}
