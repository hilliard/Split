ALTER TABLE "expenses" ALTER COLUMN "amount" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "expenses" ALTER COLUMN "description" SET DATA TYPE varchar(500);--> statement-breakpoint
ALTER TABLE "expenses" ALTER COLUMN "description" SET DEFAULT '';--> statement-breakpoint
ALTER TABLE "expenses" ALTER COLUMN "description" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "expenses" ALTER COLUMN "paid_by" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "activities" ADD COLUMN "metadata" json DEFAULT '{}'::json;--> statement-breakpoint
ALTER TABLE "expenses" ADD COLUMN "group_id" uuid;--> statement-breakpoint
ALTER TABLE "expenses" ADD COLUMN "tip_amount" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_group_id_expense_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."expense_groups"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_expenses_group_id" ON "expenses" USING btree ("group_id");