#!/usr/bin/env node
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import postgres from 'postgres';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env.local
if (!process.env.DATABASE_URL) {
  try {
    const envPath = path.resolve(__dirname, '.env.local');
    const envContent = fs.readFileSync(envPath, 'utf-8');
    envContent.split('\n').forEach((line) => {
      if (line.trim() && !line.startsWith('#')) {
        const [key, ...valueParts] = line.split('=');
        const value = valueParts.join('=').trim();
        if (key && value && !process.env[key.trim()]) {
          process.env[key.trim()] = value.replace(/^["']|["']$/g, '');
        }
      }
    });
  } catch (error) {
    console.warn('Warning: Could not load .env.local');
  }
}

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('DATABASE_URL environment variable is not set');
  process.exit(1);
}

const sql = postgres(databaseUrl);

async function testActivityCreation() {
  try {
    console.log('Testing activity creation...\n');

    // Get an event that exists
    const events = await sql`SELECT id, creator_id FROM events LIMIT 1`;

    if (events.length === 0) {
      console.error('No events found. Please create an event first.');
      process.exit(1);
    }

    const event = events[0];
    console.log(`Found event: ${event.id}`);

    // Try to insert an activity
    console.log('\nInserting activity...');
    const result = await sql`
      INSERT INTO activities (
        event_id, 
        title, 
        location_name, 
        sequence_order
      ) VALUES (
        ${event.id},
        'Test Activity',
        'Test Location',
        0
      )
      RETURNING *
    `;

    console.log('✅ Activity created successfully!');
    console.log(JSON.stringify(result[0], null, 2));

    // Clean up
    await sql`DELETE FROM activities WHERE id = ${result[0].id}`;
    console.log('\n✅ Test activity cleaned up');

    await sql.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

testActivityCreation();
