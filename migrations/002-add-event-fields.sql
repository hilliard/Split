-- Add new event fields migration
-- Adds: location, start_date, end_date, currency, and budget to events table

ALTER TABLE "events" ADD COLUMN "location" varchar(255);
ALTER TABLE "events" ADD COLUMN "start_date" date;
ALTER TABLE "events" ADD COLUMN "end_date" date;
ALTER TABLE "events" ADD COLUMN "currency" varchar(3) DEFAULT 'USD';
ALTER TABLE "events" ADD COLUMN "budget" decimal(10, 2);

-- Create index on start_date for efficient date range queries
CREATE INDEX "events_start_date_idx" ON "events" USING btree ("start_date");
