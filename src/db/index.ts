import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
const { Pool } = pg;
import * as oldSchema from './schema';
import * as newSchema from './schema';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Load .env.local for Windows 11 compatibility
if (!process.env.DATABASE_URL) {
  try {
    const envPath = resolve('.env.local');
    const envContent = readFileSync(envPath, 'utf-8');
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

if (!process.env.DATABASE_URL) {
  throw new Error(
    'DATABASE_URL environment variable is not set. Make sure .env.local exists and contains DATABASE_URL.'
  );
}

const databaseUrl = process.env.DATABASE_URL;
let parsedUrl: URL | null = null;

try {
  parsedUrl = new URL(databaseUrl);
} catch {
  console.warn('⚠ Could not parse DATABASE_URL, using raw connection string');
}

console.log('🔗 DATABASE_URL:', databaseUrl);
console.log('🔐 Has password:', parsedUrl ? parsedUrl.password.length > 0 : 'unknown');
console.log('📊 Database schema: PHASE 1→2 TRANSITION (old and new schemas loaded)');

// Use full connection string to preserve SSL and other parameters
const config = {
  connectionString: databaseUrl,
  ...(parsedUrl && parsedUrl.password.length === 0 ? { password: '' } : {}),
  max: 10,
  min: 0,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
  allowExitOnIdle: true,
};

console.log('📊 Connection config: Using connection string with SSL and all parameters');

const pool = new Pool(config);

// Handle pool errors
pool.on('error', (err) => {
  console.error('❌ Unexpected error on idle client in pool:', err);
});

// Create drizzle instance with both old and new schemas
export const db = drizzle({
  client: pool,
  schema: {
    ...oldSchema, // Keep old tables available for backward compatibility
    ...newSchema, // Add new human-centric tables and views
  },
});

// Test pool connection at startup (non-blocking)
pool
  .connect()
  .then((client) => {
    console.log('✓ Database pool connected at startup');
    client.release();
  })
  .catch((err) => {
    console.error('⚠ Initial connection attempt failed:', err.message);
  });
