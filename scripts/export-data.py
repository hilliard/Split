#!/usr/bin/env python3
"""
Split Database Export Tool (Python Version)

Exports expense data for external analysis with pandas/numpy support.

USAGE:
    python scripts/export-data.py --format csv --view expenses
    python scripts/export-data.py --format parquet --view settlements
    python scripts/export-data.py --format all --output ./exports/

REQUIREMENTS:
    pip install psycopg2-binary python-dotenv pandas pyarrow openpyxl

FORMATS: csv, json, parquet, excel, pickle, sql-insert
VIEWS: expenses, settlements, categories, events, users, groups, trends, all
"""

import psycopg2
import pandas as pd
import json
import os
import sys
import argparse
from datetime import datetime
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables
load_dotenv('.env.local')

DATABASE_URL = os.getenv('DATABASE_URL')
if not DATABASE_URL:
    print("❌ DATABASE_URL not found in .env.local")
    sys.exit(1)

VIEWS = {
    'expenses': 'expense_summary_for_analysis',
    'settlements': 'user_settlement_summary_for_analysis',
    'categories': 'category_spending_for_analysis',
    'events': 'event_summary_for_analysis',
    'users': 'user_spending_profile_for_analysis',
    'groups': 'group_summary_for_analysis',
    'trends': 'daily_spending_trend_for_analysis',
}


def get_connection():
    """Create database connection"""
    try:
        conn = psycopg2.connect(DATABASE_URL)
        return conn
    except psycopg2.Error as e:
        print(f"❌ Connection failed: {e}")
        sys.exit(1)


def fetch_view_data(view_name):
    """Fetch data from a view into a pandas DataFrame"""
    conn = get_connection()
    try:
        print(f"🔍 Fetching data from {view_name}...")
        df = pd.read_sql_query(f"SELECT * FROM {view_name};", conn)
        print(f"   Found {len(df)} rows, {len(df.columns)} columns")
        return df
    except Exception as e:
        print(f"❌ Query failed: {e}")
        sys.exit(1)
    finally:
        conn.close()


def export_csv(df, output_path):
    """Export to CSV"""
    df.to_csv(output_path, index=False)
    print(f"✅ Exported to CSV: {output_path}")


def export_json(df, output_path):
    """Export to JSON"""
    df.to_json(output_path, orient='records', indent=2, date_format='iso')
    print(f"✅ Exported to JSON: {output_path}")


def export_parquet(df, output_path):
    """Export to Parquet (efficient for large datasets)"""
    try:
        df.to_parquet(output_path, engine='pyarrow')
        print(f"✅ Exported to Parquet: {output_path}")
    except ImportError:
        print("❌ Parquet export requires: pip install pyarrow")
        sys.exit(1)


def export_excel(df, output_path):
    """Export to Excel"""
    try:
        df.to_excel(output_path, index=False, sheet_name='Data')
        print(f"✅ Exported to Excel: {output_path}")
    except ImportError:
        print("❌ Excel export requires: pip install openpyxl")
        sys.exit(1)


def export_pickle(df, output_path):
    """Export to Pickle (Python native format)"""
    df.to_pickle(output_path)
    print(f"✅ Exported to Pickle: {output_path}")


def export_sql_insert(df, output_path, table_name='export_data'):
    """Generate SQL INSERT statements"""
    lines = []
    for _, row in df.iterrows():
        columns = ', '.join(df.columns)
        values = ', '.join([
            'NULL' if pd.isna(v) else f"'{str(v).replace(chr(39), chr(39)*2)}'" if isinstance(v, str) else str(v)
            for v in row
        ])
        lines.append(f"INSERT INTO {table_name} ({columns}) VALUES ({values});")
    
    with open(output_path, 'w') as f:
        f.write('\n'.join(lines))
    print(f"✅ Exported SQL inserts: {output_path}")


def get_file_size_str(path):
    """Get human-readable file size"""
    size_bytes = os.path.getsize(path)
    for unit in ['B', 'KB', 'MB', 'GB']:
        if size_bytes < 1024:
            return f"{size_bytes:.2f} {unit}"
        size_bytes /= 1024
    return f"{size_bytes:.2f} TB"


def export_view(view_key, output_format):
    """Export a single view"""
    if view_key not in VIEWS:
        print(f"❌ Unknown view: {view_key}")
        print(f"Available views: {', '.join(VIEWS.keys())}")
        sys.exit(1)

    view_name = VIEWS[view_key]
    date_str = datetime.now().strftime('%Y-%m-%d')
    output_path = f"export_{view_key}_{date_str}.{output_format}"
    
    print(f"📊 Exporting data from Split database\n")
    print(f"📋 View: {view_key}")
    print(f"📁 Output: {output_path}")
    print(f"📄 Format: {output_format}\n")

    df = fetch_view_data(view_name)
    
    if df.empty:
        print("⚠️  No data to export")
        return

    # Export based on format
    exporters = {
        'csv': export_csv,
        'json': export_json,
        'parquet': export_parquet,
        'excel': export_excel,
        'pickle': export_pickle,
        'sql-insert': lambda df, path: export_sql_insert(df, path),
    }

    if output_format not in exporters:
        print(f"❌ Unsupported format: {output_format}")
        print(f"Supported formats: {', '.join(exporters.keys())}")
        sys.exit(1)

    exporters[output_format](df, output_path)
    
    print(f"   Rows: {len(df)}")
    print(f"   Columns: {len(df.columns)}")
    print(f"   File size: {get_file_size_str(output_path)}\n")
    print(f"✅ Export complete!")


def export_all_views(output_format, output_dir='./exports'):
    """Export all views to separate files"""
    Path(output_dir).mkdir(exist_ok=True)
    
    print(f"📊 Exporting all views to {output_dir}\n")
    
    exported_files = []
    for view_key in VIEWS.keys():
        view_name = VIEWS[view_key]
        date_str = datetime.now().strftime('%Y-%m-%d')
        output_path = os.path.join(output_dir, f"export_{view_key}_{date_str}.{output_format}")
        
        print(f"🔄 Exporting {view_key}...")
        df = fetch_view_data(view_name)
        
        if not df.empty:
            exporters = {
                'csv': export_csv,
                'json': export_json,
                'parquet': export_parquet,
                'excel': export_excel,
                'pickle': export_pickle,
                'sql-insert': lambda df, path: export_sql_insert(df, path),
            }
            
            if output_format in exporters:
                exporters[output_format](df, output_path)
                exported_files.append((view_key, output_path, len(df)))
        else:
            print(f"   ⚠️  No data in {view_key}")
    
    print(f"\n✅ Exported {len(exported_files)} files:")
    for view_key, path, rows in exported_files:
        size = get_file_size_str(path)
        print(f"   - {view_key}: {rows} rows ({size})")


def main():
    parser = argparse.ArgumentParser(
        description='Export Split database views for external analysis'
    )
    parser.add_argument(
        '--view',
        default='expenses',
        help=f'View to export: {", ".join(VIEWS.keys())}, all'
    )
    parser.add_argument(
        '--format',
        default='csv',
        help='Export format: csv, json, parquet, excel, pickle, sql-insert'
    )
    parser.add_argument(
        '--output',
        help='Output file path (optional, auto-generated if not provided)'
    )
    parser.add_argument(
        '--output-dir',
        default='./exports',
        help='Output directory for --view all'
    )

    args = parser.parse_args()

    if args.view == 'all':
        export_all_views(args.format, args.output_dir)
    else:
        export_view(args.view, args.format)


if __name__ == '__main__':
    main()
