import dotenv from 'dotenv';
import path from 'path';

// Load DATABASE_URL from env if provided, but give precedence to a local env file if present
// Prefer local env when present, override any existing env vars from the process
dotenv.config({ path: path.resolve('.', '.env.local'), override: true });
let url = process.env.DATABASE_URL;
if (!url) {
  console.error('DATABASE_URL not set');
  process.exit(1);
}
// Do not print raw credentials; later we print sanitized URL

// Sanitize the URL for safe logs
const sanitize = (conn) => {
  try {
    const u = new URL(conn);
    if (u.password) u.password = '****';
    return u.toString();
  } catch {
    return conn;
  }
};

const labelFrom = (urlStr) => {
  try {
    const u = new URL(urlStr);
    return u.hostname.includes('neon') ? 'Neon' : 'Local';
  } catch {
    return 'DB';
  }
};

// eslint-disable-next-line no-useless-concat
; (async () => {
  const { Client } = await import('pg');
  const client = new Client({ connectionString: url });
  try {
    await client.connect();
    const res = await client.query('SELECT 1 AS ok');
    console.log(`DB health OK [${labelFrom(url)}]: ${sanitize(url)} -> ${res.rows[0].ok}`);
  } catch (err) {
    console.error('DB health check failed', err);
    process.exit(1);
  } finally {
    await client.end();
  }
})();
