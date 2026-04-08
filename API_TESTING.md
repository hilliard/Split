# API Documentation & Testing Guide

This guide covers how to document, test, and use the Invitation System APIs.

## 📚 Table of Contents

1. [API Reference](#api-reference)
2. [Testing Methods](#testing-methods)
3. [Getting Started](#getting-started)
4. [Postman Setup](#postman-setup)
5. [Automated Testing](#automated-testing)
6. [CI/CD Integration](#cicd-integration)

---

## API Reference

See **[API.md](./API.md)** for complete endpoint documentation including:
- Request/response examples
- Error codes and messages
- Required authentication
- Field validation rules
- Data models

**Quick Links:**
- `POST /api/groups/{id}/invite` - Send invitation
- `POST /api/groups/invitations/accept` - Accept invitation
- `POST /api/groups/invitations/decline` - Decline invitation
- `GET /api/dashboard/pending-invitations` - List pending invitations
- `GET /api/groups/{id}/members` - List group members

---

## Testing Methods

### Method 1: Postman (Recommended for Manual Testing)

**Best for:** Interactive testing, exploring responses, debugging

**Features:**
- Visual request builder
- Auto-save responses
- Integrated test assertions
- Share with team
- API monitoring

**Setup:**
1. Import `invitations.postman_collection.json` into Postman
2. Set up variables (sessionId, groupId, etc.)
3. Run requests individually or as test suite
4. View formatted responses

**Steps:**
```
1. File > Import
2. Select "invitations.postman_collection.json"
3. Click "Setup" folder to login and create test data
4. Run individual requests or collection
5. Check test results in "Test Results" tab
```

**Pre-built Test Cases Included:**
- ✅ Send valid invitation
- ✅ Reject invalid email
- ✅ Reject without auth
- ✅ Accept invitation
- ✅ Decline invitation
- ✅ List pending invitations
- ✅ Get group members

---

### Method 2: Automated Testing with Vitest

**Best for:** CI/CD pipelines, regression testing, code coverage

**Files:**
- Tests: `src/tests/api/invitations.test.ts`
- Run: `npm run test`

**Features:**
- Fast unit/integration tests
- Code coverage reports
- Easy CI/CD integration
- Test data cleanup

**Example Test:**
```typescript
it('should create a pending invitation', async () => {
  const invitationId = uuid();
  
  await db.insert(pendingGroupInvitations).values({
    id: invitationId,
    groupId: testGroup.id,
    email: 'testb@example.com',
    // ... more fields
  });

  const [invitation] = await db.select()
    .from(pendingGroupInvitations)
    .where(eq(pendingGroupInvitations.id, invitationId));

  expect(invitation.status).toBe('pending');
});
```

**Run Tests:**
```bash
npm run test                    # Run all tests
npm run test -- --run          # Non-watch mode
npm run test -- --coverage     # With coverage report
npm run test src/tests/api     # Specific folder
```

---

### Method 3: cURL/PowerShell (Quick Command Line)

**Best for:** Quick testing, scripting, CI/CD without Postman

**Examples:**

**Login and Get Session:**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "user_a", "password": "password123"}' \
  -c cookies.txt
```

**Send Invitation:**
```bash
curl -X POST http://localhost:3000/api/groups/{groupId}/invite \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"email": "friend@example.com"}'
```

**PowerShell Example:**
```powershell
# Login
$response = Invoke-WebRequest -Uri "http://localhost:3000/api/auth/login" `
  -Method POST `
  -ContentType "application/json" `
  -Body '{"username":"user_a","password":"password123"}' `
  -SessionVariable session

# Send Invite
$body = @{email="friend@example.com"} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:3000/api/groups/{groupId}/invite" `
  -Method POST `
  -ContentType "application/json" `
  -Body $body `
  -WebSession $session
```

---

## Getting Started

### 1. Basic Setup

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm run test
```

### 2. Import Postman Collection

```
1. Open Postman
2. Click "Import" button
3. Select "invitations.postman_collection.json"
4. Collection appears in left sidebar
5. Update {{groupId}} variable with actual group ID
6. Run "Setup" folder first (login, create group)
```

### 3. Create Test Data

Before testing, you need:
- User account (register via UI or API)
- Group (create via API or UI)
- Session cookie (from login)

**Via Postman:**
1. Run "Setup" > "1. Login as User A"
2. Run "Setup" > "2. Create Test Group"

**Via API Directly:**
```bash
# Register user
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Login to get session
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test@example.com","password":"password123"}'
```

---

## Postman Setup

### Import Collection

1. Download `invitations.postman_collection.json`
2. In Postman: File → Import → Select file
3. Collection loads with all endpoints

### Configure Variables

**Collection Variables:**
```
- groupId: UUID of test group
- invitationId: UUID of test invitation (auto-set)
- testEmail: Unique email for each test
- sessionId: Session cookie (auto-set after login)
```

**Edit in Postman:**
- Click collection name → Variables tab
- Update `groupId` with your actual group ID
- Other variables auto-set by tests

### Run Tests

**Individual Request:**
1. Select any request from sidebar
2. Click "Send"
3. View response in "Body" tab
4. Check assertions in "Tests" tab

**Full Collection:**
1. Click "..." next to collection name
2. Select "Run collection"
3. Runner opens with all requests
4. Click "Run" to execute all
5. View results and test outputs

**Pre-Test Requirements:**
- Be logged in (sessionId set)
- Have valid groupId
- Sufficient permissions

---

## Automated Testing

### Writing New Tests

**Test Structure:**
```typescript
describe('Endpoint Name', () => {
  before(() => {
    // Setup test data
  });

  it('should do something', async () => {
    // Execute test
    // Assert results
  });

  after(() => {
    // Cleanup
  });
});
```

**Example:**
```typescript
it('should create pending invitation', async () => {
  const invitationId = uuid();
  
  // Create
  await db.insert(pendingGroupInvitations).values({
    id: invitationId,
    groupId: testGroup.id,
    email: 'user@example.com',
    // ... fields
  });

  // Verify
  const [result] = await db.select()
    .from(pendingGroupInvitations)
    .where(eq(pendingGroupInvitations.id, invitationId));

  expect(result.email).toBe('user@example.com');
});
```

### Run with Coverage

```bash
npm run test -- --coverage
```

Creates coverage report in `coverage/` directory.

### Watch Mode for Development

```bash
npm run test  # Auto-runs on file changes
```

---

## CI/CD Integration

### GitHub Actions Example

```yaml
name: API Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_DB: test_db
          POSTGRES_PASSWORD: password
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
    
    steps:
      - uses: actions/checkout@v3
      
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      
      - run: npm install
      
      - run: npm run test -- --coverage
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/coverage-final.json
```

### Pre-commit Hooks

Add to `.husky/pre-commit`:
```bash
npm run test -- --run
```

Ensures tests pass before commits.

---

## Best Practices

### 1. API Documentation
- ✅ Keep API.md updated with endpoint changes
- ✅ Include request/response examples
- ✅ Document all error cases
- ✅ Update when adding new fields

### 2. Postman Collection
- ✅ Update collection with new endpoints
- ✅ Add test assertions for validation
- ✅ Use variables for reusable values
- ✅ Export and commit to version control

### 3. Automated Tests
- ✅ Write tests for new endpoints
- ✅ Test happy paths + error cases
- ✅ Clean up test data (afterAll)
- ✅ Keep tests fast and isolated

### 4. Code Review
- ✅ Require updated API docs
- ✅ Check new tests added
- ✅ Verify backward compatibility
- ✅ Test manually before merge

---

## Troubleshooting

### Tests Won't Run
```bash
# Check test file syntax
npm run test src/tests/api/invitations.test.ts

# View detailed error
npm run test -- --reporter=verbose
```

### Database Connection Issues
```bash
# Verify DATABASE_URL in .env.local
echo $DATABASE_URL

# Test connection
node test-db-connection.js
```

### Postman Not Working
- Verify sessionId is set (login first)
- Check groupId matches actual group
- Ensure server is running (npm run dev)
- Clear Postman cache (Settings → Cache)

---

## Resources

- **API Documentation**: [API.md](./API.md)
- **Testing Guide**: [INVITATION_TESTING_GUIDE.md](./INVITATION_TESTING_GUIDE.md)
- **Postman Collection**: [invitations.postman_collection.json](./invitations.postman_collection.json)
- **Test Files**: [src/tests/api/invitations.test.ts](./src/tests/api/invitations.test.ts)

---

## Summary

| Method | Use Case | Effort | Best For |
|--------|----------|--------|----------|
| **Postman** | Manual testing | Low | Developers, debugging |
| **Vitest** | Automated testing | Medium | CI/CD, regression |
| **cURL/CLI** | Quick testing | Very Low | Scripts, one-offs |

**Recommended Flow:**
1. Use Postman for manual testing during development
2. Write Vitest tests for critical paths
3. Run full suite before commits
4. CI/CD runs tests on every push

---

## Next Steps

1. **Try Postman**: Import collection and run a few tests
2. **Write a Test**: Add a test case to `invitations.test.ts`
3. **Set Up CI/CD**: Add test job to your GitHub Actions
4. **Document**: Keep API.md in sync with code changes

Questions? Check the docs or create an issue!
