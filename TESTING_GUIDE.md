# Testing Guide - Split Expense Tracker App

## Overview

This application uses a two-tier testing strategy:

1. **Unit Tests (Vitest)** - Test individual functions and logic in isolation
2. **E2E Tests (Playwright)** - Test complete user workflows in a real browser

## Testing Tools

### Vitest

- **What it does**: Runs unit tests quickly in Node.js environment
- **Speed**: Extremely fast (milliseconds per test)
- **Use for**: Validation, utilities, business logic, API logic
- **Coverage**: Single functions and modules

### Playwright

- **What it does**: Launches a real browser and tests the full application
- **Speed**: Slower (seconds per test)
- **Use for**: User interactions, full workflows, UI behavior
- **Coverage**: Complete features from user login to expense splitting

---

## Unit Tests (Vitest)

### What Are Unit Tests?

Unit tests verify that **individual functions work correctly in isolation**. They're fast and help catch bugs early.

```typescript
// Example: Testing a password hash function
it('should hash a password', async () => {
  const password = 'mySecurePassword123';
  const hash = await hashPassword(password);

  expect(hash).not.toBe(password); // Hash should differ from original
});
```

### Test Structure

Every test follows this pattern:

```typescript
describe('Feature Name', () => {
  // Group related tests
  it('should do something', () => {
    // Individual test case
    // ARRANGE: Set up test data
    const input = { name: 'Alice' };

    // ACT: Call the function
    const result = processInput(input);

    // ASSERT: Verify the result
    expect(result.name).toBe('Alice');
  });
});
```

### Types of Unit Tests

#### 1. Validation Tests

Test that input validation works correctly:

```typescript
// ✅ Valid input should pass
it('should accept valid email', () => {
  expect(() => schema.parse({ email: 'user@example.com' })).not.toThrow();
});

// ❌ Invalid input should fail
it('should reject invalid email', () => {
  expect(() => schema.parse({ email: 'not-an-email' })).toThrow();
});
```

#### 2. Password Security Tests

Test password hashing and verification:

```typescript
it('should verify correct password', async () => {
  const password = 'myPassword123';
  const hash = await hashPassword(password);
  const isValid = await verifyPassword(password, hash);
  expect(isValid).toBe(true);
});

it('should reject wrong password', async () => {
  const hash = await hashPassword('password123');
  const isValid = await verifyPassword('wrongPassword', hash);
  expect(isValid).toBe(false);
});
```

#### 3. API Request Validation Tests

Test that API endpoints validate incoming data correctly:

```typescript
it('should reject activity without title', () => {
  const invalidData = {
    eventId: 'valid-uuid',
    title: '', // ❌ Empty!
  };
  expect(() => createActivitySchema.parse(invalidData)).toThrow();
});
```

### Testing Best Practices

#### ✅ DO:

- Test **one thing per test case**
- Use **descriptive test names** that explain what should happen
- Test **both valid and invalid inputs**
- Test **edge cases** (empty strings, null values, very large inputs)

#### ❌ DON'T:

- Write tests that depend on other tests running first
- Test implementation details instead of behavior
- Make tests too complex
- Skip error cases

---

## E2E Tests (Playwright)

### What Are E2E Tests?

E2E tests verify that **complete workflows work from start to finish** using a real browser.

```typescript
// Example: User registers and logs in
it('should register and login successfully', async ({ page }) => {
  // Navigate to signup
  await page.goto('http://localhost:3000/auth/register');

  // Fill form
  await page.fill('input[name="email"]', 'alice@example.com');
  await page.fill('input[name="password"]', 'SecurePass123');
  await page.click('button:has-text("Register")');

  // Verify success
  await expect(page).toHaveURL('http://localhost:3000/dashboard');
});
```

### When to Use E2E Tests

Use E2E tests for:

- ✅ Complete user workflows (signup, login, create event, add activity)
- ✅ Navigation flows
- ✅ Form submissions
- ✅ Data persistence across pages
- ❌ Don't use for: Simple validation or utility function testing

---

## Running Tests

### Run All Unit Tests

```bash
npm run test
```

### Run Tests in Watch Mode (auto-rerun on file changes)

```bash
npm run test -- --watch
```

### Run Tests with UI (visual interface)

```bash
npm run test:ui
```

### Run Specific Test File

```bash
npm run test -- src/utils/validation.test.ts
```

### Run E2E Tests

```bash
npm run e2e
```

