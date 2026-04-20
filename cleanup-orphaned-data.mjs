#!/usr/bin/env node

import pkg from 'pg';
const { Client } = pkg;
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local', override: true });

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    console.error('❌ DATABASE_URL not found in .env.local');
    process.exit(1);
}

console.log('🔍 Analyzing orphaned expenses...\n');

const client = new Client({ connectionString });

try {
    await client.connect();
    console.log('✅ Connected to database\n');

    // Find orphaned expenses
    const orphanedQuery = `
        SELECT e.id, e.event_id, e.group_id, e.activity_id, e.description
        FROM expenses e
        LEFT JOIN events ev ON e.event_id = ev.id
        WHERE e.event_id IS NOT NULL AND ev.id IS NULL
        ORDER BY e.created_at DESC;
    `;

    const orphanedResult = await client.query(orphanedQuery);
    
    console.log(`Found ${orphanedResult.rows.length} orphaned expenses:\n`);
    
    if (orphanedResult.rows.length > 0) {
        console.log('Orphaned Expenses:');
        orphanedResult.rows.forEach((row, idx) => {
            console.log(`  ${idx + 1}. ${row.description}`);
            console.log(`     ID: ${row.id}`);
            console.log(`     Event ID: ${row.event_id} (MISSING)`);
            console.log(`     Group ID: ${row.group_id || 'null'}`);
            console.log(`     Activity ID: ${row.activity_id || 'null'}`);
        });

        console.log('\n📋 HANDLING OPTIONS:');
        console.log('1. Delete orphaned expenses (clean slate)');
        console.log('2. Set event_id to NULL and link to group/activity');
        console.log('3. Manually specify event replacements');
        console.log('\nProceeding with option 1 (delete orphaned expenses)...\n');

        // Delete orphaned expenses
        const deleteQuery = `
            DELETE FROM expenses 
            WHERE event_id IS NOT NULL 
            AND event_id NOT IN (
                SELECT id FROM events
            );
        `;

        const deleteResult = await client.query(deleteQuery);
        console.log(`✅ Deleted ${deleteResult.rowCount} orphaned expenses\n`);
    }

    // Check for activities without events
    const orphanedActivitiesQuery = `
        SELECT a.id, a.event_id, a.title
        FROM activities a
        LEFT JOIN events e ON a.event_id = e.id
        WHERE a.event_id IS NOT NULL AND e.id IS NULL;
    `;

    const orphanedActivitiesResult = await client.query(orphanedActivitiesQuery);
    console.log(`Found ${orphanedActivitiesResult.rows.length} orphaned activities:\n`);

    if (orphanedActivitiesResult.rows.length > 0) {
        console.log('Orphaned Activities:');
        orphanedActivitiesResult.rows.forEach((row, idx) => {
            console.log(`  ${idx + 1}. ${row.title} (ID: ${row.id})`);
        });

        console.log('\nDeleting orphaned activities...\n');
        
        const deleteActivitiesQuery = `
            DELETE FROM activities 
            WHERE event_id IS NOT NULL 
            AND event_id NOT IN (
                SELECT id FROM events
            );
        `;

        const deleteActivitiesResult = await client.query(deleteActivitiesQuery);
        console.log(`✅ Deleted ${deleteActivitiesResult.rowCount} orphaned activities\n`);
    }

    // Check for splits without expenses
    const orphanedSplitsQuery = `
        SELECT es.id, es.expense_id
        FROM expense_splits es
        LEFT JOIN expenses e ON es.expense_id = e.id
        WHERE e.id IS NULL;
    `;

    const orphanedSplitsResult = await client.query(orphanedSplitsQuery);
    console.log(`Found ${orphanedSplitsResult.rows.length} orphaned expense splits:\n`);

    if (orphanedSplitsResult.rows.length > 0) {
        console.log('Deleting orphaned expense splits...\n');
        
        const deleteSplitsQuery = `
            DELETE FROM expense_splits 
            WHERE expense_id NOT IN (
                SELECT id FROM expenses
            );
        `;

        const deleteSplitsResult = await client.query(deleteSplitsQuery);
        console.log(`✅ Deleted ${deleteSplitsResult.rowCount} orphaned expense splits\n`);
    }

    console.log('✅ Data cleanup complete!\n');
    console.log('📊 DATABASE STATUS:');
    const statusQuery = `
        SELECT 
            (SELECT COUNT(*) FROM events) as events,
            (SELECT COUNT(*) FROM activities) as activities,
            (SELECT COUNT(*) FROM expenses) as expenses,
            (SELECT COUNT(*) FROM expense_splits) as splits;
    `;
    
    const statusResult = await client.query(statusQuery);
    const row = statusResult.rows[0];
    console.log(`  Events: ${row.events}`);
    console.log(`  Activities: ${row.activities}`);
    console.log(`  Expenses: ${row.expenses}`);
    console.log(`  Splits: ${row.splits}\n`);

    await client.end();
    console.log('✅ Cleanup complete!');
    
} catch (error) {
    console.error('❌ Cleanup failed:', error.message);
    if (error.detail) console.error('Details:', error.detail);
    process.exit(1);
}
