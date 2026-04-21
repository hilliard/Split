## Database Portability & Analytics Infrastructure

This document explains how to use the Split application's database for analysis, reporting, and external integrations.

### Quick Start

The database is now **fully portable** and analyzable:

1. **Pre-built Analysis Views** - 8 materialized views for common analysis tasks
2. **Export Utilities** - Node.js and Python tools for extracting data in multiple formats
3. **Complete Documentation** - Data dictionary explaining every table and column
4. **Safe Dollar Conversion** - All analytics views automatically convert from cents to dollars

### Architecture

The database uses **integer cents** throughout (standard accounting practice):

- `$100.50` is stored as `10050` (cents)
- All analytics views automatically convert to dollars with proper formatting
- This eliminates floating-point errors and ensures currency precision

### Analytics Views (SQL)

All 8 views are in `analytics/materialized_views.sql` and are already created in your database.

**Query them directly:**

```sql
SELECT * FROM expense_summary_for_analysis;
SELECT * FROM daily_spending_trend_for_analysis;
SELECT * FROM user_payer_summary_for_analysis;
```

#### Available Views:

1. **expense_summary_for_analysis** - All expenses with context (amount, tip, category, payer, dates)
2. **expense_splits_for_analysis** - Settlement data showing who owes what
3. **daily_spending_trend_for_analysis** - Daily aggregations for trend analysis
4. **category_spending_for_analysis** - Spending breakdown by expense category
5. **group_spending_for_analysis** - Group-level spending summaries
6. **user_payer_summary_for_analysis** - User statistics as expense creators
7. **user_participant_summary_for_analysis** - User statistics as split participants
8. **events_summary_for_analysis** - Event-level spending overview

### Export Data (Node.js)

**Export to CSV, JSON, Parquet, Excel:**

```bash
# Export single view to CSV
node scripts/export-data.js --view expenses --format csv

# Export all views to a directory
node scripts/export-data.js --view all --format csv --output ./exports/

# Supported formats: csv, json, parquet, excel, pickle, sql-insert
```

**Example Output:**

```bash
$ node scripts/export-data.js --view expenses --format json

📊 Exporting data from Split database

📋 View: expenses
📁 Output: export_expenses_2025-01-08.json
📄 Format: json

✅ Exported to JSON: export_expenses_2025-01-08.json
   Rows: 15
   Columns: 18
```

### Export Data (Python)

**Requirements:**

```bash
pip install psycopg2-binary python-dotenv pandas pyarrow openpyxl
```

**Export to CSV, JSON, Parquet, Excel:**

```bash
# Export expenses to CSV
python scripts/export-data.py --view expenses --format csv

# Export all views to Parquet (efficient for large datasets)
python scripts/export-data.py --view all --format parquet --output-dir ./exports/

# Supported formats: csv, json, parquet, excel, pickle, sql-insert
```

**Python Example:**

```python
import pandas as pd
from scripts.export_data import fetch_view_data

# Fetch data into pandas DataFrame
df = fetch_view_data('expense_summary_for_analysis')

# All amounts are already in dollars (converted from cents)
print(df[['expense_id', 'amount_dollars', 'tip_dollars', 'total_dollars']])

# Use with analysis tools
df.to_excel('expenses.xlsx')
df.to_csv('expenses.csv', index=False)
```

### Direct Database Access

**Connection String** (Neon PostgreSQL):

```
postgresql://neondb_owner:PASSWORD@ep-twilight-flower-anebzpau-pooler.c-6.us-east-1.aws.neon.tech/neondb?sslmode=require
```

**From DBeaver/DataGrip/pgAdmin:**

- Host: `ep-twilight-flower-anebzpau-pooler.c-6.us-east-1.aws.neon.tech`
- Port: `5432`
- Database: `neondb`
- User: `neondb_owner`
- Password: [check `.env.local`]

### Business Intelligence Tools

All views work seamlessly with BI tools:

#### Tableau

1. New Data Source → PostgreSQL
2. Enter connection details
3. Select view (e.g., `expense_summary_for_analysis`)
4. Create visualizations

#### Power BI

1. Get Data → PostgreSQL database
2. Query: `SELECT * FROM expense_summary_for_analysis`
3. Load into Power BI Desktop
4. Create reports

#### Excel

