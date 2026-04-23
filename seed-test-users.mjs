import pg from 'pg';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function hashPassword(password) {
  return bcrypt.hash(password, 10);
}

(async () => {
  try {
    console.log('\n🌱 Creating test users...\n');

    const testUsers = [
      {
        firstName: 'Alice',
        lastName: 'Test',
        username: 'alice',
        password: 'AlicePass123',
      },
      {
        firstName: 'Charlie',
        lastName: 'Test',
        username: 'charlie',
        password: 'CharliePass123',
      },
      {
        firstName: 'Frank',
        lastName: 'Test',
        username: 'frank',
        password: 'FrankPass123',
      },
      {
        firstName: 'Grace',
        lastName: 'Test',
        username: 'grace',
        password: 'GracePass123',
      },
    ];

    for (const user of testUsers) {
      // Check if user already exists
      const existing = await pool.query('SELECT id FROM customers WHERE username = $1', [
        user.username,
      ]);

      if (existing.rows.length > 0) {
        console.log(`⏭️  ${user.username} already exists, skipping`);
        continue;
      }

      // Create human
      const humanId = uuidv4();
      await pool.query(`INSERT INTO humans (id, first_name, last_name) VALUES ($1, $2, $3)`, [
        humanId,
        user.firstName,
        user.lastName,
      ]);
      console.log(`✓ Created human: ${user.firstName} ${user.lastName}`);

      // Hash password
      const passwordHash = await hashPassword(user.password);

      // Create customer
      const customerId = uuidv4();
      await pool.query(
        `INSERT INTO customers (id, human_id, username, password_hash) VALUES ($1, $2, $3, $4)`,
        [customerId, humanId, user.username, passwordHash]
      );
      console.log(`✓ Created customer: ${user.username}`);
    }

    console.log('\n✅ Test users created successfully!\n');
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
})();
