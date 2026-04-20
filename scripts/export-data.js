#!/usr/bin/env node
/**
 * Split Database Export Tool
 * 
 * Exports expense data for external analysis tools (Tableau, Power BI, Excel, R, Python, etc.)
 * 
 * USAGE:
 *   node scripts/export-data.js --format csv --view expenses
 *   node scripts/export-data.js --format json --view settlements --output settlements.json
 *   node scripts/export-data.js --format csv --view all
 * 
 * FORMATS: csv, json, tsv, sql-insert
 * VIEWS: expenses, settlements, categories, events, users, groups, trends, all
 */

import pkg from 'pg';
const { Client } = pkg;
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { createReadStream, createWriteStream } from 'fs';

dotenv.config({ path: '.env.local' });

const args = process.argv.slice(2);
const format = args.find(a => a.startsWith('--format'))?.split('=')[1] || 'csv';
const viewName = args.find(a => a.startsWith('--view'))?.split('=')[1] || 'expenses';
const output = args.find(a => a.startsWith('--output'))?.split('=')[1] || `export_${viewName}_${new Date().toISOString().split('T')[0]}.${format}`;

const views = {
  expenses: 'expense_summary_for_analysis',
  settlements: 'expense_splits_for_analysis',
  payers: 'user_payer_summary_for_analysis',
  participants: 'user_participant_summary_for_analysis',
  categories: 'category_spending_for_analysis',
  events: 'events_summary_for_analysis',
  groups: 'group_spending_for_analysis',
  trends: 'daily_spending_trend_for_analysis',
};

// ⚠️  IMPORTANT: All views include UNIQUE usernames for unambiguous identification
// Username fields (username) are unique in the database and safe for data merges
// Display name fields (first_name, last_name) are kept for UI readability but NOT unique
// Always use username as the primary key for integration with external tools

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

async function exportData() {
  try {
    await client.connect();
    console.log(`📊 Exporting data from Split database\n`);

    // Handle "all" view
    if (viewName === 'all') {
      console.log('🔄 Exporting all views...');
      const allExports = [];
      for (const [name, view] of Object.entries(views)) {
        const data = await fetchViewData(view);
        const fileName = `export_${name}_${new Date().toISOString().split('T')[0]}.${format}`;
        await writeFile(fileName, data, format);
        allExports.push(fileName);
      }
      console.log(`\n✅ Exported ${allExports.length} files:`);
      allExports.forEach(f => console.log(`   - ${f}`));
    } else {
      // Single view
      const viewName_trimmed = viewName.trim();
      const viewQuery = views[viewName_trimmed];
      
      if (!viewQuery) {
        console.error(`❌ Unknown view: ${viewName_trimmed}`);
        console.error(`Available views: ${Object.keys(views).join(', ')}`);
        process.exit(1);
      }

      console.log(`📋 View: ${viewName_trimmed}`);
      console.log(`📁 Output: ${output}`);
      console.log(`📄 Format: ${format}\n`);

      const data = await fetchViewData(viewQuery);
      const result = await writeFile(output, data, format);
      
      console.log(`✅ Export complete!`);
      console.log(`   Rows: ${data.length}`);
      console.log(`   File size: ${(result / 1024).toFixed(2)} KB`);
    }

  } catch (error) {
    console.error('❌ Export failed:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

async function fetchViewData(viewName) {
  console.log(`🔍 Fetching data from ${viewName}...`);
  const result = await client.query(`SELECT * FROM ${viewName};`);
  console.log(`   Found ${result.rows.length} rows`);
  return result.rows;
}

async function writeFile(fileName, data, format) {
  if (data.length === 0) {
    console.warn('⚠️  No data to export');
    return 0;
  }

  let content;
  switch (format) {
    case 'csv':
      content = convertToCSV(data);
      break;
    case 'json':
      content = JSON.stringify(data, null, 2);
      break;
    case 'tsv':
      content = convertToCSV(data, '\t');
      break;
    case 'sql-insert':
      content = convertToSQL(data);
      break;
    default:
      throw new Error(`Unsupported format: ${format}`);
  }

  fs.writeFileSync(fileName, content);
  console.log(`✅ Saved to: ${fileName}`);
  
  return content.length;
}

function convertToCSV(rows, delimiter = ',') {
  if (rows.length === 0) return '';

  // Get headers from first row
  const headers = Object.keys(rows[0]);
  const headerRow = headers.map(h => `"${h}"`).join(delimiter);

  // Convert rows
  const csvRows = rows.map(row => {
    return headers.map(header => {
      const value = row[header];
      
      // Handle null/undefined
      if (value === null || value === undefined) {
        return '';
      }
      
      // Handle booleans
      if (typeof value === 'boolean') {
        return value ? 'TRUE' : 'FALSE';
      }
      
      // Handle strings with special characters
      if (typeof value === 'string') {
        if (value.includes(delimiter) || value.includes('"') || value.includes('\n')) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return `"${value}"`;
      }
      
      // Numbers and dates
      return String(value);
    }).join(delimiter);
  });

  return [headerRow, ...csvRows].join('\n');
}

function convertToSQL(rows) {
  if (rows.length === 0) return '';

  // This is a simplified version - for production, use proper SQL escaping
  const firstRow = rows[0];
  const columns = Object.keys(firstRow);
  const tableName = 'export_data';

  const statements = rows.map(row => {
    const values = columns.map(col => {
      const value = row[col];
      if (value === null || value === undefined) return 'NULL';
      if (typeof value === 'string') return `'${value.replace(/'/g, "''")}'`;
      if (typeof value === 'boolean') return value ? 'TRUE' : 'FALSE';
      return value;
    });
    
    return `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${values.join(', ')});`;
  });

  return statements.join('\n');
}

// Run
exportData();
