import pg from 'pg';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Load .env.local
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
  } catch (e) {
    console.error('Failed to load .env.local');
  }
}

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('❌ Connection error:', err.message);
    process.exit(1);
  } else {
    console.log('✅ Connection successful! Current time:', res.rows[0].now);
    process.exit(0);
  }
});
