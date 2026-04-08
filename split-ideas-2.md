# Split Project Context

## Project Overview

**Split** a shared expense tracker app. Multiple people can sign up, create
Events,groups and track and split expenses.
The app needs user accounts:

- Registration with email (or username) and password (it can use email as
  primary id if user chooses)
- Login and logout
- Sessions that persist across page loads
- Protected routes (dashboard requires login, landing page is public)

Core features:

- Create an Event or Activity with a name
- Events can 'have' 'activities'
- An Activity can be added to an Event (Event:Concert, Event:Activity:Concert:'Parking', Event:Activity:Concert:'Food'
- Create expense groups with a name
- Invite other users to a group by email
- Add expenses: who paid, how much, and split among which group members
- Calculate balances automatically (who owes whom within each group)
- A dashboard showing some Events/Activities (an opportunity, to have ads, or
  let venues list events/activities
- A dashboard showing all groups the logged-in user belongs to

Each user should only see groups they belong to. Each group shows its own
expenses, members, and balances.

For Logged in User
** See 'example-intro-panel-1.png' **

For Add expense
** See 'add-event-UI-example.png' **

## Project

product name 'Split'
create project in this directory e:\code\dev\BootCamp2026\Split
(do not make split-app subfolder, initialize and create subdirectories here)
configure git,
configure dotenv (Windows 11 has trouble reading ENVIRONMENT variables) this is needed for APIs
start out thinking of an end to end testing architecture (e2e)

## Aestetics

The app must be responsive, 75% of its users/vistors will be on a phone
It must be ARIA compliant for the visually impared. Use symantic html where possible
The application must look 'modern' or current and be pleasing to the eye
The application should have both a 'dark' and a 'light' mode

## Technology Stack

- **Framework:** [Astro](https://astro.build/) (Server-Side Rendering)
- **Frontend Interactivity:**
  - [Alpine.js](https://alpinejs.dev/) (used for lightweight client-side state,
    dialogs, and sidebar toggling, specifically utilizing the
    `@alpinejs/collapse` plugin)
  - [HTMX](https://htmx.org/) (used for fetching and injecting dynamic HTML,
    e.g., the links grid and search bar functionality via `/api/links/html`)
- **Styling:** Tailwind CSS (Dark/Light mode native support)
- **TypeScript 6.0** the final major release based on the original JavaScript
  codebase
- **Zod:** For form and server-side validation

- **Database:** Use a cloud database with built-in auth (like Supabase) so
  registration, login, and session management are handled for you. Store
  money as integer cents to avoid floating-point rounding issues.

  -**Vitest** Test Framework It is Jest-compatible and works for backend code too. -**Playwright** enables reliable end-to-end testing for modern web apps.

## Core Architecture & State Management

- **Authentication:** Custom session/cookie-based (`userId` cookie corresponding
  to an sqlite `humans` table record).
- **Client-Side State (Alpine + localStorage):**

  The Alpine.js component watches and syncs local state directly to `localStorage`:

## Use Neon/Drizzle ORM

## Key Directories / Files

- `src/pages/index.astro`: Main application layout containing the sidebar,
  HTMX toolbar, search, and native `<dialog>` modals for adding/editing links.
- `src/alpine.ts`: Entry point for Alpine plugins (registers `@alpinejs/collapse`).
- `db/db.js`: Database configuration and connection singleton.
  (or whatever Supabase does here)
- `/api/links/*`: API endpoints handling CRUD operations and returning
  HTMX-compatible partials. (possibly POST updates)
- `/api/links/*`: Considerations for this app providing input to the
  Event-Dashboard project.

## How to Resume Work from this Context

If starting a new chat session with the AI agent, simply mention:

> _"Read `context.md` in the root directory to understand the project architecture, tech stack, and recent updates."_
> This will instantly align the AI with the project's specific Alpine.js patterns and HTMX structure.

## Database Considerations

### Target (Human-Centric Design)

- **humans**: Base entity for all people (id, first_name, last_name, dob, gender, phone)
- **events**: Base entity for all events (id, title, description, type, status)
- **activities**: Base entity for all activities (id, event_id, title, start_time, end_time, location_name, sequence_order, created_at)
- **activity**: Base entity for all activities (id, title, description, type, status)
- **customers**: Role table (human_id, username, password_hash, loyalty_points)
- **groupname**: Group table (id, name, description)
- **employees/work home/family**: Role table (human_id, job_title, department, salary)
- **users**: Role table (human_id, stage_name, bio, website)
- **payee**: payee table (human_id, username) [Recieves Money]
- **payor**: payor table (human_id, username) [Pays Money]
- **email_history**: Temporal tracking (human_id, email, effective_from, effective_to)
- **time_and_location**: Temporal tracking (start_time, end_time, time_zone, is_virtual, venue_id, virtual_url)
- **access_and_ticketing**: (is_public, capacity, is_free, rsvp_deadline)
- **expense**: Temporal tracking (human_id, email, effective_from, effective_to)
- **site_roles**: RBAC roles (id, role_name, description)
- **human_site_roles**: Many-to-many user ↔ roles
- **site_role_permissions**: Many-to-many role ↔ permissions

## Schema at a Glance

```
humans                   (base entity: id, first_name, last_name, dob, gender, phone, created_at)


email_history            (human_id, email, effective_from, effective_to)
addresses                (street, city, state, postal_code, country)
addressable              (address_id, entity_type, entity_id, effective_from/to)

site_roles               (role_name, description)
permissions              (permission_name, resource, action)
human_site_roles         (human_id ↔ site_role_id)
site_role_permissions    (site_role_id ↔ permission_id)
```

# Events and Activties

# Database Architecture Context: Events, Activities, and Expenses

### How They Work Together

Let's say you are building an itinerary for a live music show. The data relationships would look like this:

- **Event**: Concert at Cervantes'
- **Activity 1**: "Dinner before the show" (Location: Wendy's, Time: 6:00 PM)
- **Expense A**: $25.00 (Category: Food, Linked to Activity 1)
- **Activity 2**: "Drive to Denver & Park" (Time: 7:00 PM)
- **Expense B**: $15.00 (Category: Transportation, Gas)
- **Expense C**: $20.00 (Category: Parking, Valet)
- **Activity 3**: "The Concert" (Time: 8:00 PM)
- **Expense D**: $80.00 (Category: Tickets)
- **Expense E**: $30.00 (Category: Drinks)

## Overview

This document outlines the normalized database schema for handling complex events.
The architecture separates overarching events from chronological itinerary items
(Activities) and financial ledger items (Expenses).

To handle the vast differences between event types (e.g., a concert vs. a formal
dinner), we utilize a core-field structure combined with a `JSONB` metadata
column for event-specific details.

### participants can be 'grouped' so they can be associated as a group to an event/activity

---

## 1. Tables & Fields

### `events` (The Core Record)

Stores universal data applicable to all events. Specific, unstructured data (like a movie's runtime or a wedding's dress code) is stored in the `metadata` JSONB column.

| Field Name    | Data Type   | Description                                      |
| :------------ | :---------- | :----------------------------------------------- |
| `id`          | UUID (PK)   | Unique identifier for the event.                 |
| `title`       | String      | e.g., "Concert at Cervantes'", "Smith Wedding".  |
| `description` | Text        | Long-form details.                               |
| `type`        | String/Enum | `concert`, `formal_dinner`, `sports`, `movie`.   |
| `status`      | String/Enum | `scheduled`, `ongoing`, `canceled`, `completed`. |
| `start_time`  | TIMESTAMPTZ | Exact start time (UTC).                          |
| `end_time`    | TIMESTAMPTZ | Exact end time (UTC).                            |
| `timezone`    | String      | Local timezone (e.g., `America/Denver`).         |
| `is_virtual`  | Boolean     | `true` for streams, `false` for in-person.       |
| `venue_id`    | UUID (FK)   | Links to a physical `venues` table (nullable).   |
| `is_public`   | Boolean     | Public vs. private invite-only.                  |
| `metadata`    | JSONB       | Key-value pairs specific to the event type.      |

### `activities` (The Itinerary)

Defines the chronological timeline of the event. Bound by time.

| Field Name       | Data Type   | Description                                       |
| :--------------- | :---------- | :------------------------------------------------ |
| `id`             | UUID (PK)   | Unique identifier.                                |
| `event_id`       | UUID (FK)   | Parent event.                                     |
| `title`          | String      | e.g., "Pre-show Dinner", "Drive & Park".          |
| `start_time`     | TIMESTAMPTZ | Start of the activity.                            |
| `end_time`       | TIMESTAMPTZ | End of the activity.                              |
| `location_name`  | String      | e.g., "Wendy's", "Parking Lot M".                 |
| `sequence_order` | Integer     | For ordering activities if exact times are fluid. |

### `expenses` (The Ledger)

Tracks the money. Bound by cost. Can optionally link to a specific activity.

| Field Name    | Data Type   | Description                                     |
| :------------ | :---------- | :---------------------------------------------- |
| `id`          | UUID (PK)   | Unique identifier.                              |
| `event_id`    | UUID (FK)   | Parent event (required for total event budget). |
| `activity_id` | UUID (FK)   | Links cost to a specific activity (nullable).   |
| `amount`      | Decimal     | The actual cost (e.g., `45.50`).                |
| `category`    | String/Enum | `food`, `transportation`, `parking`, `tickets`. |
| `description` | String      | e.g., "Gas", "Valet tip", "Round of drinks".    |
| `paid_by`     | UUID        | Tracks which user paid the bill.                |

---

## 2. PostgreSQL / Schema Definition

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
    venue_id UUID, -- Assuming a venues table exists
    is_public BOOLEAN DEFAULT true,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create Activities Table
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

-- 3. Create Expenses Table
CREATE TABLE expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    activity_id UUID REFERENCES activities(id) ON DELETE SET NULL,
    amount DECIMAL(10, 2) NOT NULL,
    category VARCHAR(50) NOT NULL,
    description TEXT,
    paid_by UUID, -- Assuming a users table exists
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_events_start_time ON events(start_time);
CREATE INDEX idx_activities_event_id ON activities(event_id);
CREATE INDEX idx_expenses_event_id ON expenses(event_id);
CREATE INDEX idx_expenses_activity_id ON expenses(activity_id);
```

### TypeScript 6.0 Interface

#### types/database.ts

```
// types/database.ts

// --- ENUMS & UTILITY TYPES ---

export type EventType = 'concert' | 'formal_dinner' | 'sports' | 'movie' | 'private_party';
export type EventStatus = 'scheduled' | 'ongoing' | 'canceled' | 'completed';
export type ExpenseCategory = 'food' | 'transportation' | 'parking' | 'tickets' | 'misc';

// --- CORE TABLES ---

export interface Event<T = Record<string, unknown>> {
  id: string; // UUID
  title: string;
  description?: string | null;
  type: EventType;
  status: EventStatus;
  start_time: string; // ISO 8601 string from Supabase (TIMESTAMPTZ)
  end_time?: string | null;
  timezone: string;
  is_virtual: boolean;
  venue_id?: string | null; // UUID
  is_public: boolean;
  metadata: T; // Generic type for flexible JSONB payloads
  created_at: string;
}

export interface Activity {
  id: string; // UUID
  event_id: string; // UUID (Foreign Key)
  title: string;
  start_time?: string | null;
  end_time?: string | null;
  location_name?: string | null;
  sequence_order: number;
  created_at: string;
}

export interface Expense {
  id: string; // UUID
  event_id: string; // UUID (Foreign Key)
  activity_id?: string | null; // UUID (Foreign Key)
  amount: number; // Decimal mapped to number in TS
  category: ExpenseCategory;
  description?: string | null;
  paid_by?: string | null; // UUID of the user
  created_at: string;
}

// --- SPECIFIC METADATA EXAMPLES (Optional but recommended) ---

export interface ConcertMetadata {
  headliner: string;
  openers: string[];
  age_restriction?: string;
}

export interface DinnerMetadata {
  dress_code: string;
  caterer?: string;
  plus_ones_allowed: boolean;
}

// Example usage in your frontend code:
// const myConcert: Event<ConcertMetadata> = fetchEventFromSupabase(...)
// console.log(myConcert.metadata.headliner) // Fully typed!

```

### Fetch

Because we set up the Foreign Keys (REFERENCES events(id)) in the SQL schema,
Supabase automatically understands the relationships between these tables.
You don't need to write complex SQL JOIN statements.

You can fetch the main Event, plus all of its associated Activities and
Expenses, in a single network request using Supabase's nested select syntax.

Here is the TypeScript function to drop into your project.

```
// fetchEventDetails.ts
import { supabase } from './supabaseClient'; // Adjust path to your initialized client
import type { Event, Activity, Expense } from './types/database';

// 1. Create a composite type for the joined result
export type EventWithDetails<T = Record<string, unknown>> = Event<T> & {
  activities: Activity[];
  expenses: Expense[];
};

// 2. The Fetch Function
export async function getEventWithDetails(eventId: string): Promise<EventWithDetails | null> {
  const { data, error } = await supabase
    .from('events')
    .select(`
      *,
      activities (*),
      expenses (*)
    `)
    .eq('id', eventId)
    .single(); // Forces it to return an object instead of an array

  if (error) {
    console.error('Error fetching event details:', error.message);
    return null;
  }

  // 3. Supabase returns the data mapped to our exact structure
  return data as EventWithDetails;
}
```

### How the Magic Works:

The secret is inside the .select() string: _, activities(_), expenses(\*).

\*: Grabs all columns from the parent events table.

activities(\*): Looks for any row in the activities table where the event_id matches, grabs all columns, and nests them into an array called activities.

expenses(\*): Does the exact same thing for the expenses table.

Example Usage in Your UI Component
When you call this function, you get a beautifully structured JavaScript
object ready to be mapped over in your frontend:

```
const eventData = await getEventWithDetails('123e4567-e89b-12d3-a456-426614174000');

if (eventData) {
 console.log(`Welcome to: ${eventData.title}`);

 // Easily map through the itinerary
 eventData.activities.forEach(activity => {
   console.log(`- ${activity.title} at ${activity.location_name}`);
 });

 // Calculate total cost on the fly
 const totalCost = eventData.expenses.reduce((sum, exp) => sum + exp.amount, 0);
 console.log(`Total Event Cost: $${totalCost}`);
}
```

Here is the TypeScript function for inserting a new Event along with its
Activities and Expenses.

```
// insertEventData.ts
import { supabase } from './supabaseClient'; // Adjust path
import type { Event, Activity, Expense, EventType, EventStatus } from './types/database';

// 1. Define Omit types for creation (since the DB generates the IDs and created_at)
export type NewEvent = Omit<Event, 'id' | 'created_at'>;
export type NewActivity = Omit<Activity, 'id' | 'event_id' | 'created_at'>;
export type NewExpense = Omit<Expense, 'id' | 'event_id' | 'activity_id' | 'created_at'>;

// 2. The Insert Function
export async function createFullEvent(
 eventData: NewEvent,
 activities: NewActivity[] = [],
 expenses: NewExpense[] = []
): Promise<string | null> {

 // STEP 1: Insert the parent Event
 const { data: newEvent, error: eventError } = await supabase
   .from('events')
   .insert(eventData)
   .select('id') // We only need the new ID back
   .single();

 if (eventError || !newEvent) {
   console.error('Failed to create event:', eventError?.message);
   return null;
 }

 const eventId = newEvent.id;

 // STEP 2: Insert Activities (if any)
 if (activities.length > 0) {
   // Map over the activities to attach the new eventId
   const activitiesWithEventId = activities.map(act => ({
     ...act,
     event_id: eventId
   }));

   const { error: actError } = await supabase
     .from('activities')
     .insert(activitiesWithEventId);

   if (actError) console.error('Error inserting activities:', actError.message);
 }

 // STEP 3: Insert Event-Level Expenses (if any)
 if (expenses.length > 0) {
    // Map over expenses to attach the new eventId
   const expensesWithEventId = expenses.map(exp => ({
     ...exp,
     event_id: eventId
   }));

   const { error: expError } = await supabase
     .from('expenses')
     .insert(expensesWithEventId);

   if (expError) console.error('Error inserting expenses:', expError.message);
 }

 // Return the new Event ID so your frontend can redirect the user to the new event page
 return eventId;
}
```

How to use this in your frontend:
Here is how you would call this function when a user submits your
"Create Event" form. Note how we use the strongly-typed metadata
for a concert!

```
async function handleFormSubmit() {
  const newConcert: NewEvent = {
    title: "Symphony Under the Stars",
    type: "concert",
    status: "scheduled",
    start_time: "2026-07-15T19:00:00Z",
    timezone: "America/Denver",
    is_virtual: false,
    is_public: true,
    metadata: {
      headliner: "Colorado Symphony",
      openers: []
    }
  };

  const initialActivities: NewActivity[] = [
    {
      title: "Gates Open",
      start_time: "2026-07-15T17:30:00Z",
      location_name: "Red Rocks Amphitheatre",
      sequence_order: 1
    }
  ];

  const initialExpenses: NewExpense[] = [
    {
      amount: 150.00,
      category: "tickets",
      description: "2 VIP Tickets"
    }
  ];

  const newEventId = await createFullEvent(newConcert, initialActivities, initialExpenses);

  if (newEventId) {
    console.log("Success! Redirecting to /events/" + newEventId);
  }
}
```

⚠️ A Note on Expense-to-Activity Linking
In this example, the expenses are linked to the overarching Event. If your UI allows a user to link an expense to a specific activity at the exact time of creation, you would need to adjust Step 2. You would need to .select('id') on the activities insert, get those new activity IDs, and attach them to the specific expenses before running Step 3.

When creating relational data in Supabase, the safest and most standard approach is a multi-step insert. You must first create the parent Event so the database can generate its unique id (UUID). Once you have that id, you attach it to the Activities and Expenses and insert them in bulk.

You can add this directly to your documentation.

### How They Work Together

Let's say you are building an itinerary for a live music show. The data relationships would look like this:

- **Event**: Concert at Cervantes'
- **Activity 1**: "Dinner before the show" (Location: Wendy's, Time: 6:00 PM)
- **Expense A**: $25.00 (Category: Food, Linked to Activity 1)
- **Activity 2**: "Drive to Denver & Park" (Time: 7:00 PM)
- **Expense B**: $15.00 (Category: Transportation, Gas)
- **Expense C**: $20.00 (Category: Parking, Valet)
- **Activity 3**: "The Concert" (Time: 8:00 PM)
- **Expense D**: $80.00 (Category: Tickets)
- **Expense E**: $30.00 (Category: Drinks)

By separating them, you can easily query the itinerary chronologically
(ORDER BY start_time) or
calculate the total cost of the night
(SUM(amount) WHERE event_id = ?) without the data clashing.

### Schema at Glance

## TypeScript 6.0 Interface

## Benefits

✅ **Multiple roles** - Person + Worker in one person  
✅ **History tracking** - Email/address changes over time  
✅ **Granular permissions** - RBAC with fine control  
✅ **Scalable** - Easy to add suppliers, contractors  
✅ **Portable** - Same pattern across projects  
✅ **Audit trail** - Who changed what when

##

## Copy This Pattern

## I'd Like This App to Be Testable

### Testing Approaches in the AHA Stack

- **Unit Testing (Astro & Alpine)**: Individual UI components (Astro) or small behavior snippets (Alpine.js) can be tested in isolation to ensure functionality without requiring a full browser environment.

- ** Integration Testing (htmx)**: Focus on testing server endpoints that return HTML partials, ensuring the rendered HTML interacts correctly with the DOM.

- ** End-to-End (E2E) Testing**: Tools like Playwright or Cypress can be used to simulate user interaction, which is often simpler because the app relies on standard browser behaviors (forms, AJAX requests) rather than complex reactive frameworks.\*

#### Target (Item-Centric Design)

- **categories**: RBAC roles (id, role_name, description)
- **sub_categories**: RBAC roles (id, role_name, description)
- **permissions**: RBAC actions (id, permission_name, resource, action)

[ some of the date may/will viewable by me only,]

# Admin System Implementation Summary

- I'm not sure if Ill use Events or Projects (maybe a Project can contain/include an Even or vise versa
- I'm not sure I need to separate 'users' from 'vistors' (can non-logged-in people view/use/update the site in some form)

### For a Group Project vs Customer substitute the concept of "at_home": person "at_work": worker (employee) instead of cusomers/users

### 1. Backend Admin API

- **File**: `controllers/adminController.js`
- **Endpoints**:
  - `GET /api/admin/users` - List all users with roles
  - `GET /api/admin/users/:humanId` - Get user details
  - `PUT /api/admin/users/:humanId` - Update user info
  - `PUT /api/admin/users/:humanId/email` - Update email
  - `POST /api/admin/users/:humanId/roles` - Assign role
  - `DELETE /api/admin/users/:humanId/roles` - Revoke role
  - `GET /api/admin/roles` - List available roles

- **Security**: All endpoints protected with `requirePermission('users.manage')` middleware
- **Error Handling**: Comprehensive validation, proper HTTP status codes
- **Database**: Uses proper try/finally blocks with connection management

### 2. Admin Dashboard UI

- **File**: `public/admin-dashboard.html`
- **Features**:
  - User listing table with search functionality
  - User detail modal for editing
  - Edit user information (name, email, phone, active status)
  - View current roles
  - Assign roles to users
  - Revoke roles from users
  - Responsive design with proper styling
  - Message notifications for success/error feedback

### 3. Admin Dashboard JavaScript

- **File**: `public/js/admin.js`
- **Functions**:
  - `loadUsers()` - Fetch all users from API
  - `loadAvailableRoles()` - Fetch role options
  - `renderUsersTable()` - Display users in table
  - `openUserDetail()` - Load user detail modal
  - `updateUser()` - Save user changes
  - `updateEmail()` - Change user email
  - `assignRole()` - Add role to user
  - `revokeRole()` - Remove role from user
  - `searchUsers()` - Filter users by name/email
  - `verifyAdminAccess()` - Protect dashboard from non-admins

### 4. Role-Based UI Visibility

- **File**: `public/js/authUI.js` (Updated)
- **Changes**:
  - `showManageEventButton()` - Only admins see this button
  - `showManageEventsButton()` - Only admins see this button
  - `showAddProjectButton()` - Only admins see this button
- **Pattern**: Check for `user.roles.includes('admin')`

### 5. Navigation Updates

- **File**: `public/js/menu.js` (Created)
- **Features**:
  - `renderNavbar()` function to add admin link
  - Admin Panel link appears in navbar for admin users only
  - Link styled in red for visibility
  - Positioned after "Show Events/Projects" link

### 6. Integration

- **File**: `public/js/index.js` (Updated)
- **Changes**:
  - Import `renderNavbar` from menu.js
  - Call `await renderNavbar()` in init() function
  - Admin link automatically appears on home page for admins

## Current Admin Status

- **Test User**: lucy77 (already has admin role assigned)
- **Password**: test123 (from original seeding)
- **Roles**: admin, customer

## How to Use

### For End Users (Admin)

1. Log in with credentials that have `admin` role
2. Home page will show:
   - "Admin Panel" link in navigation (red, styled)
   - "Manage Events" button will be visible
   - "Manage Projects" button will be visible
   - "+ Add Project" button will be visible
3. Click "Admin Panel" to access dashboard
4. In admin dashboard:
   - Search users by name or email
   - Click "Edit" to open user management modal
   - Change user info (name, email, phone, active status)
   - View current roles
   - Add new roles to user
   - Remove roles from user
   - All changes saved to database with email history tracking

### For Developers

- All admin endpoints: `/api/admin/*`
- All protected with: `requirePermission('users.manage')` middleware
- Database integrity: Foreign key constraints enabled
- Connection management: Try/finally pattern prevents connection leaks
- Email tracking: Changes recorded in email_history table

## Database Tables Used

- `humans` - Base user entity
- `email_history` - Temporal email tracking
- `customers` - Customer role data
- `site_roles` - Role definitions
- `human_site_roles` - User ↔ Role assignments
- `permissions` - Permission definitions
- `site_role_permissions` - Role ↔ Permission mappings

## Security Features

1. **Session-Based Auth**: Uses express-session
2. **Role-Based Access Control**: Permission middleware
3. **Email Uniqueness**: Enforced in email_history
4. **Active Role Filtering**: Only active roles/permissions considered
5. **Admin Access Protection**: Dashboard only accessible to admins

## Files Possibly Creeated/Modified

### Created:

- `public/admin-dashboard.html` - Admin UI
- `public/js/admin.js` - Admin functionality
- `test-admin.js` - Test script

### Modified:

- `public/js/authUI.js` - Updated button visibility to require 'admin'
- `public/js/menu.js` - Added renderNavbar function
- `public/js/index.js` - Import and call renderNavbar

### Possibly Implemented ):

- `controllers/adminController.js` - Backend admin API
- `routes/admin.js` - Admin endpoints
- `server.js` - Mount admin routes

## Testing

Run: `node test-admin.js`

- Assigns admin role to existing test user
- Verifies admin system readiness
- Confirms all endpoints are available

### Deployment and Hosting

V0 Vercel: For deploying Next.js applications.

### The app has three parts:

1. The Cash Management Application
2. A REST API that accepts events via POST request (with API key authentication). This needs to run on a remote server so it's always available, even when my computer is off.
3. And can output to dashboard (Event-Dashboard) that displays events in a feed, with search, filtering, and charts. This can run locally.

Each event has: a channel (category like "orders", "signups", "deploys"), a title, an optional description, an optional emoji icon, and optional tags.

Features Event-Dashboard need:

- POST /api/events endpoint that accepts JSON and stores events in the database
- API key authentication (generate a key when creating a project)
- A feed page showing events in reverse chronological order
- Filter events by channel
- Search events by title, description, or tags
- At least one chart showing event activity over time
- The dashboard should update in real-time when new events arrive
- Use a cloud database that's always available (Supabase, Convex, or similar)

### I suppose we could use Neon/Dribble

#####

#####

## Next Steps (Optional Enhancements)

- [ ] Export user data to CSV
- [ ] Batch role assignments
- [ ] User activity logs
- [ ] Role templates for quick setup
- [ ] Scheduled role expirations
- [ ] Admin audit trail

Phase 1 Implementation
Backend Components
vistorsAdminController.js - Business logic for evnet/project management:

getAllParticipants() - Lists all users with project counts
getuserProjects() - Shows which projects/events are used a specific human
mergeusers() - Merges one user into another with transaction safety
findDuplicateusers() - Detects case-insensitive duplicate users (Phase 2/3 prep)
getuserAliases() - Placeholder for Phase 2/3 alias system
users-admin.js - Protected API endpoints:

All endpoints require users.manage permission (admin-only)
Routes for: list users, get events, merge projects, find duplicates
Frontend Components
admin-user.html - user manager UI:

Dark theme matching Web Site design
Merge Tab: Two-step selection (primary + merge user)
Duplicates Tab: Find potential duplicate users
Live project preview before merge
Confirmation modal for safety
users-admin.js - Frontend interactivity:

Load and filter users with search
Select primary and merge users/group
Show project impact preview
Confirm and execute merge
Find duplicates using case-insensitive matching
Defensive error handling
Integration Updates
✅ server.js - Mounted vistorsAdminRouter at /api/admin/users
✅ menu.js - Added "Manage users" link in admin navigation
Key Features
✅ Merge Safety:

Transaction-based (ROLLBACK on error)
Prevents merging vistor into itself
Shows what projects will be affected
Confirmation dialog before execution
✅ Scaling for Phase 2/3:

findDuplicateusers() has placeholder for fuzzy matching
getuserAliases() ready for canonical user system
Database operations designed for alias tables
API structure allows adding fuzzy match threshold
✅ Admin-Only Access:

All endpoints protected by requirePermission('users.manage')
Navigation link only shows for admin users
Follows WebSite auth patterns
How to Use
Log in as admin (lucy77 / test123)
Click "Manage Vistors" in navigation
To Merge:
Step 1: Select primary user (keeps this name)
Step 2: Select user to merge (gets renamed)
Preview shows project impact
Confirm to execute merge
Find Duplicates:
Switch to Duplicates tab
Click "Find Potential Duplicates"
Shows case-insensitive matches (e.g., "in-n-out" vs "In & Out")
Database Impact
Operates on projects.vistor TEXT column (no schema changes needed)
Safe for current SQLite structure
Ready to link to user table (human_id) in Phase 2

The system is designed to handle manual merges now, and
Phase 2 will add fuzzy matching to prevent duplicates from being created in the first place.
Phase 3 will add a canonical user system with aliases.
All code is future-proof for scaling! 🎵
