#!/usr/bin/env node
/**
 * Comprehensive Database Diagnostic Script
 * Checks schema, constraints, and data integrity for the expense feature
 */
import postgres from 'postgres';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const sql = postgres(process.env.DATABASE_URL);

async function runDiagnostics() {
  console.log('\n╔════════════════════════════════════════════════════════════════╗');
  console.log('║           DATABASE DIAGNOSTIC REPORT - EXPENSES FEATURE         ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  try {
    // 1. Check Schema
    console.log('📋 SCHEMA CHECK');
    console.log('─'.repeat(60));

    const expensesCols = await sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'expenses'
      ORDER BY ordinal_position
    `;

    console.log('Expenses table columns:');
    expensesCols.forEach((col) => {
      const nullable = col.is_nullable === 'YES' ? '✓ NULL' : '✗ NOT NULL';
      console.log(`  • ${col.column_name.padEnd(20)} ${col.data_type.padEnd(18)} ${nullable}`);
    });

    // 2. Check Foreign Keys
    console.log('\n🔗 FOREIGN KEY CONSTRAINTS');
    console.log('─'.repeat(60));

    const fks = await sql`
      SELECT
        tc.constraint_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_name = 'expenses'
    `;

    if (fks.length === 0) {
      console.log('⚠️  NO FOREIGN KEY CONSTRAINTS FOUND!');
    } else {
      fks.forEach((fk) => {
        console.log(`  • ${fk.column_name} → ${fk.foreign_table_name}(${fk.foreign_column_name})`);
      });
    }

    // 3. Data Integrity Check
    console.log('\n📊 DATA INTEGRITY CHECK');
    console.log('─'.repeat(60));

    const counts = await sql`
      SELECT 
        (SELECT COUNT(*) FROM expenses) as total_expenses,
        (SELECT COUNT(*) FROM expenses WHERE event_id IS NOT NULL) as expenses_with_event,
        (SELECT COUNT(*) FROM expenses WHERE event_id IS NULL) as expenses_without_event,
        (SELECT COUNT(*) FROM events) as total_events,
        (SELECT COUNT(*) FROM events WHERE group_id IS NOT NULL) as events_with_group
    `;

    const c = counts[0];
    console.log(`  Total expenses: ${c.total_expenses}`);
    console.log(`  ├─ With event_id: ${c.expenses_with_event}`);
    console.log(`  └─ Without event_id (orphaned): ${c.expenses_without_event}`);
    console.log(`  Total events: ${c.total_events}`);
    console.log(`  └─ With group_id: ${c.events_with_group}`);

    // 4. Recent Expenses (last 10)
    console.log('\n📝 RECENT EXPENSES (Last 10)');
    console.log('─'.repeat(60));

    const expenses = await sql`
      SELECT 
        e.id,
        e.description,
        e.amount,
        e.event_id,
        e.group_id,
        e.paid_by,
        e.category,
        e.created_at,
        ev.title as event_title,
        ev.group_id as event_group_id
      FROM expenses e
      LEFT JOIN events ev ON e.event_id = ev.id
      ORDER BY e.created_at DESC
      LIMIT 10
    `;

    if (expenses.length === 0) {
      console.log('  (no expenses found)');
    } else {
      expenses.forEach((exp, idx) => {
        console.log(`\n  ${idx + 1}. ${exp.description || '(no description)'}`);
        console.log(`     ID: ${exp.id}`);
        console.log(`     Amount: $${(exp.amount / 100).toFixed(2)} (${exp.amount} cents)`);
        console.log(
          `     Event: ${exp.event_id ? `${exp.event_title} (${exp.event_id})` : '❌ NOT LINKED'}`
        );
        console.log(`     Group: ${exp.group_id || '(null)'}`);
        console.log(`     Paid by: ${exp.paid_by}`);
        console.log(`     Category: ${exp.category}`);
        console.log(`     Created: ${new Date(exp.created_at).toLocaleString()}`);
      });
    }

    // 5. Check for broken relationships
    console.log('\n\n🔍 RELATIONSHIP VALIDATION');
    console.log('─'.repeat(60));

    const orphanedExpenses = await sql`
      SELECT COUNT(*) as count
      FROM expenses e
      WHERE e.event_id IS NOT NULL AND NOT EXISTS (
        SELECT 1 FROM events ev WHERE ev.id = e.event_id
      )
    `;

    console.log(`Expenses with missing events: ${orphanedExpenses[0].count}`);

    const orphanedActivities = await sql`
      SELECT COUNT(*) as count
      FROM expenses e
      WHERE e.activity_id IS NOT NULL AND NOT EXISTS (
        SELECT 1 FROM activities a WHERE a.id = e.activity_id
      )
    `;

    console.log(`Expenses with missing activities: ${orphanedActivities[0].count}`);

    // 6. Query Test (to see if API would find them)
    console.log('\n\n🧪 API QUERY TEST');
    console.log('─'.repeat(60));

    const recentEvent = await sql`
      SELECT id, title, group_id, created_at
      FROM events
      ORDER BY created_at DESC
      LIMIT 1
    `;

    if (recentEvent.length > 0) {
      const evt = recentEvent[0];
      console.log(`\nMost recent event: "${evt.title}" (${evt.id})`);
      console.log(`Created: ${new Date(evt.created_at).toLocaleString()}`);

      const expensesForEvent = await sql`
        SELECT id, description, amount, category, created_at
        FROM expenses
        WHERE event_id = ${evt.id}
      `;

      console.log(`Expenses for this event: ${expensesForEvent.length}`);
      if (expensesForEvent.length > 0) {
        expensesForEvent.forEach((exp) => {
          console.log(`  ✓ ${exp.description}: $${(exp.amount / 100).toFixed(2)}`);
        });
      } else {
        console.log(`  ⚠️  No expenses found (check if event_id was saved)}`);
      }
    }

    // 7. Database Statistics
    console.log('\n\n📈 DATABASE STATISTICS');
    console.log('─'.repeat(60));

    const stats = await sql`
      SELECT 
        (SELECT COUNT(*) FROM humans) as humans,
        (SELECT COUNT(*) FROM customers) as customers,
        (SELECT COUNT(*) FROM expense_groups) as groups,
        (SELECT COUNT(*) FROM events) as events,
        (SELECT COUNT(*) FROM activities) as activities,
        (SELECT COUNT(*) FROM expenses) as expenses,
        (SELECT COUNT(*) FROM expense_splits) as splits,
        (SELECT COUNT(*) FROM group_members) as group_members
    `;

    const s = stats[0];
    console.log(`  Humans: ${s.humans}`);
    console.log(`  Customers: ${s.customers}`);
    console.log(`  Groups: ${s.groups}`);
    console.log(`  Events: ${s.events}`);
    console.log(`  Activities: ${s.activities}`);
    console.log(`  Expenses: ${s.expenses}`);
    console.log(`  Expense Splits: ${s.splits}`);
    console.log(`  Group Members: ${s.group_members}`);

    console.log('\n✅ Diagnostic complete!\n');
  } catch (error) {
    console.error('\n❌ Error during diagnostics:', error.message);
    if (error.detail) console.error('Detail:', error.detail);
  } finally {
    await sql.end();
  }
}

runDiagnostics();
