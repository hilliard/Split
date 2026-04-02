import { drizzle } from 'drizzle-orm/node-postgres';
import pkg from 'pg';
import * as oldSchema from './schema';
import * as newSchema from './human-centric-schema';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const { Client } = pkg;

// Load .env.local for Windows 11 compatibility
if (!process.env.DATABASE_URL) {
  try {
    const envPath = resolve('.env.local');
    const envContent = readFileSync(envPath, 'utf-8');
    envContent.split('\n').forEach(line => {
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

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set. Make sure .env.local exists and contains DATABASE_URL.');
}

console.log('🔗 DATABASE_URL:', process.env.DATABASE_URL);
console.log('🔐 Has password:', process.env.DATABASE_URL.includes(':') && process.env.DATABASE_URL.split('@')[0].split(':').length > 1);
console.log('📊 Database schema: PHASE 1→2 TRANSITION (old and new schemas loaded)');

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

// Create drizzle instance with both old and new schemas
export const db = drizzle({
  client,
  schema: {
    ...oldSchema,  // Keep old tables available for backward compatibility
    ...newSchema,  // Add new human-centric tables and views
  },
});

// Attempt to connect at startup for early error detection
client.connect()
  .then(() => console.log('✓ Database connected at startup'))
  .catch(err => {
    console.error('⚠ Initial connection attempt failed, will retry on first query:', err.message);
    // Don't throw - let queries retry the connection
  });
