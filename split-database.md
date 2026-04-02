Event Database Considerations:

# Database Architecture Context: Events, Activities, and Expenses

## Overview

This document outlines the normalized database schema for handling complex
events. The architecture separates overarching events from chronological
itinerary items (Activities) and financial ledger items (Expenses).

To handle the vast differences between event types (e.g., a concert vs. a
formal dinner), we utilize a core-field structure combined with a `JSONB`
metadata column for event-specific details.

---

## 1. PostgreSQL / Neon Schema Definition

```sql
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
    venue_id UUID,
    is_public BOOLEAN DEFAULT true,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create Activities Table (The Itinerary)
CREATE TABLE activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    start_time TIMESTAMPTZ,
    end_time TIMESTAMPTZ,
    location_name VARCHAR(255),
    sequence_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create Expenses Table (The Ledger)
CREATE TABLE expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    activity_id UUID REFERENCES activities(id) ON DELETE SET NULL,
    amount DECIMAL(10, 2) NOT NULL,
    category VARCHAR(50) NOT NULL,
    description TEXT,
    paid_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_events_start_time ON events(start_time);
CREATE INDEX idx_activities_event_id ON activities(event_id);
CREATE INDEX idx_expenses_event_id ON expenses(event_id);
CREATE INDEX idx_expenses_activity_id ON expenses(activity_id);
```

## 2. TypeScript Interfaces and Types

```
// types/database.ts

export type EventType = 'concert' | 'formal_dinner' | 'sports' | 'movie' | 'private_party';
export type EventStatus = 'scheduled' | 'ongoing' | 'canceled' | 'completed';
export type ExpenseCategory = 'food' | 'transportation' | 'parking' | 'tickets' | 'misc';

export interface Event<T = Record<string, unknown>> {
  id: string;
  title: string;
  description?: string | null;
  type: EventType;
  status: EventStatus;
  start_time: string;
  end_time?: string | null;
  timezone: string;
  is_virtual: boolean;
  venue_id?: string | null;
  is_public: boolean;
  metadata: T;
  created_at: string;
}

export interface Activity {
  id: string;
  event_id: string;
  title: string;
  start_time?: string | null;
  end_time?: string | null;
  location_name?: string | null;
  sequence_order: number;
  created_at: string;
}

export interface Expense {
  id: string;
  event_id: string;
  activity_id?: string | null;
  amount: number;
  category: ExpenseCategory;
  description?: string | null;
  paid_by?: string | null;
  created_at: string;
}

// Specific Metadata Examples
export interface ConcertMetadata {
  headliner: string;
  openers: string[];
  age_restriction?: string;
}
```

## 3. Data Fetching

```
// fetchEventDetails.ts
import { Neon } from './NeonClient';
import type { Event, Activity, Expense } from './types/database';

export type EventWithDetails<T = Record<string, unknown>> = Event<T> & {
  activities: Activity[];
  expenses: Expense[];
};

export async function getEventWithDetails(eventId: string): Promise<EventWithDetails | null> {
  const { data, error } = await Neon
    .from('events')
    .select(`
      *,
      activities (*),
      expenses (*)
    `)
    .eq('id', eventId)
    .single();

  if (error) {
    console.error('Error fetching event details:', error.message);
    return null;
  }

  return data as EventWithDetails;
}
```

## 4. Data Insertion (Neon)

```
// insertEventData.ts
import { Neon } from './NeonClient';
import type { Event, Activity, Expense } from './types/database';

export type NewEvent = Omit<Event, 'id' | 'created_at'>;
export type NewActivity = Omit<Activity, 'id' | 'event_id' | 'created_at'>;
export type NewExpense = Omit<Expense, 'id' | 'event_id' | 'activity_id' | 'created_at'>;

export async function createFullEvent(
  eventData: NewEvent,
  activities: NewActivity[] = [],
  expenses: NewExpense[] = []
): Promise<string | null> {

  // STEP 1: Insert Parent Event
  const { data: newEvent, error: eventError } = await Neon
    .from('events')
    .insert(eventData)
    .select('id')
    .single();

  if (eventError || !newEvent) {
    console.error('Failed to create event:', eventError?.message);
    return null;
  }

  const eventId = newEvent.id;

  // STEP 2: Insert Activities
  if (activities.length > 0) {
    const activitiesWithEventId = activities.map(act => ({
      ...act,
      event_id: eventId
    }));

    const { error: actError } = await Neon
      .from('activities')
      .insert(activitiesWithEventId);

    if (actError) console.error('Error inserting activities:', actError.message);
  }

  // STEP 3: Insert Expenses
  if (expenses.length > 0) {
    const expensesWithEventId = expenses.map(exp => ({
      ...exp,
      event_id: eventId
    }));

    const { error: expError } = await Neon
      .from('expenses')
      .insert(expensesWithEventId);

    if (expError) console.error('Error inserting expenses:', expError.message);
  }

  return eventId;
}
```

