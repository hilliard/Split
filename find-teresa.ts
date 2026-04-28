import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import { eq } from 'drizzle-orm';
import { events, expenseGroups as groups } from './src/db/schema';

const { Pool } = pg;

async function checkDb(name: string, url: string) {
  if (!url) return;
  console.log(`Checking ${name}...`);
  try {
    const pool = new Pool({ connectionString: url, ssl: url.includes('neon') || url.includes('177.7') ? { rejectUnauthorized: false } : undefined });
    const db = drizzle(pool);
    
    const ev = await db.select().from(events);
    const grp = await db.select().from(groups);
    
    const foundEvents = ev.filter(e => e.title.includes('Teresa'));
    const foundGroups = grp.filter(g => g.name.includes('Teresa'));
    
    if (foundEvents.length > 0) console.log(`  -> Found in events:`, foundEvents.map(e => e.title));
    if (foundGroups.length > 0) console.log(`  -> Found in groups:`, foundGroups.map(g => g.name));
    if (foundEvents.length === 0 && foundGroups.length === 0) console.log(`  -> No Teresa data found here.`);
    
    await pool.end();
  } catch (err: any) {
    console.log(`  -> Error connecting: ${err.message}`);
  }
}

async function run() {
  const localUrl = 'postgresql://postgres:postgres@127.0.0.1:5432/split_local?sslmode=disable';
  const neonUrl = 'postgresql://neondb_owner:npg_0lxTYBLMgh2r@ep-twilight-flower-anebzpau-pooler.c-6.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';
  
  await checkDb('Local DB', localUrl);
  await checkDb('Neon DB', neonUrl);
  
  process.exit(0);
}

run();
