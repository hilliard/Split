I'm building an Expense Tracking App, as it stands right now there is no place for 'notes' or 'details' such as Flight number, departure/arrival times, addresses etc.

I would like to have a place for this information for 'activities' and/or 'events'

1. The JSON/Metadata Column (Recommended)
   The most modern and flexible approach is to add a single column (e.g., details or metadata) designated as a JSON or JSONB data type.

Instead of creating dedicated columns for every possible scenario, you store a structured object that changes based on the expense category.

Example Payload for a Flight:

JSON
{
"flightNumber": "DL123",
"airline": "Delta",
"departureTime": "2026-04-21T08:00:00Z",
"arrivalTime": "2026-04-21T11:30:00Z"
}
Example Payload for a Dinner:

JSON
{
"address": "123 Main St, Westminster, CO",
"attendees": ["John", "Jane"]
}
Pros: Extremely flexible. You don't need to alter your database schema every time you invent a new expense category. Most modern databases (PostgreSQL, MySQL, MongoDB) can index and query inside JSON columns efficiently.
Cons: Requires your frontend and backend to validate the JSON structure based on the category type to keep the data clean.

This is a beautifully structured PostgreSQL schema!

The best part? You have actually already implemented the perfect solution.

If you look closely at your events table, you already have this line:
metadata JSONB DEFAULT '{}'::jsonb

Because you are using PostgreSQL, the JSON/Metadata approach (Option 1 from the previous message) is unequivocally the best path forward. PostgreSQL has world-class support for JSONB, allowing you to store unstructured data while still being able to index and query it almost as fast as a regular column.

Since "flights" and "dinners" usually fall under the category of activities (or specific expenses), you just need to extend your existing JSONB pattern to those tables.

1. The Schema Update
   You simply need to run ALTER TABLE to add a metadata column to your activities and/or expenses tables.

SQL
-- Add a JSONB metadata column to activities
ALTER TABLE activities
ADD COLUMN metadata JSONB DEFAULT '{}'::jsonb;

Expense Table already has the column

-- 1. Create Events Table
CREATE TABLE events (
id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
title VARCHAR(255) NOT NULL,
description TEXT,
type VARCHAR(50) NOT NULL,
status VARCHAR(50) DEFAULT 'scheduled',
start_time TIMESTAMPTZ NOT NULL,
end_time TIMESTAMPTZ,
timezone VARCHAR(50) DEFAULT 'UTC',
is_virtual BOOLEAN DEFAULT false,
venue_id UUID, -- Assuming a venues table exists
is_public BOOLEAN DEFAULT true,
metadata JSONB DEFAULT '{}'::jsonb,
created_at TIMESTAMPTZ DEFAULT NOW()
);

2.  How it works in practice
    Now, when you insert an activity, you can attach whatever custom details that specific activity requires without changing the core schema.

Inserting a Flight Activity:

SQL
INSERT INTO activities (event_id, title, metadata)
VALUES (
'123e4567-e89b-12d3-a456-426614174000',
'Flight to Denver',
'{
"flight_number": "DL123",
"airline": "Delta",
"departure_airport": "JFK",
"arrival_airport": "DEN",
"terminal": "Terminal 4"
}'::jsonb
);
Inserting a Dinner Activity:

SQL
INSERT INTO activities (event_id, title, metadata)
VALUES (
'123e4567-e89b-12d3-a456-426614174000',
'Team Dinner',
'{
"address": "123 Main St, Westminster, CO",
"reservation_name": "Smith Party",
"dietary_restrictions_noted": true
}'::jsonb
);

3.  Querying the Data (The Magic of Postgres)
    The reason this is so powerful in PostgreSQL is that you can actually query inside that JSON data later using the ->> operator.

If you ever wanted to find all flights on "Delta", you don't need a dedicated airline column. You can just query the metadata:

SQL
SELECT title, start_time
FROM activities
WHERE metadata->>'airline' = 'Delta';
Summary
By sticking with JSONB, your schema remains incredibly clean and strict for the math (expenses, foreign keys, timestamps), but gives you infinite flexibility for the "details" on your frontend. Just build your frontend forms to inject the right JSON payload based on whatever activity type the user selects.
