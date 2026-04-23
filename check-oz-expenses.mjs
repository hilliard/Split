import postgres from 'postgres';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const sql = postgres();

try {
  // Get the Trip to Oz event and its expenses
  const result = await sql`
    SELECT 
      e.title,
      e.id,
      COUNT(ex.id) as expense_count,
      SUM(ex.amount) as total_amount_raw,
      array_agg(jsonb_build_object('amount', ex.amount, 'tip', ex.tip_amount, 'desc', ex.description)) as expenses
    FROM events e
    LEFT JOIN expenses ex ON ex.event_id = e.id
    WHERE e.title LIKE '%Oz%'
    GROUP BY e.id, e.title
  `;

  console.log('Trip to Oz - Raw Database Values:\n');
  result.forEach((row) => {
    console.log(`Event: ${row.title}`);
    console.log(`Expense count: ${row.expense_count}`);
    console.log(`Total amount (raw): ${row.total_amount_raw}`);
    console.log(`Type of total_amount_raw: ${typeof row.total_amount_raw}`);
    console.log('\nIndividual expenses:');
    row.expenses.forEach((exp, i) => {
      console.log(
        `  ${i + 1}. amount=${exp.amount} (type: ${typeof exp.amount}), tip=${exp.tip}, desc="${exp.desc}"`
      );
    });
  });

  process.exit(0);
} catch (error) {
  console.error('Error:', error);
  process.exit(1);
}
