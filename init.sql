-- Split App Database Schema

CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"username" varchar(255) NOT NULL,
	"password_hash" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);

CREATE TABLE "events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"creator_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE "activities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE "expense_groups" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"created_by" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE "group_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"group_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"invited_at" timestamp DEFAULT now() NOT NULL,
	"joined_at" timestamp
);

CREATE TABLE "expenses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"group_id" uuid NOT NULL,
	"activity_id" uuid,
	"paid_by" uuid NOT NULL,
	"amount" integer NOT NULL,
	"description" varchar(255) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE "expense_splits" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"expense_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"amount" integer NOT NULL
);

CREATE TABLE "sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"expires_at" timestamp NOT NULL
);

-- Foreign Keys
ALTER TABLE "activities" ADD CONSTRAINT "activities_event_id_fk" FOREIGN KEY ("event_id") REFERENCES "users"("id") ON DELETE cascade;
ALTER TABLE "events" ADD CONSTRAINT "events_creator_id_fk" FOREIGN KEY ("creator_id") REFERENCES "users"("id") ON DELETE cascade;
ALTER TABLE "expense_groups" ADD CONSTRAINT "groups_created_by_fk" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE cascade;
ALTER TABLE "group_members" ADD CONSTRAINT "group_members_group_id_fk" FOREIGN KEY ("group_id") REFERENCES "expense_groups"("id") ON DELETE cascade;
ALTER TABLE "group_members" ADD CONSTRAINT "group_members_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade;
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_group_id_fk" FOREIGN KEY ("group_id") REFERENCES "expense_groups"("id") ON DELETE cascade;
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_activity_id_fk" FOREIGN KEY ("activity_id") REFERENCES "activities"("id") ON DELETE set null;
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_paid_by_fk" FOREIGN KEY ("paid_by") REFERENCES "users"("id") ON DELETE restrict;
ALTER TABLE "expense_splits" ADD CONSTRAINT "splits_expense_id_fk" FOREIGN KEY ("expense_id") REFERENCES "expenses"("id") ON DELETE cascade;
ALTER TABLE "expense_splits" ADD CONSTRAINT "splits_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade;
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade;

-- Indexes
CREATE INDEX "email_idx" ON "users" USING btree ("email");
CREATE INDEX "events_creator_idx" ON "events" USING btree ("creator_id");
CREATE INDEX "activities_event_idx" ON "activities" USING btree ("event_id");
CREATE INDEX "groups_created_by_idx" ON "expense_groups" USING btree ("created_by");
CREATE INDEX "group_members_group_user_idx" ON "group_members" USING btree ("group_id","user_id");
CREATE INDEX "expenses_group_idx" ON "expenses" USING btree ("group_id");
CREATE INDEX "expenses_paid_by_idx" ON "expenses" USING btree ("paid_by");
CREATE INDEX "splits_expense_idx" ON "expense_splits" USING btree ("expense_id");
CREATE INDEX "splits_user_idx" ON "expense_splits" USING btree ("user_id");
CREATE INDEX "sessions_user_id_idx" ON "sessions" USING btree ("user_id");
CREATE INDEX "sessions_expires_at_idx" ON "sessions" USING btree ("expires_at");
