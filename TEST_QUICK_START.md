# Quick Start: Testing Your App

## 1. Run Unit Tests

```bash
npm run test
```

### Expected Output:

```
✓ src/utils/validation.test.ts (14 tests)
✓ src/utils/password.test.ts (5 tests)
✓ src/pages/api/activities/create.test.ts (11 tests)

PASS (30 tests) in 2.5s
```

### What You'll See:

- ✓ Green checkmarks = tests passing
- ✗ Red X = tests failing
- Each test is listed with its name

---

## 2. Run Tests in Watch Mode (Development)

```bash
npm run test -- --watch
```

### Why Use Watch Mode?

- Tests re-run automatically when you save files
- Great for test-driven development
- Gives instant feedback

### How to Use:

1. Open two terminals
2. One: Run `npm run dev` (your app)
3. Other: Run `npm run test -- --watch` (tests)
4. Make changes to code
5. Tests automatically re-run - you see results instantly

---

## 3. Run Tests with Visual UI

```bash
npm run test:ui
```

Opens dashboard at `http://localhost:51204/__vitest__/` (or similar port)

### Benefits:

- Visual interface to see tests pass/fail
- Browse test files
- Search for specific tests
- See detailed error messages
- Run individual tests

---

## 4. Run E2E Tests

```bash
npm run e2e
```

### What E2E Tests Do:

- Launch a real browser
- Simulate user interactions
- Test complete workflows
- Much slower than unit tests

### Example Test:

```
✓ Activities Management > should display activities page for an event
✓ Activities Management > should create a new activity
✓ Activities Management > should edit existing activity
```

---

## 5. Run E2E Tests in Headed Mode (See Browser)

```bash
npm run e2e -- --headed
```

Watch the browser automatically:

- Click buttons
- Fill forms
- Verify page changes
- Test everything visually

---

## 6. Run E2E Tests in Debug Mode

```bash
npm run e2e:debug
```

Step through each action:

- Pause between steps
- Inspect elements
- Modify test behavior on-the-fly

---

## Test Files in This Project

### Unit Tests (Fast - milliseconds)

| File                                      | What It Tests                   | Tests                                                     |
| ----------------------------------------- | ------------------------------- | --------------------------------------------------------- |
| `src/utils/validation.test.ts`            | Form validation schemas         | Registration, login, events, activities, groups, expenses |
| `src/utils/password.test.ts`              | Password hashing & verification | Hash generation, verification, edge cases                 |
| `src/pages/api/activities/create.test.ts` | Activity API validation         | Input validation, error handling, optional fields         |

### E2E Tests (Slower - seconds)

| File                       | What It Tests                                   |
| -------------------------- | ----------------------------------------------- |
| `tests/activities.spec.ts` | Create, edit, delete activities in real browser |

---

## Example: Watching Tests During Development

### Scenario: You're adding a new validation rule

```bash
# Terminal 1
npm run dev
# Your app starts at http://localhost:4322

# Terminal 2
npm run test -- --watch
# Tests run and watch for changes
```

### You: Edit validation.ts

```typescript
// Add new rule: Activity title must include an action word
const createActivitySchema = z.object({
  title: z
    .string()
    .min(1)
    .refine(
      (v) => /^(do|make|book|cook|visit|plan)/i.test(v),
      "Activity title must start with action verb",
    ),
});
```

### Tests: Automatically re-run

```
✗ Activities API Validation > should accept minimal valid activity (FAILED)
  Expected: "Get coffee" to match /^(do|make|book|cook|visit|plan)/i

Run tests to see details → npm run test
```

### You: Add test for the new rule

```typescript
it("should require activity title to start with action verb", () => {
  const invalidData = {
    eventId: valid - uuid,
    title: "Coffee", // ✗ Doesn't start with action
  };
  expect(() => createActivitySchema.parse(invalidData)).toThrow();
});

it("should accept activity starting with action verb", () => {
  const validData = {
    eventId: valid - uuid,
    title: "Get coffee", // ✓ Starts with "Get"
  };
  expect(() => createActivitySchema.parse(validData)).not.toThrow();
});
```

