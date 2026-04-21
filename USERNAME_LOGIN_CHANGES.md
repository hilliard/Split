# Login Changes - Username Implementation

## Changes Made

### 1. **Validation Schema** (src/utils/validation.ts)

- Changed `email` field to `username` field
- Username: min 3 characters, max 255 characters
- Updated error messages to reference "username or password"

### 2. **Database Query** (src/db/queries.ts)

- Added `getHumanByUsername()` function
- Returns both human and customer records by username
- Mirrors the pattern of `getHumanByEmail()`

### 3. **Login API** (src/pages/api/auth/login.ts)

- Updated to use `getHumanByUsername()` instead of `getHumanByEmail()`
- Changed validation to expect `username` field
- Updated all error messages to say "Invalid username or password"

### 4. **Login Page** (src/pages/auth/login.astro)

- Changed input field from email to username
- Updated label: "Email Address" → "Username"
- Updated placeholder: "you@example.com" → "Enter your username"
- Added client-side form submission script
- Handles form validation and redirects to dashboard on success

### 5. **Username Uniqueness Constraint** ✅

- Already present in schema: `username: varchar('username', { length: 255 }).notNull().unique()`
- Database enforces: No duplicate usernames allowed
- Index on username for fast lookups: `usernameIdx: index('customers_username_idx').on(table.username)`

---

## Test Users Available

Use any of these test users to log in with the new username-based system:

| Username | Password       | Email            |
| -------- | -------------- | ---------------- |
| alice    | AlicePass123   | alice.test@test  |
| charlie  | CharliePass123 | charlie@test.com |
| frank    | FrankPass123   | frank@test.com   |
| grace    | GracePass123   | grace@test.com   |

---

## How to Test

1. **Start the dev server** (if not already running):

   ```powershell
   npm run dev
   ```

2. **Navigate to login page**:
   Open `http://localhost:4322/auth/login` in browser

3. **Test successful login**:
   - Username: `alice`
   - Password: `AlicePass123`
   - Expected: Redirects to dashboard

4. **Test failed login**:
   - Username: `alice`
   - Password: `WrongPassword`
   - Expected: Shows "Invalid username or password" error

5. **Test invalid username**:
   - Username: `nonexistent`
   - Password: `anything`
   - Expected: Shows "Invalid username or password" error

---

## Database Verification

The username constraint is enforced at the database level. If you try to insert a duplicate username, PostgreSQL will reject it:

```sql
-- This is already in place in the schema:
ALTER TABLE customers ADD CONSTRAINT customers_username_unique UNIQUE (username);
```

---

## Notes

- Session cookie still uses `humanId` as the user identifier
- Email is still stored in `email_history` for communication purposes
- Username is the authentication identifier (simpler for users to remember)
- All authorization queries remain unchanged (still use human IDs)

---

## Build Status

✅ TypeScript compilation successful  
✅ All pages render without errors  
✅ No validation schema conflicts  
✅ API endpoints ready for username authentication