## 5. Row Level Security (RLS) (Neon)

To make Row Level Security (RLS) work perfectly, we first need to make one
small but critical update to your events table: we need to track who created
the event. In Neon, this is done by linking a creator_id to Neon's
built-in auth.users table.

Here is the complete SQL script to add that connection, enable RLS, and lock
down your data so that only the event creator can manage the itinerary and
the finances. You can append this directly to your database.md file.

To secure the data, we must link each event to the authenticated user who
created it, and then apply policies so that only that user can modify the
event, its activities, and its expenses.

### Step 1: Add Creator ID to Events

Run this to update the `events` table so it knows who owns the data.

```sql
ALTER TABLE events
ADD COLUMN creator_id UUID NOT NULL REFERENCES auth.users(id) DEFAULT auth.uid();

-- Create an index to make user-specific queries much faster
CREATE INDEX idx_events_creator_id ON events(creator_id);
```

### Step 2: Enable RLS on All Tables

By default, tables in Neon allow all operations. We must explicitly turn
on the security layer.

```
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
```

### Step 3: Policies for events

Read: Anyone can view the event if is_public is true. Otherwise, only the
creator can view it.

Write (Insert/Update/Delete): Only the logged-in creator can modify
their events.

```
-- READ
CREATE POLICY "Anyone can view public events" ON events
FOR SELECT USING (is_public = true OR creator_id = auth.uid());

-- INSERT
CREATE POLICY "Users can create their own events" ON events
FOR INSERT WITH CHECK (creator_id = auth.uid());

-- UPDATE
CREATE POLICY "Creators can update their own events" ON events
FOR UPDATE USING (creator_id = auth.uid());

-- DELETE
CREATE POLICY "Creators can delete their own events" ON events
FOR DELETE USING (creator_id = auth.uid());
```

### Step 4: Policies for activities (The Itinerary)

Activities don't have a creator_id directly; they belong to an event.
We use a subquery (EXISTS) to check the parent event's permissions.

#### Read: Viewable if the parent event is public OR if the user is the creator.

#### Write: Only the creator of the parent event can add/edit/delete activities.

```
-- READ
CREATE POLICY "Anyone can view activities of public events" ON activities
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM events
    WHERE events.id = activities.event_id
    AND (events.is_public = true OR events.creator_id = auth.uid())
  )
);

-- ALL WRITE OPERATIONS (Insert, Update, Delete)
-- Grouped together for simplicity using 'ALL'
CREATE POLICY "Creators can manage activities for their events" ON activities
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM events
    WHERE events.id = activities.event_id
    AND events.creator_id = auth.uid()
  )
);
```

###Step 5: Policies for expenses (The Ledger)

Unlike the itinerary, the financial ledger should usually be strictly private,
even if the event itself is public.

Read & Write: Only the creator of the parent event can view, add, edit,
or delete expenses.

```
-- ALL OPERATIONS (Select, Insert, Update, Delete)
-- This ensures financial data is completely hidden from the public
CREATE POLICY "Only creators can view and manage event expenses" ON expenses
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM events
    WHERE events.id = expenses.event_id
    AND events.creator_id = auth.uid()
  )
);
```

### Note:

### A Quick Tip on Testing RLS

When you apply these in the Neon SQL Editor, you won't be able to query
the data anonymously anymore. If you are testing your frontend and suddenly
receive empty arrays (`[]`) for your events or expenses, double-check that
your Neon client is properly passing the authentication token for the
logged-in user.