### Tests: Pass!

```
✓ Activities API Validation > should require activity title to start with action verb
✓ Activities API Validation > should accept activity starting with action verb
```

---

## What Each Test Type Does

### Unit Tests (Vitest)

```typescript
describe("Feature", () => {
  it("should do something", () => {
    // Test ONE function in isolation
    const result = myFunction(input);
    expect(result).toBe(expected);
  });
});
```

**When to use:** Testing validation, calculations, utilities
**Speed:** ⚡ Fast (milliseconds)
**Coverage:** Single functions

### E2E Tests (Playwright)

```typescript
test("should create activity", async ({ page }) => {
  // Test ENTIRE workflow in real browser
  await page.goto("http://localhost:4322/activities");
  await page.fill('input[name="title"]', "Breakfast");
  await page.click('button:has-text("Add Activity")');
  await expect(page.locator("text=Breakfast")).toBeVisible();
});
```

**When to use:** Testing complete user workflows
**Speed:** 🐢 Slow (seconds)
**Coverage:** Multiple screens/features

---

## Common Test Commands

```bash
# Run all tests once
npm run test

# Run tests and watch for changes
npm run test -- --watch

# Run specific test file
npm run test -- src/utils/validation.test.ts

# Run tests with UI dashboard
npm run test:ui

# Run E2E tests
npm run e2e

# Run E2E tests in headed mode (see browser)
npm run e2e -- --headed

# Run E2E tests in debug mode
npm run e2e:debug

# Run E2E tests with UI
npm run e2e:ui
```

---

## Reading Test Output

### ✅ Test Passes

```
✓ Password Utilities > should hash a password (15ms)
```

- ✓ = PASS
- Section name = describe block
- Test name = it block
- 15ms = test duration

### ❌ Test Fails

```
✗ Validation Schemas > should reject invalid email (8ms)
  AssertionError: expected "test@example.com" to throw
    Expected: throws
    Received: no error
```

- ✗ = FAIL
- Shows what was expected vs received
- Shows exact assertion that failed

---

## Fixing a Failing Test

### Step 1: Read the error

```
✗ should reject invalid email
  Expected () to throw
  Received: no error
```

### Step 2: Check the test

```typescript
it("should reject invalid email", () => {
  const schema = z.object({
    email: z.string().email(),
  });

  // This is NOT throwing an error!
  expect(() => schema.parse({ email: "invalid" })).toThrow();
});
```

### Step 3: Fix either test or code

Option A: Fix the code (if it's wrong):

```typescript
expect(() => schema.parse({ email: "invalid" })).toThrow();
// will NOW throw because 'invalid' fails email validation
```

Option B: Fix the test (if test is wrong):

```typescript
// Had wrong expectations
expect(() => schema.parse({ email: "valid@example.com" })).not.toThrow();
```

### Step 4: Test passes ✓

```
✓ Validation Schemas > should reject invalid email
```

---

## Next Steps

1. **Run the tests**: `npm run test`
2. **Open the dashboard**: `npm run test:ui`
3. **Watch tests**: `npm run test -- --watch`
4. **Add more tests** for other features (events, expenses, etc.)
5. **Run E2E tests**: `npm run e2e`

---

## Tips for Success

### ✅ Good Testing Habits

- Run tests before committing code
- Write tests for everything that matters
- Read test failures completely
- Keep tests simple and clear
- One assertion per test is best

### ❌ Common Mistakes

- Testing implementation instead of behavior
- Tests that depend on other tests running first
- Tests that are too complex
- Ignoring failing tests
- Not running tests during development

---

## Coverage Reports

To see which code is covered by tests:

```bash
npm run test -- --coverage
```

Opens: `coverage/index.html` in your browser

Shows:

- % of code covered by tests
- Which lines are NOT tested
- Which functions are NOT tested

Goal: 80%+ coverage for critical features

---

## Enjoy Testing! 🎉

Tests make you confident that your code works. They catch bugs early and make refactoring safe.

Run `npm run test:ui` right now to see your tests in action!
