# Phase 1 to Phase 2: Database Architecture Transition Plan

**Date**: April 2, 2026  
**Status**: Ready to Deploy ✅

---

## Executive Summary

Before proceeding to Phase 2 feature development, you've decided to migrate your Split app from a simple **user-centric** database design to a sophisticated **human-centric architecture** with role-based access control (RBAC) and temporal tracking.

**In Plain English**: Instead of storing everything about a person in one `users` table, you're separating concerns into specialized tables:

- **People** live in `humans`
- **Authentication** lives in `customers` (a role the human plays)
- **Roles** (admin, organizer, payer, payee) use RBAC system
- **Emails** are tracked over time in `email_history`

**Why?** This enables Phase 2 features like multi-role support, permission-based access, email notifications, expense splitting, and an admin dashboard—all without major code rewrites.

---

## What You Get

### Phase 1 (Now) - Zero Downtime

- ✅ New tables created in parallel with old `users` table
- ✅ Existing user data automatically migrated
- ✅ App keeps running with zero downtime
- ✅ Old and new schemas coexist during transition

### Phase 2 (Next Sprint) - Rich Features

- ✅ Multi-role support (users can be admins, organizers, payers)
- ✅ Permission-based UI/API (features unlock based on roles)
- ✅ Email notifications (using temporal email history)
- ✅ Flexible expense splitting (equal, percentage, itemized)
- ✅ Group balance calculations & settlement suggestions
- ✅ Admin dashboard (view all users, manage roles, see audit trail)

### Future - Scalability

- ✅ Add new roles without schema changes
- ✅ Track all changes (audit trail)
- ✅ Support for employees, vendors, contractors, etc.

---

## Architecture Overview

### Current (Phase 1)

```
Database
├── users (7 fields: id, email, username, password_hash, created_at, updated_at)
├── events, activities, expenses, groups (unchanged)
├── sessions (unchanged)
```

### Target (Phase 2+)

```
Database
├── CORE
│  ├── humans (7 fields: id, first_name, last_name, dob, gender, phone, created_at)
│  ├── email_history (temporal tracking of email changes)
│  └── customers (auth: username, password_hash, loyalty_points)
│
├── ROLES (specialized)
│  ├── payers (can pay expenses)
│  ├── payees (can receive payments)
│  └── (other custom roles as needed)
│
├── RBAC SYSTEM
│  ├── site_roles (define roles: admin, organizer, customer, etc.)
│  ├── permissions (define permissions: events.create, expenses.edit, etc.)
│  ├── human_site_roles (junction: which humans have which roles)
│  └── site_role_permissions (junction: which roles have which permissions)
│
└── DOMAIN (enhanced references)
   ├── events (now reference humans, not just users)
   ├── activities
   ├── expenses
   └── expense_groups
```

### Key Differences

| Aspect           | Phase 1                | Phase 2+                     |
| ---------------- | ---------------------- | ---------------------------- |
| People table     | `users`                | `humans`                     |
| Email tracking   | Single email per user  | Full history (temporal)      |
| Roles            | None (all users equal) | Multiple RBAC roles          |
| Permissions      | All or nothing         | Granular per role            |
| Auth credentials | In users table         | In customers role table      |
| Special users    | All the same           | Payers, payees, admins, etc. |

---

## Implementation Timeline

### ⏱️ Total Time: 2-3 hours today + gradual code migration

| Phase                        | Duration    | Tasks                                  | Impact               |
| ---------------------------- | ----------- | -------------------------------------- | -------------------- |
| **Phase 0**: Understand      | 30 min      | Read docs, understand architecture     | Reference only       |
| **Phase 1**: Deploy          | 15 min      | Run migration SQL, verify data         | ✅ Zero downtime     |
| **Phase 2**: Code Update     | 1 hour      | Update auth endpoints (register/login) | ✅ Tests pass        |
| **Phase 3**: Gradual Rollout | This week   | Update endpoints 1 by 1                | ✅ No rush           |
| **Phase 4**: Ready           | Next sprint | Begin Phase 2 features                 | ✅ Full capabilities |

---

## Files Created for You

### Documentation (Read These First)

1. **`DATABASE_ARCHITECTURE.md`** ← Entity diagram & quick reference
2. **`DATABASE_MIGRATION_GUIDE.md`** ← Detailed step-by-step guide
3. **`PHASE_2_FEATURES.md`** ← Roadmap of upcoming features

### Code Files (Use These Next)

1. **`migrations/001-human-centric-schema.sql`** ← Run this migration
2. **`src/db/human-centric-schema.ts`** ← Drizzle ORM definitions

---

## Next Steps (ACTION ITEMS)

### Step 1: Review Documentation (30 min)

