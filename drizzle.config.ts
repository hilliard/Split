import type { Config } from 'drizzle-kit';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Manually load .env.local for Windows 11 compatibility
const envPath = resolve('.env.local');
const envContent = readFileSync(envPath, 'utf-8');
const envVars: Record<string, string> = {};

envContent.split('\n').forEach(line => {
  if (line.trim() && !line.startsWith('#')) {
    const [key, ...valueParts] = line.split('=');
    const value = valueParts.join('=').trim();
    if (key && value) {
      process.env[key.trim()] = value.replace(/^["']|["']$/g, '');
      envVars[key.trim()] = value;
    }
  }
});

const databaseUrl = process.env.DATABASE_URL || envVars['DATABASE_URL'];

if (!databaseUrl) {
  throw new Error(
    'DATABASE_URL environment variable is not set. Make sure .env.local exists and contains DATABASE_URL.'
  );
}

console.log('Using database:', databaseUrl.replace(/:[^@]*@/, ':***@'));

export default {
  schema: './src/db/schema.ts',
  out: './src/db/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: databaseUrl,
  },
} satisfies Config;
