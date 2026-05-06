import { db } from './src/db/index.js';
import { activities } from './src/db/schema.js';
import { asc, eq } from 'drizzle-orm';

async function main() {
  const allActivities = await db.select().from(activities).orderBy(asc(activities.sequenceOrder), asc(activities.startTime));
  for (const a of allActivities) {
    console.log(`${a.title} | Seq: ${a.sequenceOrder} | Start: ${a.startTime} | Created: ${a.createdAt}`);
  }
  process.exit(0);
}
main();