### How to securely update your TypeScript interface to include this new

`creator_id` field?

### Since we altered the database schema to handle Row Level Security, we

must update our TypeScript definitions so your frontend code stays perfectly
in sync with the backend.

## 6. TypeScript Updates for RLS

Now that the database tracks ownership via `creator_id`, we need to update our types.

### The Updated `Event` Interface

Add the `creator_id` property to your main `Event` interface.

```
typescript
// types/database.ts

export interface Event<T = Record<string, unknown>> {
  id: string;
  creator_id: string; // NEW: Links to auth.users to track ownership
  title: string;
  description?: string | null;
  type: EventType;
  status: EventStatus;
  start_time: string;
  end_time?: string | null;
  timezone: string;
  is_virtual: boolean;
  venue_id?: string | null;
  is_public: boolean;
  metadata: T;
  created_at: string;
}
```

The Updated NewEvent Type
This is a critical security detail: you should never pass the creator_id from
the client side when creating a new event. Malicious users could try to pass
someone else's ID.

Instead, we let the database handle it securely using the DEFAULT auth.uid()
we set up in SQL. To prevent TypeScript from yelling at you for missing the
creator_id when submitting the form, we add it to our Omit utility.

```
// insertEventData.ts

// NEW: We omit 'creator_id' so TypeScript knows we aren't supposed to send it
export type NewEvent = Omit<Event, 'id' | 'created_at' | 'creator_id'>;
```

### Here is an example clean, server-rendered Astro component that fetches and

displays the event itinerary.

Since Astro components natively support top-level await in their frontmatter,
you can fetch the data securely on the server before the HTML is even sent
to the browser.

```
// Import the fetch function and types we created earlier
import { getEventWithDetails } from '../lib/fetchEventDetails';
import type { EventWithDetails } from '../types/database';

// Define the props expected by this component
interface Props {
  eventId: string;
}

const { eventId } = Astro.props;

// Fetch the data on the server
const eventData: EventWithDetails | null = await getEventWithDetails(eventId);

// Format dates nicely for the UI
const formatTime = (isoString: string | null | undefined) => {
  if (!isoString) return 'TBD';
  return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};



<section class="event-container">
  {/* Handle the case where the event doesn't exist or failed to load */}
  {!eventData ? (
    <p class="error-msg">Event not found or you do not have permission to view it.</p>
  ) : (
    <div class="event-details">
      <header>
        <h2>{eventData.title}</h2>
        <p class="event-meta">
          {new Date(eventData.start_time).toLocaleDateString()} | {eventData.type.replace('_', ' ')}
        </p>
        {eventData.description && <p class="description">{eventData.description}</p>}
      </header>

      <div class="itinerary">
        <h3>Itinerary</h3>
        {eventData.activities.length === 0 ? (
          <p>No activities scheduled yet.</p>
        ) : (
          <ul class="timeline">
            {/* Map through the activities, sorting them chronologically */}
            {eventData.activities
              .sort((a, b) => new Date(a.start_time || 0).getTime() - new Date(b.start_time || 0).getTime())
              .map((activity) => (
              <li class="timeline-item">
                <div class="time-block">
                  <span class="start-time">{formatTime(activity.start_time)}</span>
                  {activity.end_time && <span class="end-time"> - {formatTime(activity.end_time)}</span>}
                </div>
                <div class="activity-info">
                  <strong>{activity.title}</strong>
                  {activity.location_name && <span>📍 {activity.location_name}</span>}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )}
</section>

<style>
  /* Basic styling to structure the timeline - feel free to replace with Tailwind */
  .event-container {
    max-width: 600px;
    margin: 0 auto;
    font-family: system-ui, sans-serif;
  }
  header {
    margin-bottom: 2rem;
    border-bottom: 1px solid #eee;
    padding-bottom: 1rem;
  }
  .event-meta {
    color: #666;
    text-transform: capitalize;
  }
  .timeline {
    list-style: none;
    padding: 0;
  }
  .timeline-item {
    display: flex;
    gap: 1.5rem;
    margin-bottom: 1.5rem;
    padding: 1rem;
    background: #f9f9f9;
    border-radius: 8px;
  }
  .time-block {
    min-width: 100px;
    color: #555;
    font-size: 0.9rem;
  }
  .activity-info {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }
  .activity-info span {
    font-size: 0.85rem;
    color: #666;
  }
</style>
```

