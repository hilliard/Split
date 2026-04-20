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

console.log('🧪 COMPREHENSIVE DATABASE INTEGRITY TEST\n');
console.log('╔════════════════════════════════════════════════════════════════╗');
console.log('║         Testing Foreign Key Constraint Enforcement             ║');
console.log('╚════════════════════════════════════════════════════════════════╝\n');

const client = new Client({ connectionString });

try {
    await client.connect();
    console.log('✅ Connected to database\n');

    // Test 1: Try to insert an expense with non-existent event
    console.log('TEST 1: Insert expense with invalid event_id (should FAIL)');
    console.log('────────────────────────────────────────────────────────────');
    try {
        const invalidEventId = '00000000-0000-0000-0000-000000000000';
        const validPayer = await client.query(
            'SELECT id FROM humans LIMIT 1'
        );
        
        if (validPayer.rows.length === 0) {
            console.log('⚠️  No valid payer found in database');
        } else {
            const payerId = validPayer.rows[0].id;
            
            await client.query(
                `INSERT INTO expenses (id, event_id, amount, description, paid_by, category) 
                 VALUES ($1, $2, $3, $4, $5, $6)`,
                [
                    '11111111-1111-1111-1111-111111111111',
                    invalidEventId,
                    10000,
                    'Invalid expense',
                    payerId,
                    'misc'
                ]
            );
            console.log('❌ FAILED: Should have rejected invalid event_id!\n');
        }
    } catch (error) {
        if (error.code === '23503') {
            console.log('✅ PASSED: FK constraint correctly rejected invalid event_id');
            console.log(`   Error: ${error.message.substring(0, 80)}...\n`);
        } else {
            console.log(`⚠️  Unexpected error: ${error.message}\n`);
        }
    }

    // Test 2: Try to insert an expense with non-existent payer
    console.log('TEST 2: Insert expense with invalid paid_by (should FAIL)');
    console.log('────────────────────────────────────────────────────────────');
    try {
        const validEvent = await client.query(
            'SELECT id FROM events LIMIT 1'
        );
        
        if (validEvent.rows.length === 0) {
            console.log('⚠️  No valid event found in database');
        } else {
            const eventId = validEvent.rows[0].id;
            const invalidPayerId = '22222222-2222-2222-2222-222222222222';
            
            await client.query(
                `INSERT INTO expenses (id, event_id, amount, description, paid_by, category) 
                 VALUES ($1, $2, $3, $4, $5, $6)`,
                [
                    '22222222-2222-2222-2222-222222222222',
                    eventId,
                    10000,
                    'Invalid payer expense',
                    invalidPayerId,
                    'misc'
                ]
            );
            console.log('❌ FAILED: Should have rejected invalid paid_by!\n');
        }
    } catch (error) {
        if (error.code === '23503') {
            console.log('✅ PASSED: FK constraint correctly rejected invalid paid_by');
            console.log(`   Error: ${error.message.substring(0, 80)}...\n`);
        } else {
            console.log(`⚠️  Unexpected error: ${error.message}\n`);
        }
    }

    // Test 3: Insert valid expense (should SUCCEED)
    console.log('TEST 3: Insert valid expense (should SUCCEED)');
    console.log('────────────────────────────────────────────────────────────');
    try {
        const validEvent = await client.query(
            'SELECT id FROM events LIMIT 1'
        );
        
        const validPayer = await client.query(
            'SELECT id FROM humans LIMIT 1'
        );
        
        if (validEvent.rows.length === 0 || validPayer.rows.length === 0) {
            console.log('⚠️  No valid event or payer found in database\n');
        } else {
            const eventId = validEvent.rows[0].id;
            const payerId = validPayer.rows[0].id;
            const expenseId = '33333333-3333-3333-3333-333333333333';
            
            const result = await client.query(
                `INSERT INTO expenses (id, event_id, amount, description, paid_by, category) 
                 VALUES ($1, $2, $3, $4, $5, $6)
                 RETURNING id, event_id, amount, paid_by`,
                [
                    expenseId,
                    eventId,
                    5000,
                    'Test valid expense',
                    payerId,
                    'food'
                ]
            );
            
            console.log('✅ PASSED: Valid expense inserted successfully');
            console.log(`   ID: ${result.rows[0].id}`);
            console.log(`   Event: ${result.rows[0].event_id}`);
            console.log(`   Amount: $${(result.rows[0].amount / 100).toFixed(2)}`);
            console.log(`   Paid by: ${result.rows[0].paid_by}\n`);
            
            // Clean up
            await client.query('DELETE FROM expenses WHERE id = $1', [expenseId]);
        }
    } catch (error) {
        console.log(`❌ FAILED: Valid expense should have been inserted`);
        console.log(`   Error: ${error.message}\n`);
    }

    // Test 4: Cascading delete
    console.log('TEST 4: Verify cascading delete (delete event → delete expenses)');
    console.log('────────────────────────────────────────────────────────────');
    try {
        // Create a test event and expense
        const creator = await client.query(
            'SELECT id FROM humans LIMIT 1'
        );
        
        const testEventId = '44444444-4444-4444-4444-444444444444';
        const testExpenseId = '44444444-4444-4444-4444-444444444445';
        
        if (creator.rows.length === 0) {
            console.log('⚠️  No valid creator found\n');
        } else {
            const creatorId = creator.rows[0].id;
            
            // Create event
            await client.query(
                `INSERT INTO events (id, creator_id, title, start_time)
                 VALUES ($1, $2, $3, $4)`,
                [testEventId, creatorId, 'Test cascade event', new Date()]
            );
            
            // Create expense
            await client.query(
                `INSERT INTO expenses (id, event_id, amount, description, paid_by, category)
                 VALUES ($1, $2, $3, $4, $5, $6)`,
                [testExpenseId, testEventId, 5000, 'Cascade test', creatorId, 'misc']
            );
            
            console.log('📝 Created test event and expense');
            
            // Delete event
            await client.query('DELETE FROM events WHERE id = $1', [testEventId]);
            
            // Check if expense was deleted too
            const expenseCheck = await client.query(
                'SELECT id FROM expenses WHERE id = $1',
                [testExpenseId]
            );
            
            if (expenseCheck.rows.length === 0) {
                console.log('✅ PASSED: Cascading delete worked - expense was deleted when event was deleted\n');
            } else {
                console.log('❌ FAILED: Cascade delete did not work - expense still exists\n');
            }
        }
    } catch (error) {
        console.log(`⚠️  Cascade test error: ${error.message}\n`);
    }

    // Test 5: Current state summary
    console.log('TEST 5: Database State Summary');
    console.log('────────────────────────────────────────────────────────────');
    
    const counts = await client.query(`
        SELECT
            (SELECT COUNT(*) FROM events) as events,
            (SELECT COUNT(*) FROM activities) as activities,
            (SELECT COUNT(*) FROM expenses) as expenses,
            (SELECT COUNT(*) FROM expense_splits) as splits,
            (SELECT COUNT(*) FROM humans) as humans
    `);
    
    const row = counts.rows[0];
    console.log('Current database contents:');
    console.log(`  • Events: ${row.events}`);
    console.log(`  • Activities: ${row.activities}`);
    console.log(`  • Expenses: ${row.expenses}`);
    console.log(`  • Expense Splits: ${row.splits}`);
    console.log(`  • Humans: ${row.humans}\n`);
    
    // Test 6: Check FK constraints
    console.log('TEST 6: Verify All FK Constraints Exist');
    console.log('────────────────────────────────────────────────────────────');
    
    const fkCheck = await client.query(`
        SELECT constraint_name, table_name
        FROM information_schema.table_constraints
        WHERE table_name = 'expenses' AND constraint_type = 'FOREIGN KEY'
        ORDER BY constraint_name
    `);
    
    if (fkCheck.rows.length >= 4) {
        console.log(`✅ PASSED: All ${fkCheck.rows.length} FK constraints found:\n`);
        fkCheck.rows.forEach(fk => {
            console.log(`  ✓ ${fk.constraint_name}`);
        });
    } else {
        console.log(`❌ FAILED: Only found ${fkCheck.rows.length} FK constraints, expected 4+\n`);
        fkCheck.rows.forEach(fk => {
            console.log(`  ✗ ${fk.constraint_name}`);
        });
    }

    await client.end();
    console.log('\n╔════════════════════════════════════════════════════════════════╗');
    console.log('║                 ✅ ALL TESTS COMPLETED                        ║');
    console.log('╚════════════════════════════════════════════════════════════════╝');
    
} catch (error) {
    console.error('❌ Test suite error:', error.message);
    process.exit(1);
}
