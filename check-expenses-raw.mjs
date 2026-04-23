import pg from 'pg';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const { Client } = pg;
const client = new Client();

await client.connect();

try {
  // Get events and their expenses
  const result = await client.query(`
    SELECT 
      e.id as event_id,
      e.title,
      COUNT(ex.id) as expense_count,
      SUM(ex.amount) as total_amount_raw,
      SUM(ex.tip_amount) as total_tips_raw,
      (SUM(ex.amount) + COALESCE(SUM(ex.tip_amount), 0)) as grand_total_raw,
      array_agg(jsonb_build_object('amount', ex.amount, 'tip', ex.tip_amount, 'description', ex.description)) as expenses
    FROM events e
    LEFT JOIN expenses ex ON ex.event_id = e.id
    GROUP BY e.id, e.title
    ORDER BY e.created_at DESC
    LIMIT 5
  `);

  console.log('Raw database check:\n');
  result.rows.forEach((row) => {
    console.log(`Event: ${row.title} (${row.event_id})`);
    console.log(`  Expense count: ${row.expense_count}`);
    console.log(`  Total amount (raw): ${row.total_amount_raw}`);
    console.log(`  Total tips (raw): ${row.total_tips_raw}`);
    console.log(`  Grand total (raw): ${row.grand_total_raw}`);
    if (row.expenses && row.expenses[0]) {
      console.log(
        `  First expense: amount=${row.expenses[0].amount}, tip=${row.expenses[0].tip}, desc="${row.expenses[0].description}"`
      );
    }
    console.log();
  });
} catch (error) {
  console.error('Error:', error);
} finally {
  await client.end();
}