### How to use this component

You would drop this component into one of your pages (likely a dynamic route)
and pass it the UUID of the event you want to load.

```
// src/pages/events/[id].astro
import EventItinerary from '../../components/EventItinerary.astro';

const { id } = Astro.params;
---

<html lang="en">
  <body>
    <main>
      <h1>Event Dashboard</h1>
      <EventItinerary eventId={id} />
    </main>
  </body>
</html>

```

### Here is how to set up the dynamic route in Astro so that navigating to a

URL like /events/123e4567 automatically grabs that ID and loads the
correct itinerary.

Because you are building an application with a live database (rather than a
static blog),
you will need this route to render on the server on-demand.

### 1. The Dynamic Route File

In your Astro project, create a file named exactly [id].astro inside the
src/pages/events/ directory. The brackets tell Astro that this part
of the URL is a variable.

```
// src/pages/events/[id].astro
import Layout from '../../layouts/Layout.astro';
import EventItinerary from '../../components/EventItinerary.astro';

// 1. Extract the 'id' parameter from the URL
const { id } = Astro.params;

// 2. Safety check: If no ID is found, kick them back to the main events list
if (!id) {
  return Astro.redirect('/events');
}
---

<Layout title="Event Itinerary">
  <main class="dashboard-wrapper">
    <a href="/events" class="back-link">← Back to All Events</a>

    <EventItinerary eventId={id} />
  </main>
</Layout>

<style>
  .dashboard-wrapper {
    padding: 2rem;
    max-width: 800px;
    margin: 0 auto;
  }
  .back-link {
    display: inline-block;
    margin-bottom: 2rem;
    color: #555;
    text-decoration: none;
    font-weight: 500;
  }
  .back-link:hover {
    color: #000;
  }
</style>
```

###2. A Critical Astro Setting (Server-Side Rendering)
By default, Astro builds static websites. If you try to run a dynamic [id].astro page in a static
build, Astro will throw an error asking for getStaticPaths because it wants to pre-build every
page in advance.

Since you are managing live data—like tracking setlists or settling up bar tabs after a gig at th
e Dickens Opera House—you need the page to generate on the fly.

To fix this, make sure your astro.config.mjs is set to server mode:

```
// astro.config.mjs
import { defineConfig } from 'astro/config';

export default defineConfig({
  // Tell Astro to render pages on the server upon request
  output: 'server',
  // You will also need an adapter for wherever you are hosting (Vercel, Netlify, Node)
  // adapter: vercel(),
});
```

###How the Pieces Connect

- A user clicks a link to an event: <a href="/events/987-xyz">Q's Pub Gig</a>
- Astro routes them to src/pages/events/[id].astro.
- The page extracts 987-xyz from the URL.
- It passes that ID to your <EventItinerary /> component.

The component securely runs the Neon fetch query on the server and
generates the HTML timeline.

## 7. Frontend UI: Create Event Form

This Astro component provides the user interface for creating a new event. It captures the core details, constructs the data object, and sends it to our Neon database using the `createFullEvent` function.

### `CreateEventForm.astro`

