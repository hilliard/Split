import { db } from './src/db/index.ts';
import { sql } from 'drizzle-orm';

const statements = [
  // Step 1: Add email column to customers (if it doesn't exist)
  `ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "email" varchar(255);`,

  // Step 2: Add email_verified column to customers (if it doesn't exist)
  `ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "email_verified" boolean DEFAULT false NOT NULL;`,

  // Step 3: Create email_verification_tokens table if it doesn't exist
  `CREATE TABLE IF NOT EXISTS "email_verification_tokens" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "customer_id" uuid NOT NULL,
    "email" varchar(255) NOT NULL,
    "token" text NOT NULL,
    "expires_at" timestamp NOT NULL,
    "verified_at" timestamp,
    "created_at" timestamp DEFAULT now() NOT NULL,
    CONSTRAINT "email_verification_tokens_token_unique" UNIQUE("token")
  );`,

  // Step 4: Add FK constraint if it doesn't exist
  `DO $$ 
   BEGIN
     IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
       WHERE constraint_name = 'email_verification_tokens_customer_id_customers_id_fk') THEN
       ALTER TABLE "email_verification_tokens" 
       ADD CONSTRAINT "email_verification_tokens_customer_id_customers_id_fk" 
       FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") 
       ON DELETE cascade ON UPDATE no action;
     END IF;
   END $$;`,

  // Step 5-8: Create indexes if they don't exist
  `CREATE INDEX IF NOT EXISTS "email_tokens_customer_idx" ON "email_verification_tokens" USING btree ("customer_id");`,
  `CREATE INDEX IF NOT EXISTS "email_tokens_email_idx" ON "email_verification_tokens" USING btree ("email");`,
  `CREATE INDEX IF NOT EXISTS "email_tokens_token_idx" ON "email_verification_tokens" USING btree ("token");`,
  `CREATE INDEX IF NOT EXISTS "email_tokens_expires_at_idx" ON "email_verification_tokens" USING btree ("expires_at");`,
  `CREATE INDEX IF NOT EXISTS "customers_email_idx" ON "customers" USING btree ("email");`,
  `CREATE INDEX IF NOT EXISTS "customers_verified_idx" ON "customers" USING btree ("email_verified");`,

  // Step 9: Add unique constraint on email if it doesn't exist
  `DO $$
   BEGIN
     IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
       WHERE constraint_name = 'customers_email_unique') THEN
       ALTER TABLE "customers" ADD CONSTRAINT "customers_email_unique" UNIQUE("email");
     END IF;
   END $$;`,
];

console.log(`Applying ${statements.length} SQL statements...\n`);

try {
  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i].trim();
    if (!statement) continue;

    console.log(`[${i + 1}/${statements.length}] Executing:`);
    console.log(statement.substring(0, 80) + (statement.length > 80 ? '...' : ''));

    try {
      await db.execute(sql.raw(statement));
      console.log('✓ Success\n');
    } catch (error) {
      if (error.message.includes('already exists') || error.message.includes('duplicate')) {
        console.log('⊘ Skipped (already exists)\n');
      } else {
        throw error;
      }
    }
  }

  console.log('✅ Email verification schema applied successfully!');
  process.exit(0);
} catch (error) {
  console.error('\n❌ Migration failed:', error.message);
  if (error.detail) console.error('Detail:', error.detail);
  process.exit(1);
}