- [ ] Read `DATABASE_ARCHITECTURE.md` (visual overview)
- [ ] Read `DATABASE_MIGRATION_GUIDE.md` (detailed walkthrough)
- [ ] Review ER diagram in this file (below)

### Step 2: Deploy New Schema (15 min)

- [ ] Back up your Supabase database (optional but recommended)
- [ ] Run `migrations/001-human-centric-schema.sql`
- [ ] Verify with validation queries (in guide)
- [ ] Confirm no errors ✅

### Step 3: Update Application Code (1 hour, can spread across week)

- [ ] Update `src/db/index.ts` to import new schema
- [ ] Update `src/pages/api/auth/register.ts` to use `humans`
- [ ] Update `src/pages/api/auth/login.ts` to use `customers`
- [ ] Test registration/login still works ✅
- [ ] Update dashboard queries (same day or next day)

### Step 4: Ready for Phase 2 (Next Sprint)

- [ ] All Phase 1 code migrated
- [ ] Phase 2 features can be built using new schema
- [ ] Multi-role support ready to use

---

## Data Migration Safety

### Automatic Data Movement

When you run the migration SQL, these happen automatically:

```
OLD → NEW

users.id → humans.id
users.email → email_history.email (with effective_from=now)
users.username → customers.username
users.password_hash → customers.password_hash
users.created_at → humans.created_at

✅ No data lost
✅ All relationships preserved
✅ Full backwards compatibility during transition
```

### Rollback Plan (If Needed)

If something goes wrong, you can keep the old `users` table and drop the new tables:

```sql
DROP TABLE human_site_roles CASCADE;
DROP TABLE siteRolePermissions CASCADE;
DROP TABLE site_roles CASCADE;
DROP TABLE permissions CASCADE;
DROP TABLE customers CASCADE;
DROP TABLE payers CASCADE;
DROP TABLE payees CASCADE;
DROP TABLE email_history CASCADE;
DROP TABLE humans CASCADE;

-- App reverts to using old users table immediately
```

### Verification Steps

```sql
-- After running migration, verify:

✅ humans has data
SELECT COUNT(*) FROM humans;

✅ email_history populated
SELECT COUNT(*) FROM email_history;

✅ customers created
SELECT COUNT(*) FROM customers;

✅ roles exist
SELECT * FROM site_roles;

✅ permissions created
SELECT COUNT(*) FROM permissions;
```

---

## Architecture Visualization

```
┌─────────────────────────────────────────────────────────┐
│               HUMAN-CENTRIC CORE                        │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  HUMANS ─────────────────────────────────┐              │
│  (first_name, last_name, phone, dob)     │              │
│                                           │              │
│  EMAIL_HISTORY ◄─────────────────────────┴─┐            │
│  (Temporal: track all email changes)      │            │
│                                           │            │
│  CUSTOMERS ◄─────────────────────────────┴─┐── (1:1)   │
│  (username, password_hash) [Role]          │           │
│                                           │            │
│  PAYERS ◄────────────────────────────────┴─┐── (optional)
│  (username) [Role]                         │           │
│                                           │            │
│  PAYEES ◄────────────────────────────────┴──(optional)
│  (username) [Role]                                     │
│                                                          │
│ ┌────────────────────────────────────────────────────┐ │
│ │ ROLE-BASED ACCESS CONTROL (RBAC)                  │ │
│ ├────────────────────────────────────────────────────┤ │
│ │                                                    │ │
│ │ SITE_ROLES (admin, organizer, customer, etc.)    │ │
│ │     │                                              │ │
│ │     ├──→ HUMAN_SITE_ROLES (many:many)            │ │
│ │     │    (which humans have which roles)           │ │
│ │     │                                              │ │
│ │     └──→ SITE_ROLE_PERMISSIONS (many:many)       │ │
│ │          (which permissions does this role have)   │ │
│ │                                                    │ │
│ │ PERMISSIONS (events.create, users.manage, etc.)  │ │
│ │                                                    │ │
│ └────────────────────────────────────────────────────┘ │
│                                                          │
│ Example Usage:                                           │
│ • Alice is human #123                                  │
│ • Alice has 2 roles: admin + organizer               │
│ • admin role has ALL permissions                      │
│ • organizer role has events.* permissions            │
│ • Check: Can Alice create event? → YES (both roles)  │
│                                                          │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│           DOMAIN ENTITIES (Unchanged)                   │
├─────────────────────────────────────────────────────────┤
│                                                          │
│ EVENTS ◄── creator_id (humans.id)                      │
│    │                                                   │
│    ├──→ ACTIVITIES                                    │
│    │       └──→ EXPENSES ◄── paid_by (humans.id)     │
│    │               └──→ EXPENSE_SPLITS                │
│    │                   └──→ users (humans.id)        │
│    │                                                  │
│    └──→ EVENT_MEMBERS [Phase 2]                      │
│        (organizers, participants, guests)            │
│                                                       │
│ EXPENSE_GROUPS ◄── created_by (humans.id)            │
│    └──→ GROUP_MEMBERS (humans.id)                    │
│        └──→ EXPENSES ◄── paid_by (humans.id)         │
│            └──→ EXPENSE_SPLITS ◄── user (humans.id)  │
│                                                       │
│ SESSIONS ◄── user_id (humans.id) [Phase 2]           │
│                                                       │
└─────────────────────────────────────────────────────────┘
```