1. Data → Get Data → From Database → PostgreSQL
2. Query views or use export utilities
3. Create pivot tables and charts

#### Python/Pandas

```python
import pandas as pd
import psycopg2

conn = psycopg2.connect(os.getenv('DATABASE_URL'))
df = pd.read_sql_query("SELECT * FROM daily_spending_trend_for_analysis;", conn)
```

#### R

```r
library(RPostgreSQL)
conn <- dbConnect(PostgreSQL(),
  host="ep-twilight-flower-anebzpau-pooler.c-6.us-east-1.aws.neon.tech",
  user="neondb_owner",
  password=Sys.getenv("DB_PASSWORD"),
  dbname="neondb"
)
df <- dbGetQuery(conn, "SELECT * FROM expense_summary_for_analysis;")
```

### Data Dictionary

See `DATABASE_DATA_DICTIONARY.md` for complete schema documentation:

- All 8 tables explained
- 40+ columns documented
- Relationships between tables
- Units and conversions
- Example values and formats

### Important Notes

**Currency Storage:**

- Database stores ALL monetary values in **cents (integers)**
- Views automatically convert to dollars with proper decimal places
- No floating-point precision issues
- Example: $3.45 is stored as `345` cents and displayed as `3.45` dollars

**Units in Views:**

- All `*_dollars` columns are properly formatted (e.g., 10.50 for $10.50)
- All `*_cents` columns are integers
- Amounts always include tips
- No manual math needed in BI tools

**Performance:**

- Views use LEFT JOINs - safe for analysis (won't lose data due to missing joins)
- All date fields are DATE type and timezone-aware
- Indexes on all foreign keys ensure fast aggregations
- Designed for analytical queries on 10k-1M expense records

**Data Freshness:**

- Views query live tables (not snapshots)
- To create a fresh export: run export script
- No materialization delay - always current

### Creating Custom Views

**Add your own view to `analytics/materialized_views.sql`:**

```sql
DROP VIEW IF EXISTS my_custom_analysis CASCADE;
CREATE VIEW my_custom_analysis AS
SELECT
  e.created_at::DATE AS expense_date,
  COUNT(*) AS daily_expense_count,
  ROUND(SUM(e.amount) / 100.0::NUMERIC, 2) AS daily_total_dollars
FROM expenses e
GROUP BY e.created_at::DATE
ORDER BY expense_date DESC;
```

**Then execute:**

```bash
node execute-views.mjs
```

### Troubleshooting

**"Connection failed" error:**

- Check `.env.local` has `DATABASE_URL`
- Verify credentials and Neon connection is active
- Test: `psql $DATABASE_URL -c "SELECT 1;"`

**"View not found" error:**

- Views might not be created yet: `node execute-views.mjs`
- Verify: `SELECT table_name FROM information_schema.views WHERE table_schema = 'public';`

**Export has wrong amounts:**

- Check the view exports (should be in dollars already converted)
- All `*_dollars` columns are properly formatted from cents

**Large dataset performance:**

- Use Parquet format for large exports (more efficient than CSV)
- Consider exporting to cloud storage (S3, GCS) for BI tools
- Add WHERE clauses to views for date ranges

### Files Included

- `analytics/materialized_views.sql` - SQL views for analysis
- `scripts/export-data.js` - Node.js export utility (CSV, JSON, Parquet, Excel)
- `scripts/export-data.py` - Python export utility with pandas support
- `execute-views.mjs` - Script to create/recreate views in database
- `DATABASE_DATA_DICTIONARY.md` - Complete schema documentation

### Next Steps

1. **Explore the data:**

   ```bash
   node scripts/export-data.js --view all --format csv --output ./exports/
   ```

2. **Load into BI tool:**
   - Tableau/Power BI: Connect to PostgreSQL and query views
   - Excel: Use Python script to export to `.xlsx`
   - Python/R: Use connection utilities

3. **Create custom reports:**
   - Add your own views to `analytics/materialized_views.sql`
   - Use BI tool to create dashboards
   - Schedule exports for automated reporting

4. **Integrate with external tools:**
   - Zapier workflows reading from views
   - Scheduled data syncs to data warehouse
   - API endpoints serving view data

### Support

For questions about data structure, see `DATABASE_DATA_DICTIONARY.md`.

For currency conversions, all views handle this automatically - no manual math needed.

All amounts in views are in dollars with proper decimal places.