```astro
---
// src/components/CreateEventForm.astro
---

<div class="form-container">
  <h2>Create a New Event</h2>

  <form id="create-event-form">
    <div class="form-group">
      <label for="title">Event Title</label>
      <input type="text" id="title" name="title" required placeholder="e.g., Dickens Opera House Gig" />
    </div>

    <div class="form-row">
      <div class="form-group">
        <label for="type">Event Type</label>
        <select id="type" name="type" required>
          <option value="concert">Concert / Live Music</option>
          <option value="formal_dinner">Formal Dinner</option>
          <option value="private_party">Private Party</option>
          <option value="movie">Movie</option>
          <option value="sports">Sports</option>
        </select>
      </div>

      <div class="form-group">
        <label for="status">Status</label>
        <select id="status" name="status" required>
          <option value="scheduled">Scheduled</option>
          <option value="ongoing">Ongoing</option>
        </select>
      </div>
    </div>

    <div class="form-row">
      <div class="form-group">
        <label for="start_time">Start Date & Time</label>
        <input type="datetime-local" id="start_time" name="start_time" required />
      </div>

      <div class="form-group">
        <label for="timezone">Timezone</label>
        <select id="timezone" name="timezone" required>
          <option value="America/Denver" selected>Mountain Time (Denver)</option>
          <option value="America/Chicago">Central Time (Chicago)</option>
          <option value="America/New_York">Eastern Time (New York)</option>
          <option value="America/Los_Angeles">Pacific Time (Los Angeles)</option>
        </select>
      </div>
    </div>

    <div class="form-row toggles">
      <label>
        <input type="checkbox" id="is_public" name="is_public" checked />
        Public Event
      </label>
      <label>
        <input type="checkbox" id="is_virtual" name="is_virtual" />
        Virtual / Livestream
      </label>
    </div>

    <div class="form-group">
      <label for="description">Description (Optional)</label>
      <textarea id="description" name="description" rows="3" placeholder="Notes about load-in, parking, or general info..."></textarea>
    </div>

    <button type="submit" class="submit-btn" id="submit-btn">Create Event</button>
    <p id="form-feedback" class="feedback-msg"></p>
  </form>
</div>

<style>
  /* Basic Form Styling */
  .form-container {
    max-width: 600px;
    margin: 2rem auto;
    padding: 2rem;
    background: #fdfdfd;
    border: 1px solid #eaeaea;
    border-radius: 8px;
    font-family: system-ui, sans-serif;
  }
  .form-group {
    display: flex;
    flex-direction: column;
    margin-bottom: 1.5rem;
    flex: 1;
  }
  .form-row {
    display: flex;
    gap: 1rem;
  }
  label {
    font-weight: 600;
    margin-bottom: 0.5rem;
    font-size: 0.9rem;
    color: #333;
  }
  input[type="text"], input[type="datetime-local"], select, textarea {
    padding: 0.75rem;
    border: 1px solid #ccc;
    border-radius: 4px;
    font-size: 1rem;
  }
  .toggles {
    margin-bottom: 1.5rem;
    align-items: center;
  }
  .toggles label {
    font-weight: normal;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  .submit-btn {
    background: #000;
    color: #fff;
    padding: 0.75rem 1.5rem;
    border: none;
    border-radius: 4px;
    font-size: 1rem;
    cursor: pointer;
    width: 100%;
  }
  .submit-btn:hover { background: #333; }
  .feedback-msg { margin-top: 1rem; text-align: center; font-weight: 500; }
  .error { color: #d32f2f; }
  .success { color: #2e7d32; }
</style>

<script>
  // Import our database insert function and types
  import { createFullEvent } from '../lib/insertEventData';
  import type { NewEvent, EventType, EventStatus } from '../types/database';

  const form = document.getElementById('create-event-form') as HTMLFormElement;
  const feedback = document.getElementById('form-feedback') as HTMLParagraphElement;
  const submitBtn = document.getElementById('submit-btn') as HTMLButtonElement;

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      // UI Feedback: Disable button to prevent double-clicks
      submitBtn.disabled = true;
      submitBtn.textContent = 'Saving...';
      feedback.textContent = '';
      feedback.className = 'feedback-msg';

      // 1. Gather form data
      const formData = new FormData(form);

      // 2. Format the date into an ISO string for Neon (TIMESTAMPTZ)
      const localDateTime = formData.get('start_time') as string;
      const isoDateString = new Date(localDateTime).toISOString();

      // 3. Construct the NewEvent object matching our TypeScript interface
      const newEventData: NewEvent = {
        title: formData.get('title') as string,
        type: formData.get('type') as EventType,
        status: formData.get('status') as EventStatus,
        start_time: isoDateString,
        timezone: formData.get('timezone') as string,
        is_public: formData.get('is_public') === 'on',
        is_virtual: formData.get('is_virtual') === 'on',
        description: formData.get('description') as string,
        // Optional: Set default metadata based on type, or leave empty for now
        metadata: formData.get('type') === 'concert' ? { headliner: '', openers: [] } : {}
      };

      // 4. Send to Neon (Passing empty arrays for initial activities/expenses)
      try {
        const newEventId = await createFullEvent(newEventData, [], []);

        if (newEventId) {
          feedback.textContent = 'Event created successfully! Redirecting...';
          feedback.classList.add('success');

          // Redirect the user to their newly created event dashboard
          setTimeout(() => {
            window.location.href = `/events/${newEventId}`;
          }, 1500);
        } else {
          throw new Error('Database returned null ID');
        }
      } catch (error) {
        console.error(error);
        feedback.textContent = 'Failed to create event. Please try again.';
        feedback.classList.add('error');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Create Event';
      }
    });
  }
</script>
```