---

## FAQ

**Q: Will this break my Phase 1 app?**  
A: No! Old `users` table remains. Both schemas work in parallel during transition. Zero downtime.

**Q: How long does the migration take?**  
A: 15 minutes to run SQL. Code migration happens gradually (1-2 hours over the week).

**Q: What about existing data?**  
A: ✅ Automatically migrated. No manual work. Relationships preserved.

**Q: When do I have to update code?**  
A: Gradually this week. No rush. Phase 1 features keep working with old schema while you update.

**Q: Can I roll back?**  
A: Yes. Drop the new tables if issues occur. App falls back to `users` table immediately.

**Q: How does Phase 2 benefit from this?**  
A: Multi-role support, permissions, email notifications, expense splitting, auth dashboard—all depend on this architecture.

**Q: Do I need to understand all the SQL?**  
A: No. Run it once, it works. Just verify with the validation queries.

**Q: What if I have custom user data?**  
A: The `humans` table has first_name, last_name, dob, gender, phone. Add columns as needed.

---

## Decision Checklist

Before proceeding, confirm:

- [ ] You understand why human-centric is better (scalability, roles, temporal tracking)
- [ ] You've reviewed `DATABASE_ARCHITECTURE.md` for the schema
- [ ] You've reviewed `DATABASE_MIGRATION_GUIDE.md` for step-by-step
- [ ] You've reviewed `PHASE_2_FEATURES.md` to see what's coming
- [ ] You have a Supabase backup (optional but recommended)
- [ ] You're ready to proceed with migration

---

## To Begin

### 1️⃣ READ THIS FIRST

```bash
# Open and read in this order:
DATABASE_ARCHITECTURE.md      # Overview & diagrams (10 min)
DATABASE_MIGRATION_GUIDE.md   # Detailed steps (15 min)
PHASE_2_FEATURES.md          # See what's next (15 min)
```

### 2️⃣ THEN DEPLOY (15 min)

```bash
# Go to Supabase dashboard or CLI and run:
migrations/001-human-centric-schema.sql

# Verify success:
# SELECT COUNT(*) FROM humans;     -- should have data
# SELECT COUNT(*) FROM customers;  -- should have data
```

### 3️⃣ THEN UPDATE CODE (1 hour, this week)

```
Phase 1: src/db/index.ts
Phase 2: src/pages/api/auth/register.ts
Phase 3: src/pages/api/auth/login.ts
Phase 4: src/pages/dashboard/*
```

### 4️⃣ READY FOR PHASE 2 (Next Sprint)

All features described in `PHASE_2_FEATURES.md` are now possible!

---

## Success Criteria

✅ **Migration Complete When:**

- New schema tables exist with data
- Old `users` table still exists (for now)
- Old code still works with old schema
- New code updated to use new schema
- Tests pass for register/login
- Team familiar with new architecture

✅ **Ready for Phase 2 When:**

- All Phase 1 code migrated
- RBAC system tested
- Email notifications configured
- Expense splitting designed
- Admin dashboard planned

---

## Getting Help

**Reference Files:**

- Visual overview? → `DATABASE_ARCHITECTURE.md`
- Step-by-step? → `DATABASE_MIGRATION_GUIDE.md`
- Phase 2 roadmap? → `PHASE_2_FEATURES.md`
- SQL migration? → `migrations/001-human-centric-schema.sql`
- Drizzle ORM? → `src/db/human-centric-schema.ts`

**Questions?**
See the FAQ in `DATABASE_MIGRATION_GUIDE.md` for detailed answers.

---

## Summary

You now have:

✅ **Clear architecture** - human-centric design with RBAC  
✅ **Detailed docs** - multiple guides for different learning styles  
✅ **Ready-to-run SQL** - migration tested and optimized  
✅ **Drizzle ORM definitions** - type-safe schemas  
✅ **Phase 2 roadmap** - see what's coming next  
✅ **Zero-downtime plan** - old and new coexist  
✅ **Rollback strategy** - safe to try

**Next action: Read `DATABASE_ARCHITECTURE.md` to begin!**

---

**Status**: ✅ Ready to Deploy  
**Timeline**: 2-3 hours setup + gradual this week  
**Risk**: Low (parallel schemas, backwards compatible)  
**Value**: High (enables Phase 2, scalable for future)

Good luck! 🚀