### Run E2E Tests in Debug Mode

```bash
npm run e2e:debug
```

### View E2E Tests in UI

```bash
npm run e2e:ui
```

---

## Test Examples in This Project

### 1. Validation Tests (`src/utils/validation.test.ts`)

Tests all data validation schemas:

```typescript
// Tests registerSchema
✓ should validate correct registration
✓ should reject invalid email
✓ should reject short username
✓ should reject short password
✓ should reject mismatched passwords

// Tests createActivitySchema
✓ should validate a valid activity
✓ should reject invalid event ID
✓ should require activity name
```

### 2. Password Tests (`src/utils/password.test.ts`)

Tests password hashing and verification:

```typescript
✓ should hash a password
✓ should produce different hashes for same password
✓ should return true for correct password
✓ should return false for incorrect password
✓ should be case-sensitive
```

### 3. API Tests (`src/pages/api/activities/create.test.ts`)

Tests the activity creation endpoint validation:

```typescript
✓ should reject invalid event ID
✓ should reject empty title
✓ should accept minimal valid activity
✓ should handle optional location name
✓ should reject too long title
```

---

## Core Features to Test

### 1. User Management

- [ ] Registration validation (email, password, username)
- [ ] Password hashing and verification
- [ ] Login/logout flow
- [ ] Session management
- [ ] Password reset

### 2. Events

- [ ] Create event
- [ ] Edit event
- [ ] Delete event
- [ ] List user's events
- [ ] Add participants

### 3. Activities

- [x] Create activity (test added)
- [ ] Edit activity
- [ ] Delete activity
- [ ] List event activities
- [ ] Time validation (start < end)

### 4. Expenses

- [ ] Create expense
- [ ] Verify split calculations
- [ ] Settle expenses
- [ ] Calculate who owes whom
- [ ] Export expense report

### 5. Groups

- [ ] Create group
- [ ] Add members
- [ ] Remove members
- [ ] Manage permissions
- [ ] Delete group

---

## Example: Writing a New Test

### Step 1: Identify what to test

"I want to ensure that event creation rejects events with no name"

### Step 2: Write the test

```typescript
import { describe, it, expect } from 'vitest';
import { createEventSchema } from '@/utils/validation';

describe('Event Creation', () => {
  it('should reject event with no name', () => {
    const invalidData = {
      name: '',
      description: 'A party',
    };
    expect(() => createEventSchema.parse(invalidData)).toThrow();
  });
});
```

### Step 3: Run the test

```bash
npm run test -- src/utils/validation.test.ts
```

### Step 4: See it pass

```
✓ Event Creation > should reject event with no name (2ms)
```

---

## Testing Philosophy

### Test Coverage Goals

- **High-risk code** (authentication, payments, data validation): 80-100% coverage
- **Business logic** (calculations, rules): 70-80% coverage
- **UI/presentation**: Use E2E tests instead of unit tests
- **Utilities**: 100% coverage (they're foundational)

### What NOT to Test

- Third-party libraries (bcrypt, zod, etc. - assume they work)
- Framework features (Astro routing, Drizzle ORM)
- Minor UI styling
- Implementation details that users can't observe

### What TO Test

- Your validation logic
- Your calculation logic
- Your API request/response handling
- Your error cases
- Your user workflows (E2E)

---

## Continuous Testing

### Run Tests Before Committing

```bash
npm run test  # Run all unit tests
npm run e2e   # Run all E2E tests
```

### Add Tests for Every Bug Fix

When you fix a bug:

1. Write a test that demonstrates the bug
2. Fix the bug
3. Verify the test passes
4. This prevents regression (the bug coming back)

### Use Watch Mode During Development

```bash
npm run test -- --watch
```

This re-runs tests automatically as you code, giving instant feedback.

---

## Coverage Reports

To see which code is covered by tests:

```bash
npm run test -- --coverage
```

This generates HTML coverage report in `coverage/` folder.

---

## Next Steps

1. **Run the tests**: `npm run test`
2. **Watch the tests**: `npm run test -- --watch`
3. **Add more tests for activities**: Edit `src/pages/api/activities/create.test.ts`
4. **Write E2E test for activity creation**: Create `tests/activities.spec.ts`
5. **Run all tests regularly** before pushing code

---

## Resources

- [Vitest Documentation](https://vitest.dev)
- [Playwright Documentation](https://playwright.dev)
- [Testing Best Practices](https://martinfowler.com/bliki/TestPyramid.html)
