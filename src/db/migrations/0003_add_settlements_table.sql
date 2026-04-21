CREATE TABLE "settlements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"group_id" uuid,
	"from_user_id" uuid NOT NULL,
	"to_user_id" uuid NOT NULL,
	"amount" integer NOT NULL,
	"description" varchar(500) DEFAULT '',
	"status" varchar(50) DEFAULT 'pending' NOT NULL,
	"payment_method" varchar(100),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "settlements" ADD CONSTRAINT "settlements_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "settlements" ADD CONSTRAINT "settlements_group_id_expense_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."expense_groups"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "settlements" ADD CONSTRAINT "settlements_from_user_id_humans_id_fk" FOREIGN KEY ("from_user_id") REFERENCES "public"."humans"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "settlements" ADD CONSTRAINT "settlements_to_user_id_humans_id_fk" FOREIGN KEY ("to_user_id") REFERENCES "public"."humans"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "settlements_event_idx" ON "settlements" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "settlements_from_user_idx" ON "settlements" USING btree ("from_user_id");--> statement-breakpoint
CREATE INDEX "settlements_to_user_idx" ON "settlements" USING btree ("to_user_id");--> statement-breakpoint
CREATE INDEX "settlements_status_idx" ON "settlements" USING btree ("status");--> statement-breakpoint
CREATE INDEX "settlements_created_at_idx" ON "settlements" USING btree ("created_at");