---

### How to use this component

1. Save the code above into a file named `CreateEventForm.astro` in your `src/components/` directory.
2. Create a new page, like `src/pages/events/new.astro`.
3. Import the component onto that page:
   ```astro
   ---
   import CreateEventForm from '../../components/CreateEventForm.astro';
   import Layout from '../../layouts/Layout.astro';
   ---
   <Layout title="New Event">
     <CreateEventForm />
   </Layout>
   ```

At this point, you have the complete vertical slice: the Database Schema,
the TypeScript definitions, the backend functions to Read/Write, the UI to
view an Event, and the Form to create one.

### Here is the documentation and code for handling Neon User Authentication.

Since your Row Level Security (RLS) policies rely on auth.uid(), the user must
be logged in before they can create an event or manage expenses. This section
covers the utility functions to talk to Neon and the UI components for
the users.

## 8. User Authentication (Neon Auth)

To make Row Level Security (RLS) work, users must be authenticated. We use Neon's built-in email and password authentication.

### 8.1 Authentication Utility Functions

Create a dedicated file to handle all authentication requests to Neon. This keeps your UI components clean.

```typescript
// lib/auth.ts
import { Neon } from "./NeonClient";

// 1. Sign Up a New User
export async function signUpUser(email: string, password: string) {
  const { data, error } = await Neon.auth.signUp({
    email,
    password,
  });

  if (error) {
    console.error("Sign up error:", error.message);
    return { success: false, error: error.message };
  }
  return { success: true, data };
}

// 2. Log In an Existing User
export async function signInUser(email: string, password: string) {
  const { data, error } = await Neon.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    console.error("Login error:", error.message);
    return { success: false, error: error.message };
  }
  return { success: true, data };
}

// 3. Log Out the Current User
export async function signOutUser() {
  const { error } = await Neon.auth.signOut();
  if (error) {
    console.error("Logout error:", error.message);
  }
}

// 4. Get Current Logged-In User
export async function getCurrentUser() {
  const {
    data: { user },
    error,
  } = await Neon.auth.getUser();
  if (error) {
    console.error("Get user error:", error.message);
    return null;
  }
  return user;
}
```

###8.2 The Auth UI Component
Here is a combined Astro component that handles both Login and Sign Up by
toggling between the two modes.

