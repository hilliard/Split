import { db } from './src/db/index.js';
import { activities } from './src/db/schema.js';

async function main() {
  const allActivities = await db.select().from(activities);
  for (const a of allActivities) {
    console.log(`${a.title} | Sequence: ${a.sequenceOrder} | Start: ${a.startTime}`);
  }
  process.exit(0);
}
main();
