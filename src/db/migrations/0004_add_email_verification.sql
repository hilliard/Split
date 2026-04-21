-- Add email and verification fields to customers
ALTER TABLE "customers" ADD COLUMN "email" varchar(255);
--> statement-breakpoint
ALTER TABLE "customers" ADD COLUMN "email_verified" boolean DEFAULT false NOT NULL;
--> statement-breakpoint
-- Create email verification tokens table
CREATE TABLE "email_verification_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_id" uuid NOT NULL,
	"email" varchar(255) NOT NULL,
	"token" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"verified_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "email_verification_tokens_token_unique" UNIQUE("token")
);
--> statement-breakpoint
ALTER TABLE "email_verification_tokens" ADD CONSTRAINT "email_verification_tokens_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "email_tokens_customer_idx" ON "email_verification_tokens" USING btree ("customer_id");
--> statement-breakpoint
CREATE INDEX "email_tokens_email_idx" ON "email_verification_tokens" USING btree ("email");
--> statement-breakpoint
CREATE INDEX "email_tokens_token_idx" ON "email_verification_tokens" USING btree ("token");
--> statement-breakpoint
CREATE INDEX "email_tokens_expires_at_idx" ON "email_verification_tokens" USING btree ("expires_at");
--> statement-breakpoint
CREATE INDEX "customers_email_idx" ON "customers" USING btree ("email");
--> statement-breakpoint
CREATE INDEX "customers_verified_idx" ON "customers" USING btree ("email_verified");
--> statement-breakpoint
-- Add unique constraint on email (after data migration if needed)
ALTER TABLE "customers" ADD CONSTRAINT "customers_email_unique" UNIQUE("email");