```
---
// src/components/AuthForm.astro
---

<div class="auth-container">
 <h2 id="auth-title">Log In to Manage Events</h2>

 <form id="auth-form">
   <div class="form-group">
     <label for="email">Email</label>
     <input type="email" id="email" name="email" required placeholder="you@example.com" />
   </div>

   <div class="form-group">
     <label for="password">Password</label>
     <input type="password" id="password" name="password" required placeholder="••••••••" minlength="6" />
   </div>

   <button type="submit" class="submit-btn" id="auth-btn">Log In</button>
   <p id="auth-feedback" class="feedback-msg"></p>
 </form>

 <div class="auth-toggle">
   <p id="toggle-text">Don't have an account?</p>
   <button id="toggle-btn" class="text-btn">Sign Up Here</button>
 </div>
</div>

<style>
 .auth-container {
   max-width: 400px;
   margin: 4rem auto;
   padding: 2.5rem;
   background: #fff;
   border: 1px solid #eaeaea;
   border-radius: 8px;
   box-shadow: 0 4px 6px rgba(0,0,0,0.05);
   font-family: system-ui, sans-serif;
 }
 .form-group {
   display: flex;
   flex-direction: column;
   margin-bottom: 1.2rem;
 }
 label { font-weight: 500; margin-bottom: 0.4rem; font-size: 0.9rem; }
 input { padding: 0.75rem; border: 1px solid #ccc; border-radius: 4px; }
 .submit-btn {
   width: 100%;
   background: #000;
   color: #fff;
   padding: 0.75rem;
   border: none;
   border-radius: 4px;
   font-size: 1rem;
   cursor: pointer;
   margin-top: 1rem;
 }
 .submit-btn:hover { background: #333; }
 .auth-toggle {
   margin-top: 1.5rem;
   text-align: center;
   font-size: 0.9rem;
   border-top: 1px solid #eee;
   padding-top: 1rem;
 }
 .text-btn {
   background: none;
   border: none;
   color: #0066cc;
   cursor: pointer;
   text-decoration: underline;
   font-weight: 600;
 }
 .feedback-msg { text-align: center; margin-top: 1rem; font-size: 0.9rem; }
 .error { color: #d32f2f; }
 .success { color: #2e7d32; }
</style>

<script>
 import { signInUser, signUpUser } from '../lib/auth';

 let isLoginMode = true;

 const form = document.getElementById('auth-form') as HTMLFormElement;
 const title = document.getElementById('auth-title') as HTMLHeadingElement;
 const btn = document.getElementById('auth-btn') as HTMLButtonElement;
 const toggleBtn = document.getElementById('toggle-btn') as HTMLButtonElement;
 const toggleText = document.getElementById('toggle-text') as HTMLParagraphElement;
 const feedback = document.getElementById('auth-feedback') as HTMLParagraphElement;

 // Toggle between Login and Sign Up modes
 toggleBtn?.addEventListener('click', () => {
   isLoginMode = !isLoginMode;
   title.textContent = isLoginMode ? 'Log In to Manage Events' : 'Create an Account';
   btn.textContent = isLoginMode ? 'Log In' : 'Sign Up';
   toggleText.textContent = isLoginMode ? "Don't have an account?" : "Already have an account?";
   toggleBtn.textContent = isLoginMode ? 'Sign Up Here' : 'Log In Here';
   feedback.textContent = '';
 });

 // Handle Form Submission
 form?.addEventListener('submit', async (e) => {
   e.preventDefault();

   btn.disabled = true;
   btn.textContent = 'Processing...';
   feedback.textContent = '';
   feedback.className = 'feedback-msg';

   const formData = new FormData(form);
   const email = formData.get('email') as string;
   const password = formData.get('password') as string;

   let result;

   if (isLoginMode) {
     result = await signInUser(email, password);
   } else {
     result = await signUpUser(email, password);
   }

   if (result.success) {
     feedback.textContent = isLoginMode ? 'Login successful! Redirecting...' : 'Account created! Redirecting...';
     feedback.classList.add('success');

     // Redirect to the events dashboard upon success
     setTimeout(() => {
       window.location.href = '/events';
     }, 1000);
   } else {
     feedback.textContent = result.error || 'An error occurred.';
     feedback.classList.add('error');
     btn.disabled = false;
     btn.textContent = isLoginMode ? 'Log In' : 'Sign Up';
   }
 });
</script>
```

### 8.3 Protecting Your Routes (Server-Side)

Because Astro renders pages on the server (via output: 'server'), you can check
if a user is logged in before the page even loads. If they aren't logged in,
you can redirect them to the auth page.

Here is how you protect your new.astro page so only logged-in users can see
the Create Event form:

```
---
// src/pages/events/new.astro
import Layout from '../../layouts/Layout.astro';
import CreateEventForm from '../../components/CreateEventForm.astro';
import { Neon } from '../../lib/NeonClient';

// 1. Grab the user session cookies from Astro
const { cookies, redirect } = Astro;

const accessToken = cookies.get("sb-access-token");
const refreshToken = cookies.get("sb-refresh-token");

// 2. If they don't have tokens, send them to login
if (!accessToken || !refreshToken) {
  return redirect("/login");
}

// 3. Verify the session with Neon
const { data, error } = await Neon.auth.setSession({
  access_token: accessToken.value,
  refresh_token: refreshToken.value,
});

if (error) {
  // Token might be expired
  return redirect("/login");
}
---

<Layout title="Create New Event">
  <main>
    <CreateEventForm />
  </main>
</Layout>
```

