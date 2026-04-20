import fs from 'fs';
import pkg from 'pg';
import dotenv from 'dotenv';

const { Pool } = pkg;

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

(async () => {
  try {
    console.log('📚 Reading analytics views...');
    const sql = fs.readFileSync('./analytics/materialized_views.sql', 'utf8');
    
    console.log('🔄 Executing SQL views...');
    const client = await pool.connect();
    
    // Split by semicolons and execute each statement
    const statements = sql.split(';').filter(s => s.trim());
    for (const stmt of statements) {
      if (stmt.trim()) {
        console.log('   📝 ' + stmt.trim().substring(0, 60) + '...');
        await client.query(stmt);
      }
    }
    
    client.release();
    
    console.log('\n✅ All views created successfully!');
    
    // Verify views exist
    const result = await pool.query(
      'SELECT table_name FROM information_schema.views WHERE table_schema = \'public\' ORDER BY table_name;'
    );
    console.log('\n📊 Available views:');
    result.rows.forEach(row => console.log('   - ' + row.table_name));
    
    await pool.end();
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
})();
