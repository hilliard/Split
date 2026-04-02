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

- Events are the primary entity, Users will create an event, add a group and possibly add activities to the event
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
  ** Astro 6 SSR**
  **HTMX 2 + Alpine.js**
  - [Alpine.js](https://alpinejs.dev/) (used for lightweight client-side state,
    dialogs, and sidebar toggling, specifically utilizing the
    `@alpinejs/collapse` plugin)
  - [HTMX2](https://htmx.org/) (used for fetching and injecting dynamic HTML,
    e.g., the links grid and search bar functionality via `/api/links/html`)
- **Styling:** Tailwind CSS (Dark/Light mode native support)
- **TypeScript 6.0** the final major release based on the original JavaScript
  codebase
- **Tailwind CSS v4**
- **Zod:** For form and server-side validation

- **PostgreSQL + Drizzle ORM** (Neon?)database with built-in auth (like Neon) so
  registration, login, and session management are handled for you. Store
  money as integer cents to avoid floating-point rounding issues.

  -**Vitest** Test Framework It is Jest-compatible and works for backend code too. -**Playwright** enables reliable end-to-end testing for modern web apps.

## Possible Deployment

**Deployed on:** Railway\*\*

## Core Architecture & State Management

- **Authentication:** Custom session/cookie-based (`userId` cookie corresponding
  to an sqlite `humans` table record).
- **Client-Side State (Alpine + localStorage):**

  The Alpine.js component watches and syncs local state directly to `localStorage`:

## Consider Neon/Drizzle

```
npm i drizzle-orm @neondatabase/serverless dotenv
npm i -D drizzle-kit tsx
```

## Implementation Phases

### Phase 1: Foundation & Authentication (Week 1)

- [ ] Project initialization (Astro, dependencies, Git setup)
- [ ] Database schema design & migrations
- [ ] User registration & login pages
- [ ] Session management & protected routes
- [ ] Basic dashboard layout (responsive, dark/light mode)

### Phase 2: Core Features (Week 2)

- [ ] Event & Activity creation
- [ ] Expense group management
- [ ] Invite users to groups
- [ ] Add/edit expenses
- [ ] Basic balance calculations

### Phase 3: UI/UX & Notifications (Week 3)

- [ ] Dashboard enhancements (events list, groups list)
- [ ] Expense settlement notifications/indicators
- [ ] Mobile optimization (75% of users)
- [ ] ARIA compliance & semantic HTML
- [ ] Dark/Light mode toggle

### Phase 4: Testing & Deployment (Week 4)

- [ ] E2E tests (Playwright)
- [ ] Unit tests (Vitest)
- [ ] Go-live checklist
- [ ] Railway deployment

## Database Schema (Drizzle ORM)

### Tables

```
users
  - id (UUID)
  - email (TEXT)
  - password_hash (TEXT)
  - username (TEXT)
  - created_at (TIMESTAMP)
  - updated_at (TIMESTAMP)

events
  - id (UUID)
  - creator_id (FK: users.id)
  - name (TEXT)
  - description (TEXT)
  - created_at (TIMESTAMP)

activities
  - id (UUID)
  - event_id (FK: events.id)
  - name (TEXT)
  - created_at (TIMESTAMP)

expense_groups
  - id (UUID)
  - name (TEXT)
  - created_by (FK: users.id)
  - created_at (TIMESTAMP)

group_members
  - id (UUID)
  - group_id (FK: expense_groups.id)
  - user_id (FK: users.id)
  - invited_at (TIMESTAMP)
  - joined_at (TIMESTAMP)

expenses
  - id (UUID)
  - group_id (FK: expense_groups.id)
  - activity_id (FK: activities.id, nullable)
  - paid_by (FK: users.id)
  - amount (INTEGER - in cents)
  - description (TEXT)
  - created_at (TIMESTAMP)

expense_splits
  - id (UUID)
  - expense_id (FK: expenses.id)
  - user_id (FK: users.id)
  - amount (INTEGER - in cents)

balances (view or calculated)
  - group_id (FK: expense_groups.id)
  - debtor_id (FK: users.id)
  - creditor_id (FK: users.id)
  - amount_owed (INTEGER - in cents)
```

## API Endpoints

### Auth

- POST `/api/auth/register` - Register new user
- POST `/api/auth/login` - Login user
- POST `/api/auth/logout` - Logout user
- GET `/api/auth/me` - Get current user

### Events

- GET `/api/events` - List user's events
- POST `/api/events` - Create event
- GET `/api/events/:id` - Get event details
- POST `/api/events/:id/activities` - Add activity

### Groups

- GET `/api/groups` - List user's groups
- POST `/api/groups` - Create group
- GET `/api/groups/:id` - Get group details & members
- POST `/api/groups/:id/members` - Invite member (email)
- GET `/api/groups/:id/balances` - Get settlement balances

### Expenses

- POST `/api/groups/:groupId/expenses` - Create expense
- GET `/api/groups/:groupId/expenses` - List group expenses
- PUT `/api/expenses/:id` - Edit expense
- DELETE `/api/expenses/:id` - Delete expense
- GET `/api/groups/:groupId/summary` - Get group summary

## Key Directories / Files

- `src/pages/index.astro`: Landing/dashboard layout
- `src/pages/auth/login.astro`: Login page
- `src/pages/auth/register.astro`: Registration page
- `src/pages/dashboard/[...rest].astro`: Protected dashboard routes
- `src/components/`: Reusable UI components
- `src/api/`: API route handlers
- `src/utils/balance-calculator.ts`: Balance calculation logic
- `db/schema.ts`: Drizzle schema definitions
- `db/migrations/`: Migration files
- `tests/`: Vitest & Playwright tests
  (or whatever Neon does here)
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
- **event**: Base entity for all events (id, title, description, type, status)
- **activity**: Base entity for all people (id, first_name, last_name, dob, gender, phone)
- **customers**: Role table (human_id, username, password_hash, loyalty_points)
- **groupname**: Group table (id, name, description)
- **users**: Role table (human_id, stage_name, bio, website)
- **payee**: payee table (human_id, username) [Recieves Money]
- **payor**: payor table (human_id, username) [Recieves Money]
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

### Neon

**Project Name:** Split
**Project ID:** snowy-lab-71291591
**Connection String:**
postgresql://neondb_owner:npg_0lxTYBLMgh2r@ep-twilight-flower-anebzpau-pooler.c-6.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require

### NPX Integration Command

npx neonctl@latest init