### (Note:) For the cookie method to work perfectly in Astro, you will need to

configure the Neon client to use SSR cookie storage, rather than the
default browser localStorage.)

### When working with Astro in Server-Side Rendering (SSR) mode, authentication

     becomes a bit more complex. Standard single-page apps use the browser's
     localStorage to remember who is logged in. But since Astro generates pages on
     the server before they hit the browser, the server needs a way to know who is
     requesting the page. We solve this using Cookies.



## 9. Neon Client & Environment Setup (SSR)

To securely manage user sessions on the server, we use the `@Neon/ssr` package. This allows Astro to read and write auth cookies securely.

### 9.1 Environment Variables

First, you need to store your Neon API keys securely. Create a `.env` file in the root of your Astro project. **Never commit this file to Git.**

```env

```

Astro automatically exposes variables prefixed with PUBLIC\_ to both the server and the client.

### 9.2 Package Installation

You will need the official Neon SSR package alongside the standard
JavaScript client.

```
npm install @Neon/Neon-js @Neon/ssr
```

### 9.3 The Client Constructor

    Because the server handles multiple users at once, we cannot just create one
    global Neon client. We need a function that creates a fresh client for
    each request, grabbing the specific cookies for the user making that request.

Create this file to handle the client generation.

```
// lib/NeonClient.ts
import { createServerClient, parseCookieHeader, serializeCookieHeader } from '@Neon/ssr';
import type { AstroCookies } from 'astro';

export function getNeonClient(cookies: AstroCookies) {
  return createServerClient(
    import.meta.env.PUBLIC_Neon_URL,
    import.meta.env.PUBLIC_Neon_ANON_KEY,
    {
      cookies: {
        getAll() {
          // Astro's cookie API is slightly different, so we map it
          return Object.keys(cookies).map((name) => ({
            name,
            value: cookies.get(name)?.value || '',
          }));
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookies.set(name, value, options);
          });
        },
      },
    }
  );
}
```

### 9.4 Updating Server-Side Data Fetching

Now that we have an SSR-compatible client, any Astro page
(like our [id].astro itinerary page) or API route that needs to fetch
protected data will use this function.

Here is how you update a server-rendered page to use the secure,
cookie-aware client:

```
---
// src/pages/events/[id].astro
import Layout from '../../layouts/Layout.astro';
import EventItinerary from '../../components/EventItinerary.astro';
import { getNeonClient } from '../../lib/NeonClient';

const { id } = Astro.params;

if (!id) {
  return Astro.redirect('/events');
}

// 1. Initialize the secure client using the current request's cookies
const Neon = getNeonClient(Astro.cookies);

// 2. Check if the user is authenticated
const { data: { user }, error: authError } = await Neon.auth.getUser();

if (authError || !user) {
  // If not logged in, send them to the login page
  return Astro.redirect('/login');
}

// 3. The user is logged in. The RLS policies will automatically
// use this user's ID when we fetch the event data inside the component.
---

<Layout title="Event Itinerary">
  <main class="dashboard-wrapper">
    <EventItinerary eventId={id} />
  </main>
</Layout>
```

### 9.5 Updating Client-Side Forms (Auth)

For client-side scripts (like the <script> tag inside your AuthForm.astro
where the user actually types in their password), you can use the standard
browser client, which @Neon/ssr also provides.

```
// lib/auth.ts (Updated for SSR)
import { createBrowserClient } from '@Neon/ssr';

// This client automatically knows how to set cookies in the browser
const Neon = createBrowserClient(
 import.meta.env.PUBLIC_Neon_URL,
 import.meta.env.PUBLIC_Neon_ANON_KEY
);

export async function signInUser(email: string, password: string) {
 const { data, error } = await Neon.auth.signInWithPassword({
   email,
   password,
 });

 // The browser client automatically sets the auth cookies for you here!
 return { success: !error, data, error: error?.message };
}
```
